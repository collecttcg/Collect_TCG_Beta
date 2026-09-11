import { createBetaRuntime } from './app/beta-runtime.js';
import { registerFeatures } from './app/register-features.js';
import { initializeApp } from './app/initialize.js';
import { setup as setup1 } from './ui/enhancement-1.js';
import { setup as setup2 } from './ui/enhancement-2.js';
import { setup as setup3 } from './ui/enhancement-3.js';

try{
 const runtime=createBetaRuntime();
 const appContext={localStorage:runtime.localStorage,sessionStorage:runtime.sessionStorage,fetch:runtime.fetch};
 registerFeatures(appContext);
 runtime.installGuards(appContext);
 initializeApp(appContext,runtime);
 setup1(appContext);
 setup2(appContext);
 setup3(appContext);
 const badge=document.createElement('div');
 badge.id='beta-environment-label';
 badge.textContent=runtime.config.mode==='readonly'?'V93 BETA · READ-ONLY':'V93 BETA · TEST DATABASE';
 badge.setAttribute('role','status');
 document.body.append(badge);
}catch(error){
 console.error('Beta startup failed:',error);
 const notice=document.createElement('p');
 notice.setAttribute('role','alert');
 notice.textContent='Beta could not start: '+error.message;
 document.body.prepend(notice);
}
