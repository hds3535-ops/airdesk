import Workspace from './workspace-client';
import {AppError,requireOwner} from '@/lib/server';
import {loadWorkspace} from '@/lib/workspace-data';
import type {Data} from '@/lib/workspace-types';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export default async function Page(){
 let initialData:Data|null=null;
 let initialError='';
 try{
  // Server rendering cannot write cookies. Expired sessions are renewed by
  // /api/data in the client, where refreshed HttpOnly cookies can be saved.
  await requireOwner({refreshSession:false});
  initialData=await loadWorkspace();
 }catch(error){
  if(!(error instanceof AppError&&error.status===401)){
   initialError=error instanceof AppError?error.message:'Unable to open the workspace. Please try again.';
  }
 }
 // Only workspace records are serialized; session tokens stay on the server.
 return <Workspace initialData={initialData} initialError={initialError} initialNow={new Date().toISOString()}/>;
}
