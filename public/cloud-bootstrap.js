'use strict';
(async()=>{
 const KEY='still-workspace-v1';
 const canonical=s=>JSON.stringify({version:1,tasks:s.tasks||[],notes:s.notes||[],sessions:s.sessions||[],duration:s.duration||25,projects:s.projects||[],habits:s.habits||[],trash:s.trash||[],draft:s.draft||''});
 window.stillCanonical=canonical;
 async function start(){
  try{
   const response=await fetch('/api/workspace',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(response.status===401){location.href='/signin-with-chatgpt?return_to=%2F';return}
   if(!response.ok)throw Error('Cloud storage is unavailable. Your saved data is untouched.');
   const remote=await response.json(), account=remote.user.id, storageKey=KEY+':'+account, metaKey=storageKey+':sync';
   let local=null,meta={};
   try{
    local=JSON.parse(localStorage.getItem(storageKey)||'null');meta=JSON.parse(localStorage.getItem(metaKey)||'{}');
    const claimed=localStorage.getItem(KEY+':migrated-account');
    if(!local&&!claimed){const legacy=localStorage.getItem(KEY);if(legacy)local=JSON.parse(legacy);localStorage.setItem(KEY+':migrated-account',account)}
   }catch{throw Error('Browser storage is unavailable. Enable site storage to sync safely.')}
   const hasLocal=local&&(local.tasks?.length||local.notes?.length||local.projects?.length||local.habits?.length||local.sessions?.length||local.trash?.length||local.draft);
   let conflict=false;
   if(remote.state){
    if(hasLocal&&canonical(local)!==canonical(remote.state)&&canonical(local)!==meta.base)conflict=true;
    else {local={...remote.state,timer:local?.timer||null};meta.base=canonical(remote.state)}
   }else if(!local)local={version:1,tasks:[],notes:[],sessions:[],duration:25,projects:[],habits:[],trash:[],draft:'',timer:null};
   localStorage.setItem(storageKey,JSON.stringify(local));
   window.STILL_STORAGE_KEY=storageKey;
   window.STILL_CLOUD={remote,metaKey,base:meta.base||null,conflict};
   for(const src of ['/app.js?v=3','/expand.js?v=3','/cloud-sync.js?v=3'])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.append(script)});
   document.querySelector('#cloudLoading').remove();
  }catch(error){
   const message=document.querySelector('#loadingMessage');message.textContent=error.message||'Could not connect. Your saved data is untouched.';
   let retry=document.querySelector('#retryCloud');if(!retry){retry=document.createElement('button');retry.id='retryCloud';retry.className='primary';retry.textContent='Try connecting again';retry.onclick=()=>location.reload();message.after(retry)}
  }
 }
 await start();
})();
