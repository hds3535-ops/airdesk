export const zone='Australia/Melbourne';
export function localDate(iso:string){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));}
export function localTime(iso:string){return new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso));}
export function scheduleISO(date:string,time:string){
 const wall=Date.parse(`${date}T${time}:00Z`);let value=wall;
 for(let i=0;i<3;i++){const d=new Date(value);const displayed=Date.parse(`${localDate(d.toISOString())}T${localTime(d.toISOString())}:00Z`);value+=wall-displayed;}
 const iso=new Date(value).toISOString();if(localDate(iso)!==date||localTime(iso)!==time)throw new Error('This time does not exist due to daylight saving. Choose another time.');return iso;
}
export function readable(iso:string|null){return iso?new Intl.DateTimeFormat('en-AU',{timeZone:zone,day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(new Date(iso)):'Not scheduled';}
