import {requireOwner,reply,failure} from '@/lib/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{const {user}=await requireOwner();return reply({email:user.email});}catch(e){return failure(e);}}
