import {requireOwner,rows,reply,failure} from '@/lib/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{await requireOwner();const [customers,jobs,assets]=await Promise.all([rows('airdesk_customers?select=*&order=name.asc,id.asc'),rows('airdesk_jobs?select=*&order=created_at.desc,id.asc'),rows('airdesk_assets?select=*&state=eq.ready&order=created_at.desc,id.asc')]);return reply({customers,jobs,assets});}catch(e){return failure(e);}}
