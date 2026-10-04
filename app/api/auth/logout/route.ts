import {cookies} from 'next/headers';
import {origin,clearSession,authFetch,reply,failure} from '@/lib/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request){try{origin(request);const token=(await cookies()).get('airdesk-access')?.value;try{if(token)await authFetch('/logout?scope=local',{method:'POST',headers:{Authorization:`Bearer ${token}`}});}finally{await clearSession();}return reply({ok:true});}catch(e){return failure(e);}}
