import {z} from 'zod';
import {requireOwner,supa,config,reply,failure,origin,AppError,jsonBody,BUCKET} from '@/lib/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const schema=z.object({job_id:z.string().uuid(),name:z.string().trim().min(1).max(240),mime:z.string().max(150),kind:z.enum(['photo','file']),size:z.number().int().positive().max(15*1024*1024)});
export async function POST(request:Request){try{origin(request);await requireOwner();const p=schema.safeParse(await jsonBody(request));if(!p.success)throw new AppError('Choose a non-empty file under 15 MB.',400);const v=p.data;
 if(v.kind==='photo'&&!['image/jpeg','image/png','image/webp','image/gif'].includes(v.mime))throw new AppError('Photos must be JPG, PNG, WebP or GIF.',400);
 const job=await supa<unknown[]>(`/rest/v1/airdesk_jobs?id=eq.${v.job_id}&select=id`);if(!job.length)throw new AppError('Job not found.',404);
 const id=crypto.randomUUID();await supa('/rest/v1/airdesk_assets',{method:'POST',body:JSON.stringify({...v,mime:v.mime||'application/octet-stream',id,state:'pending'})});
 const result=await supa<{url:string}>(`/storage/v1/object/upload/sign/${BUCKET}/${id}`,{method:'POST',body:JSON.stringify({})});
 const signed=new URL(result.url,config().url+'/storage/v1/');if(signed.origin!==new URL(config().url).origin)throw new AppError('Unexpected upload destination.',502);
 // Supabase returns a path beginning /object/upload/sign; prefix its storage API base.
 const uploadUrl=result.url.startsWith('/object/')?config().url+'/storage/v1'+result.url:signed.href;
 return reply({id,uploadUrl});
}catch(e){return failure(e);}}
