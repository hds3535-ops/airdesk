export type Customer={id:string;name:string;phone:string;email:string;address:string};
export type Job={id:string;customer_id:string;title:string;type:string;status:string;notes:string;scheduled_at:string|null;duration:number;created_at:string};
export type Asset={id:string;job_id:string;name:string;mime:string;kind:string;size:number};
export type Data={jobs:Job[];customers:Customer[];assets:Asset[]};
