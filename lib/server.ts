import { cookies } from 'next/headers';
import {workspaceError,serverKeyHeaders} from './supabase-errors';
export class AppError extends Error { constructor(message:string,public status=500){super(message);} }
export function reply(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});}
export function failure(e:unknown){if(e instanceof AppError)return reply({error:e.message},e.status);console.error('AirDesk request failed:',e instanceof Error?e.message:'Unknown error');return reply({error:'Unable to complete this request. Please try again.'},500);}
export function origin(request:Request){const value=request.headers.get('origin');let from:URL;try{from=new URL(value||'');}catch{throw new AppError('Please use this workspace to submit the request.',403);}const host=request.headers.get('host')||new URL(request.url).host;if(!['https:','http:'].includes(from.protocol)||from.host!==host)throw new AppError('Please use this workspace to submit the request.',403);}
export function config(){
 const rawUrl=process.env.SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),publicKey=process.env.SUPABASE_ANON_KEY?.trim(),owner=process.env.AIRDESK_OWNER_EMAIL?.trim().toLowerCase();
 if(!rawUrl||!key||!publicKey||!owner)throw new AppError('Workspace setup is not complete. Set all four AirDesk environment variables in Vercel and redeploy. [CONFIG_MISSING]',503);
 let parsed:URL;try{parsed=new URL(rawUrl);}catch{throw new AppError('SUPABASE_URL must be the project URL, such as https://project-id.supabase.co. [CONFIG_URL]',503);}
 if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password||parsed.search||parsed.hash||!['','/'].includes(parsed.pathname))throw new AppError('SUPABASE_URL must be the project URL without /rest/v1, /auth/v1 or a dashboard path. [CONFIG_URL]',503);
 if(key.startsWith('sb_publishable_')||key===publicKey)throw new AppError('SUPABASE_SERVICE_ROLE_KEY contains a public key. Use the project secret key or legacy service_role key, then redeploy. [CONFIG_SERVER_KEY]',503);
 if(publicKey.startsWith('sb_secret_'))throw new AppError('SUPABASE_ANON_KEY needs a publishable or legacy anon key, not a secret key. [CONFIG_PUBLIC_KEY]',503);
 for(const [value,expected] of [[key,'service_role'],[publicKey,'anon']]){
  if(value.startsWith('eyJ')&&value.split('.').length===3){let role:unknown;try{role=JSON.parse(Buffer.from(value.split('.')[1],'base64url').toString()).role;}catch{}if(role&&role!==expected)throw new AppError(`The ${expected==='anon'?'SUPABASE_ANON_KEY':'SUPABASE_SERVICE_ROLE_KEY'} key has the wrong role. Check the Supabase API Keys page. [CONFIG_KEY_ROLE]`,503);}
 }
 return {url:parsed.origin,key,publicKey,owner};
}
export async function supa<T=unknown>(path:string,options:RequestInit={}):Promise<T>{
 const {url,key}=config();const headers=serverKeyHeaders(key);new Headers(options.headers).forEach((value,name)=>headers.set(name,value));
 let response:Response;try{response=await fetch(url+path,{...options,cache:'no-store',headers});}catch{throw new AppError('Could not reach Supabase. Check SUPABASE_URL and whether the project is active. [SUPABASE_NETWORK]',502);}
 const body=await response.text();let data:unknown=null;try{data=body?JSON.parse(body):null;}catch{if(response.ok)throw new AppError('Supabase returned an unexpected response. Check the project URL. [SUPABASE_RESPONSE]',502);}
 if(!response.ok){const message=workspaceError(response.status,data,path);console.error('AirDesk Supabase error',response.status,message);throw new AppError(message,502);}return data as T;
}
type AuthUser={id:string;email?:string;email_confirmed_at?:string};
type AuthSession={access_token:string;refresh_token:string;expires_in:number;user:AuthUser};
export async function authFetch(path:string,options:RequestInit={}){const {url,publicKey}=config();return fetch(url+'/auth/v1'+path,{...options,cache:'no-store',headers:{apikey:publicKey,'Content-Type':'application/json',...options.headers}});}
export async function setSession(session:AuthSession){const jar=await cookies();const options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:60*60*24*30};jar.set('airdesk-access',session.access_token,options);jar.set('airdesk-refresh',session.refresh_token,options);}
export async function clearSession(){const jar=await cookies();jar.delete('airdesk-access');jar.delete('airdesk-refresh');}
export async function requireOwner(){const {owner}=config(),jar=await cookies();let access=jar.get('airdesk-access')?.value;const refresh=jar.get('airdesk-refresh')?.value;let user:AuthUser|undefined;
 if(access){const r=await authFetch('/user',{headers:{Authorization:`Bearer ${access}`}});if(r.ok)user=await r.json();else if(r.status>=500)throw new AppError('Sign-in service is unavailable. Please try again.',503);}
 if(!user&&refresh){const r=await authFetch('/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:refresh})});if(r.ok){const session=await r.json() as AuthSession;user=session.user;if(user?.email?.toLowerCase()===owner&&user.email_confirmed_at){await setSession(session);access=session.access_token;}}else if(r.status>=500)throw new AppError('Sign-in service is unavailable. Please try again.',503);}
 if(!user)throw new AppError('Your session has expired. Sign in again to continue.',401);
 if(user.email?.toLowerCase()!==owner||!user.email_confirmed_at)throw new AppError('This account does not have access to this workspace.',403);return {user,access};
}
export async function jsonBody(request:Request){try{return await request.json();}catch{throw new AppError('Invalid request. Please try again.',400);}}
export async function rows<T>(table:string){const result:T[]=[];for(let offset=0;;offset+=500){const page=await supa<T[]>(`/rest/v1/${table}${table.includes('?')?'&':'?'}limit=500&offset=${offset}`);result.push(...page);if(page.length<500)return result;}}
export const BUCKET='airdesk-files';
export type AssetRow={id:string;job_id:string;name:string;mime:string;kind:'photo'|'file';size:number;state:'pending'|'ready'};
export async function assetById(id:string){const result=await supa<AssetRow[]>(`/rest/v1/airdesk_assets?id=eq.${id}&select=*`);if(!result[0])throw new AppError('File not found.',404);return result[0];}
