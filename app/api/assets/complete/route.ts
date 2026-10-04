import {z} from 'zod';
import {requireOwner,supa,reply,failure,origin,AppError,jsonBody} from '@/lib/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request){try{origin(request);await requireOwner();const p=z.object({id:z.string().uuid()}).safeParse(await jsonBody(request));if(!p.success)throw new AppError('Invalid file.',400);await supa('/rest/v1/rpc/airdesk_finish_asset',{method:'POST',body:JSON.stringify({asset_id:p.data.id})});return reply({id:p.data.id});}catch(e){return failure(e);}}
