// Messages use fixed text and known codes only. Never echo provider messages,
// query values, tokens or connection settings to the browser or logs.
export function workspaceError(status:number,raw:unknown,path:string){
 const body=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
 const code=typeof body.code==='string'?body.code:'';
 const resource=path.startsWith('/rest/v1/rpc/')?'function':path.startsWith('/storage/v1/')?'file storage':'database';
 if(code==='PGRST205'||code==='42P01')return 'AirDesk tables were not found. Run supabase/001_airdesk.sql in the same Supabase project used by this site. [DB_TABLE_MISSING]';
 if(code==='PGRST202'||code==='42883')return 'An AirDesk database function was not found. Check that supabase/001_airdesk.sql completed successfully in this project. [DB_FUNCTION_MISSING]';
 if(code==='PGRST204'||code==='42703')return 'The AirDesk database structure does not match this version of the app. Check the SQL setup. [DB_COLUMN_MISSING]';
 if(code==='42501')return 'The server does not have permission to access AirDesk data. Check SUPABASE_SERVICE_ROLE_KEY and the permissions in the AirDesk SQL setup, then redeploy. [DB_PERMISSION]';
 if(status===401||['PGRST301','PGRST302','PGRST303'].includes(code))return 'Supabase rejected the server API key. Check that SUPABASE_SERVICE_ROLE_KEY is a secret or service_role key from the same project as SUPABASE_URL, then redeploy. [SERVER_KEY_REJECTED]';
 if(status===403)return 'Supabase denied access to '+resource+'. Check the server key and the AirDesk database or storage permissions. [ACCESS_DENIED]';
 if(status===404&&resource==='file storage')return 'The file or airdesk-files storage bucket was not found. Check the AirDesk storage setup. [STORAGE_NOT_FOUND]';
 if(status===429)return 'Supabase is receiving too many requests. Wait a moment, then try again. [RATE_LIMITED]';
 if(status>=500||['PGRST000','PGRST001','PGRST002','PGRST003'].includes(code))return 'The Supabase database is unavailable. Check that the project is active and try again. [DATABASE_UNAVAILABLE]';
 const safeCode=/^(PGRST\d{3}|[0-9A-Z]{5})$/.test(code)?code:`HTTP_${status}`;
 return `Supabase could not complete the ${resource} request. Send the site owner this code: ${safeCode}.`;
}
export function serverKeyHeaders(key:string){
 const headers=new Headers({'apikey':key,'Content-Type':'application/json'});
 // Modern sb_secret keys are opaque API keys, not JWT bearer tokens.
 if(!key.startsWith('sb_secret_'))headers.set('Authorization',`Bearer ${key}`);
 return headers;
}
