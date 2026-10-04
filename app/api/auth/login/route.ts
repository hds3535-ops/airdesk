import {z} from 'zod';
import {origin,config,authFetch,setSession,reply,failure,AppError,jsonBody} from '@/lib/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request){try{origin(request);const parsed=z.object({email:z.string().email().max(254),password:z.string().min(1).max(1024)}).safeParse(await jsonBody(request));if(!parsed.success)throw new AppError('Enter your email and password.',400);const input=parsed.data;const {owner}=config();
 // Always authenticate against Supabase first, so its rate limiting also covers wrong-email attempts.
 const r=await authFetch('/token?grant_type=password',{method:'POST',body:JSON.stringify(input)});if(r.status===429)throw new AppError('Too many sign-in attempts. Please wait before trying again.',429);if(!r.ok)throw new AppError('Unable to sign in. Check your email and password.',401);
 const session=await r.json();if(session.user?.email?.toLowerCase()!==owner||!session.user?.email_confirmed_at)throw new AppError('This account does not have access to this workspace.',403);await setSession(session);return reply({ok:true});
}catch(e){return failure(e);}}
