import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerFeatures} from '../beta/src/app/register-features.js';
const golden=JSON.parse(fs.readFileSync(new URL('./v92-golden.json',import.meta.url),'utf8'));
const constants=JSON.parse(fs.readFileSync(new URL('./constants.json',import.meta.url),'utf8'));
function app(){
 const a={...constants};registerFeatures(a);
 Object.assign(a,{cards:structuredClone(golden.cards),pillFilterState:Object.fromEntries(['game','grade','language','era','availability','series'].map(k=>[k,new Set()])),collectionCardOrderById:new Map(),inventoryCardOrderById:new Map(),collectionGameOrderByKey:new Map(),inventoryGameOrderByKey:new Map()});
 a.isOwnerMode=()=>a.owner;
 a.getPriceCurrencyPreference=()=>a.currency;
 a.$=id=>a.controls[id];
 return a;
}
test('all 350 V92 filter/sort results are preserved by the modular app',()=>{
 const a=app();for(const scenario of golden.scenarios){Object.assign(a,{controls:Object.fromEntries(Object.entries(scenario.control).map(([k,v])=>[k,{value:v}])),listingAvailabilityScope:scenario.scope,currency:scenario.currency,activeQuickFilter:scenario.quick,owner:scenario.owner});assert.deepEqual(a.getFiltered().map(c=>c.id),scenario.expected);}
});
test('all 30 V92 related-card results and availability rules are preserved',()=>{
 const a=app();for(const row of golden.related)assert.deepEqual(a.getRelatedCards(row.source,6).map(c=>c.id),row.expected);
});
test('feature registry has no missing cross-module dependencies',()=>{
 const a=app();const map=JSON.parse(fs.readFileSync(new URL('../docs/function-map.json',import.meta.url),'utf8'));for(const row of map)assert.equal(typeof a[row.name],'function',row.name);assert.equal(map.length,667);
});

test('critical retained features remain registered and their public intents remain available',()=>{
 const map=JSON.parse(fs.readFileSync(new URL('../docs/function-map.json',import.meta.url),'utf8'));
 const names=new Set(map.map(row=>row.name));
 for(const name of ['isOwnerMode','requireOwner','applyOwnerMode','renderContactPage','publicContactSellerMessage','loadGiveaways','saveGiveaway','renderCarousellPostGeneratorPage','isAnalyticsExcludedDevice','createAnalyticsExclusionPairingCode'])assert.ok(names.has(name),name);
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const details=source('../beta/src/features/cards/details.js');
 for(const intent of ['Availability','Make an offer','More photos / video','COD / meetup'])assert.ok(details.includes(intent),intent);
 const giveaway=source('../beta/src/features/content/giveaways-data.js');
 assert.match(giveaway,/bonus/i);
 const posts=source('../beta/src/features/social/posts.js');
 assert.match(posts,/Facebook Group/i);
 assert.match(posts,/Carousell/i);
 const analytics=source('../beta/src/services/analytics.js');
 assert.match(analytics,/analyticsExclusionPairingUrl/);
});

test('card list generator keeps the detailed format and limits the short drop post',()=>{
 const a=app();
 a.getWebsiteShareUrl=()=>"https://example.test/#/inventory";
 a.collectSocialPostLines=()=>[];
 const cards=golden.cards.slice(0,6);
 const prefs={listTitle:"TEST DROP",dropLimit:3,hashtags:"#tcg"};
 const drop=a.buildFbCardListPost(cards,{...prefs,postFormat:"drop"});
 assert.match(drop,/CARD DROP/);
 assert.match(drop,/More cards are available beyond this drop/);
 assert.match(drop,/Browse the full inventory/);
 assert.match(drop,/INTERNATIONAL SHIPPING — BELOW USD 6,000 ONLY/);
 assert.match(drop,/COD \/ MEETUP: MALAYSIA OR SINGAPORE/);
 for(const card of cards.slice(0,3)) assert.match(drop,new RegExp(card.card_code));
 for(const card of cards.slice(3)) assert.doesNotMatch(drop,new RegExp(card.card_code));
 const full=a.buildFbCardListPost(cards,{...prefs,postFormat:"full"});
 assert.match(full,/CARD LIST/);
});

test('short card drop removes repeated series text and keeps price readable',()=>{
 const a=app();
 a.getWebsiteShareUrl=()=>"https://example.test/#/inventory";
 a.collectSocialPostLines=()=>[];
 const card={
  id:'buggy',year:'1999',series:'FIRST STAGE',name:'FIRST STAGE BUGGY',card_code:'C24',era:'VINTAGE',language:'Mixed / Multiple languages',language_details:'JP × 2 · ENG × 1',
  grading:[{company:'PSA',grade:'9',pop_count:45}],price_myr:16000,price_usd:4000,price_sgd:5050,price_negotiability:'Negotiable'
 };
 const drop=a.buildFbCardDropPost([card],{listTitle:'AVAILABLE INVENTORY',dropLimit:5,hashtags:'#tcg'});
 assert.match(drop,/1\. Buggy · C24/);
 assert.match(drop,/1999 · First Stage · Mixed \/ Multiple languages: JP × 2 · ENG × 1 · PSA 9 · POP 45 · Vintage/);
 assert.match(drop,/RM 16,000 · US\$4,000 · S\$5,050 · negotiable/);
 assert.doesNotMatch(drop,/PRICE\s*:/);
});

test('language details preserve a single filter value and an optional exact breakdown',()=>{
 const a=app();
 a.LANGUAGE_OPTIONS=['JP','ENG','KR','CN','Mixed / Multiple languages','N/A'];
 a.LIFECYCLE_OPTIONS=['live','draft','archived'];
 assert.ok(a.LANGUAGE_OPTIONS.includes('Mixed / Multiple languages'));
 assert.ok(a.LANGUAGE_OPTIONS.includes('N/A'));
 a.languageDetailsSupported=true;
 const db=a.cardToDb({
  name:'Mixed-language lot',language:'Mixed / Multiple languages',language_details:'JP × 2 · ENG × 1',
  grading:[],availability:'Available',format:'Raw',condition:'NM'
 });
 assert.equal(db.language,'Mixed / Multiple languages');
 assert.equal(db.language_details,'JP × 2 · ENG × 1');
 const card=a.dbToCard({id:'language-test',name:'Mixed-language lot',language:db.language,language_details:db.language_details});
  assert.equal(card.language_details,'JP × 2 · ENG × 1');
 assert.match(
  a.cardWriteErrorText({message:'new row violates check constraint "cards_language_check"'},'update'),
  /EXTEND-LANGUAGE-OPTIONS\.sql/
 );
});

test('card edits do not depend on a full REST row being returned after save',async()=>{
 const a=app();
 a.owner=true;
 a.requireOwner=()=>true;
 a.LIFECYCLE_OPTIONS=['live','draft','archived'];
 a.languageDetailsSupported=true;
 a.lifecycleSupported=true;
 a.soldAtSupported=false;
 const calls=[];
 a.supabaseClient={
  from:table=>({
   update:payload=>({
    eq:(field,value)=>({
     select:columns=>({
      maybeSingle:()=>{
       calls.push({table,payload,field,value,columns});
       return {data:{id:value},error:null};
      }
     })
    })
   })
  })
 };
 const saved=await a.updateCardStorage({
  id:'language-test',name:'mixed-language lot',card_code:'don!!',game:'One Piece Card Game',
  language:'Mixed / Multiple languages',language_details:'KR × 1, CN × 1',grading:[],
  availability:'Available',format:'Raw',condition:'NM',lifecycle_status:'live'
 });
 assert.equal(calls.length,1);
 assert.equal(calls[0].columns,'id');
 assert.equal(calls[0].payload.language_details,'KR × 1, CN × 1');
 assert.equal(saved.language_details,'KR × 1, CN × 1');
 assert.equal(saved.name,'MIXED-LANGUAGE LOT');
});

test('owner save flows distinguish an unsaved card from non-critical post-save work',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const add=source('../beta/src/features/owner/add.js');
 const editor=source('../beta/src/features/owner/editor.js');
 assert.match(add,/Card was not saved\. Please refresh and try again\./);
 assert.match(add,/Card added · \$\{postSaveStep/);
 assert.doesNotMatch(add,/Card saved; a follow-up step failed/);
 assert.match(editor,/Card was not saved\. Please refresh and try again\./);
 assert.match(editor,/cleanupSaved=await appContext\.cleanupRemovedCardStorageImages/);
 assert.match(editor,/Card updated · \$\{postSaveStep/);
 assert.doesNotMatch(editor,/Card saved; a follow-up step failed/);
});

test('the owner can download the standalone Inventory QR from the Inventory page',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const details=source('../beta/src/features/cards/details.js');
 const inventory=source('../beta/src/features/inventory/page.js');
 assert.match(details,/async function downloadInventoryQrImage\(\)/);
 assert.match(details,/Collect-TCG-Inventory-QR\.png/);
 assert.match(inventory,/id="inventoryQrDownloadBtn"/);
 assert.match(inventory,/inventoryQrDownloadBtn"\)\?\.addEventListener\("click",appContext\.downloadInventoryQrImage\)/);
});

test('buyer contact makes worldwide shipping a clear option alongside MY/SG COD',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const details=source('../beta/src/features/cards/details.js');
 const html=source('../beta/index.html');
 const mobile=source('../beta/src/ui/enhancement-2.js');
 assert.match(details,/Worldwide Shipping/);
 assert.match(details,/Shipping \/ delivery/);
 assert.match(details,/Is international shipping available to my location\?/);
 assert.match(details,/COD \/ meetup in MY &amp; SG/);
 assert.match(html,/data-inquiry-intent="shipping">Shipping \/ delivery/);
 assert.match(html,/Eligible orders · COD \/ meetup in Malaysia &amp; Singapore/);
 assert.match(mobile,/shipping:"Copy a shipping inquiry"/);
});


test('home titles use a consistent uppercase display style and trust copy stays readable',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const css=source('../beta/src/styles/26-compatibility.css');
 assert.match(css,/\.home-premium-hero-copy h2,[\s\S]*\.home-premium-trust-points strong\{[\s\S]*text-transform:uppercase/);
 assert.match(css,/\.home-premium-trust-copy h3\{\s*font-size:clamp\(23px,1\.55vw,30px\)/);
 assert.match(css,/\.home-premium-trust-points small\{\s*font-size:clamp\(10\.5px,\.68vw,13px\)/);
 assert.match(css,/@media\(max-width:800px\)\{[\s\S]*\.home-premium-trust-copy h3\{font-size:22px;\}/);
});


test('the Home currency label is readable without changing other currency controls',()=>{
 const css=fs.readFileSync(new URL('../beta/src/styles/26-compatibility.css',import.meta.url),'utf8');
 assert.match(css,/\.home-premium-currency > span:not\(\.sr-only\)\{\s*font-size:12px !important;/);
 assert.match(css,/\.home-premium-currency select\{\s*font-size:11px !important;/);
});


test('trust descriptions stay on one line and Collection accordion uses the gold accent',()=>{
 const css=fs.readFileSync(new URL('../beta/src/styles/26-compatibility.css',import.meta.url),'utf8');
 assert.match(css,/\.home-premium-trust-points small\{[\s\S]*white-space:nowrap/);
 assert.match(css,/\.collection-game-group-header\{[\s\S]*border-color:rgba\(227,179,65,\.28\)/);
 assert.match(css,/\.collection-game-chevron\{[\s\S]*color:#efc45d/);
});

test('balanced card drop mix prioritizes different games before repeating one',()=>{
 const a=app();
 const cards=[
  {id:'a',game:'ONE PIECE',series:'Alpha',era:'Vintage',grading:[{company:'PSA',grade:'10'}]},
  {id:'b',game:'ONE PIECE',series:'Beta',era:'Modern',grading:[{company:'PSA',grade:'9'}]},
  {id:'c',game:'GUNDAM',series:'Gamma',era:'Modern',grading:[]},
  {id:'d',game:'ZATCH BELL',series:'Delta',era:'Vintage',grading:[]}
 ];
 assert.deepEqual(a.balancedCardDropCards(cards,4).map(card=>card.id),['a','c','d','b']);
});
