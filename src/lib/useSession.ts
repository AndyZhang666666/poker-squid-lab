'use client';
import {useEffect,useState} from 'react';
import {STORE,decodeSession,freshState,type LabState} from './session';
export function useSession(){
 const [state,setState]=useState<LabState>(freshState),[ready,setReady]=useState(false),[saving,setSaving]=useState(true),[status,setStatus]=useState<'local'|'restored'|'blocked'|'failed'>('local');
 useEffect(()=>{try{const raw=localStorage.getItem(STORE);if(raw){const saved=decodeSession(raw);if(saved){setState(saved);setStatus('restored');}else{setSaving(false);setStatus('blocked');}}}catch{setSaving(false);setStatus('failed');}setReady(true);},[]);
 useEffect(()=>{if(!ready||!saving)return;try{localStorage.setItem(STORE,JSON.stringify(state));}catch{setSaving(false);setStatus('failed');}},[state,ready,saving]);
 return {state,setState,ready,saving,status,enableSaving:()=>{setSaving(true);setStatus('local');}};
}
