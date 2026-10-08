import {requireOwner,reply,failure} from '@/lib/server';
import {loadWorkspace} from '@/lib/workspace-data';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{await requireOwner();return reply(await loadWorkspace());}catch(e){return failure(e);}}
