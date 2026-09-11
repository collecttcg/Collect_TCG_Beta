import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBetaConfig,scopedStorage,makeBetaFetch,PRODUCTION_URL} from '../beta/src/app/beta-runtime.js';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size;}};}
test('beta preferences cannot read, overwrite or clear production preferences',()=>{
 const raw=memory();raw.setItem('favorites','live');raw.setItem('sb-production-auth-token','session');
 const beta=scopedStorage(raw,'beta:');assert.equal(beta.getItem('favorites'),null);beta.setItem('favorites','test');assert.equal(raw.getItem('favorites'),'live');assert.equal(beta.length,1);beta.clear();assert.equal(raw.getItem('favorites'),'live');assert.equal(raw.getItem('sb-production-auth-token'),'session');
});
test('sandbox cannot point to production or accept service secrets',()=>{
 assert.throws(()=>resolveBetaConfig({mode:'sandbox',sandboxUrl:PRODUCTION_URL,sandboxPublishableKey:'sb_publishable_test'}));
 assert.throws(()=>resolveBetaConfig({mode:'sandbox',sandboxUrl:'https://test-project.supabase.co',sandboxPublishableKey:'sb_secret_test'}));
 assert.throws(()=>resolveBetaConfig({mode:'sandbox',sandboxUrl:'https://example.com',sandboxPublishableKey:'sb_publishable_test'}));
 assert.equal(resolveBetaConfig().mode,'readonly');
});
test('production writes, analytics, auth and unknown RPCs never reach fetch',async()=>{
 let count=0;const fetch=makeBetaFetch(resolveBetaConfig(),async()=>{count++;return new Response('[]');},'https://collecttcg.github.io/Collect_TCG_Beta/beta/');
 for(const [path,method] of [['/rest/v1/cards','POST'],['/rest/v1/cards','PATCH'],['/rest/v1/cards','DELETE'],['/storage/v1/object/card-images/a','POST'],['/auth/v1/token','POST'],['/functions/v1/record-card-view','POST'],['/rest/v1/rpc/record_site_visit','POST'],['/rest/v1/rpc/set_inventory_card_order','POST'],['/rest/v1/rpc/get_owner_cards','POST'],['/rest/v1/rpc/new_unreviewed_function','POST'],['/rest/v1/card_owner_private','GET']]){
  const response=await fetch(PRODUCTION_URL+path,{method});assert.equal(response.status,403,path);
 }
 assert.equal(count,0);
});
test('public reads use anonymous identity, omit cookies and force public schema',async()=>{
 const sent=[];const fetch=makeBetaFetch(resolveBetaConfig(),async request=>{sent.push(request);return new Response('[]');},'https://example.com/beta/');
 for(const path of ['/rest/v1/cards?select=*','/rest/v1/giveaways?select=*','/rest/v1/showcases?select=*','/storage/v1/object/public/card-images/card.jpg'])assert.equal((await fetch(PRODUCTION_URL+path,{headers:{Authorization:'Bearer production-owner-token','Accept-Profile':'private'}})).status,200);
 assert.equal((await fetch(PRODUCTION_URL+'/rest/v1/rpc/get_public_reviews',{method:'POST',body:'{}'})).status,200);
 for(const request of sent){assert.equal(request.headers.get('authorization'),null);assert.equal(request.credentials,'omit');assert.equal(request.headers.get('Accept-Profile'),'public');assert.equal(request.redirect,'error');}
});
test('sandbox permits only its separate database and blocks production even for reads',async()=>{
 const cfg=resolveBetaConfig({mode:'sandbox',sandboxUrl:'https://test-project.supabase.co',sandboxPublishableKey:'sb_publishable_test'});let count=0;
 const fetch=makeBetaFetch(cfg,async()=>{count++;return new Response('{}');},'https://example.com/beta/');
 assert.equal((await fetch(PRODUCTION_URL+'/rest/v1/cards')).status,403);
 assert.equal((await fetch(cfg.url+'/rest/v1/cards',{method:'POST',body:'{}'})).status,200);assert.equal(count,1);
});
