import {rows} from './server';
import type {Customer,Job,Asset,Data} from './workspace-types';

// The caller must authenticate the owner first. Never cache private records globally.
export async function loadWorkspace():Promise<Data>{
 const [customers,jobs,assets]=await Promise.all([
  rows<Customer>('airdesk_customers?select=*&order=name.asc,id.asc'),
  rows<Job>('airdesk_jobs?select=*&order=created_at.desc,id.asc'),
  rows<Asset>('airdesk_assets?select=id,job_id,name,mime,kind,size&state=eq.ready&order=created_at.desc,id.asc')
 ]);
 return {customers,jobs,assets};
}
