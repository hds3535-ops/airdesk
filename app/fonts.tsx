'use client';
import {useEffect} from 'react';

// Show the workspace with fallback fonts first; load brand fonts after hydration.
export default function Fonts(){
 useEffect(()=>{
  if(document.getElementById('airdesk-fonts'))return;
  const link=document.createElement('link');
  link.id='airdesk-fonts';link.rel='stylesheet';
  link.href='https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=Manrope:wght@400;500;600;650;700;750;800&display=swap';
  document.head.appendChild(link);
 },[]);
 return null;
}
