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
test('Related Cards preserve availability/diversity while prioritizing stronger collector matches',()=>{
 const a=app();
 for(const row of golden.related){
  const results=a.getRelatedCards(row.source,6);
  assert.ok(results.length<=6);
  assert.ok(results.every(card=>card.id!==row.source.id));
  assert.ok(results.every(card=>a.isLiveLifecycle(card)));
  assert.ok(results.every(card=>a.normalizeFilterValue(card.availability||'Available')==='available' ||
    (a.normalizeFilterValue(row.source.availability||'Available')==='collection (nfs)' &&
     a.normalizeFilterValue(card.availability||'Available')==='collection (nfs)')));
  const identities=results.map(card=>a.relatedCardIdentityKey(card));
  for(const identity of new Set(identities)) assert.ok(identities.filter(value=>value===identity).length<=2);
 }

 const source={id:'source',game:'One Piece Card Game',series:'Treasure Cup 2024',name:'Monkey D. Luffy Winner',card_code:'OP01-001',era:'Championship',language:'ENG',format:'Graded',availability:'Available',lifecycle_status:'live',grading:[{company:'PSA',grade:'10'}],price_usd:3000};
 const sameCode={...source,id:'same-code',name:'Monkey D. Luffy Finalist',grading:[{company:'PSA',grade:'9'}],price_usd:2800};
 const sameCharacter={...source,id:'same-character',card_code:'P-001',series:'Regional 2024',name:'Monkey D. Luffy Promo',price_usd:2600};
 const sameEvent={...source,id:'same-event',card_code:'OP01-002',name:'Roronoa Zoro Winner',price_usd:2500};
 const generic={...source,id:'generic',card_code:'OP09-001',series:'Modern Booster',name:'Random Character',era:'Modern',price_usd:2900};
 a.cards=[source,sameCode,sameCharacter,sameEvent,generic];
 const ranked=a.getRelatedCards(source,4);
 assert.equal(ranked[0].id,'same-code');
 assert.ok(ranked.findIndex(card=>card.id==='same-character') < ranked.findIndex(card=>card.id==='generic'));
 assert.ok(ranked.findIndex(card=>card.id==='same-event') < ranked.findIndex(card=>card.id==='generic'));
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
 assert.match(drop,/WORLDWIDE SHIPPING AVAILABLE/);
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

test('every post generator shares an English-default template language selector',()=>{
 const a=app();
 a.getWebsiteShareUrl=()=>"https://example.test/#/inventory";
 a.collectSocialPostLines=()=>[];
 assert.equal(a.normalizePostLanguage(),"en");
 assert.equal(a.normalizePostLanguage("zh"),"zh");
 assert.equal(a.normalizePostLanguage("unsupported"),"en");
 const card={
  id:'language-post',name:'KOREAN / CHINESE PROMOS',card_code:'DON!!',year:'2024',series:'Championship',language:'Mixed / Multiple languages',language_details:'KR × 1 · CN × 1',availability:'Available',format:'Raw',condition:'Mint',grading:[],price_myr:7000
 };
 const chinese=a.buildFbCardListPost([card],{postFormat:'drop',language:'zh',listTitle:'AVAILABLE INVENTORY',dropLimit:3,hashtags:'#tcg'});
 assert.match(chinese,/卡牌上新/);
 assert.match(chinese,/更多卡牌可供选择/);
 assert.match(chinese,/Mixed \/ Multiple languages: KR × 1 · CN × 1/);
 const source=fs.readFileSync(new URL('../beta/src/features/social/posts.js',import.meta.url),'utf8');
 for(const id of ['fbPostLanguage','winnerPostLanguage','fbGiveawayLanguage','carousellPostLanguage','fbCardListLanguage']) assert.match(source,new RegExp(id));
 for(const language of ['English','Bahasa Melayu','中文（简体）','日本語','한국어']) assert.match(source,new RegExp(language));
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
 assert.match(html,/High-value delivery by arrangement · COD \/ meetup in Malaysia &amp; Singapore/);
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


test('Collection NFS cards use the same gold accent rather than a purple stripe',()=>{
 const css=fs.readFileSync(new URL('../beta/src/styles/26-compatibility.css',import.meta.url),'utf8');
 assert.match(css,/\.card\.nfs-collection-card\{[\s\S]*--stripe:#e3b341 !important/);
 assert.match(css,/inset 3px 0 0 rgba\(227,179,65,\.70\)/);
});


test('Inventory and Sold cards use gold stripes without changing their status badges',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const inventory=source('../beta/src/features/inventory/page.js');
 const css=source('../beta/src/styles/26-compatibility.css');
 assert.match(inventory,/\["inventory","sold"\]\.includes\(appContext\.listingAvailabilityScope\)/);
 assert.match(inventory,/grid\.classList\.add\("gold-card-stripes"\)/);
 assert.match(css,/#invGrid\.gold-card-stripes \.card\{\s*--stripe:#e3b341 !important;/);
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

test('SEO phase 1 preserves legacy card routes and activates clean URLs only after generation',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const utilities=source('../beta/src/features/core/utilities.js');
 const routing=source('../beta/src/app/routing.js');
 const details=source('../beta/src/features/cards/details.js');
 const html=source('../beta/index.html');
 const generator=source('../tools/generate-seo.mjs');

 assert.match(utilities,/function seoCardSlug\(card\)/);
 assert.match(utilities,/function publishedSeoCardUrl\(card\)/);
 assert.match(utilities,/seoCardSlugMap\s*=\s*new Map\(\)/);
 assert.match(routing,/meta\[name="collect-tcg-card-id"\]/);
 assert.match(routing,/return `card\/\$\{seoCardId\}`/);
 assert.match(details,/publishedSeoCardUrl\(card\)/);
 assert.match(details,/cardShareHash\(cardId\)/);
 assert.match(routing,/history\.pushState\(state,"",cleanUrl\.pathname\+cleanUrl\.search\+cleanUrl\.hash\)/);
 assert.match(routing,/collectTcgSpaCardId=id/);
 assert.match(routing,/collect_tcg_clean_card_return_v1/);
 assert.doesNotMatch(routing,/location\.assign\(clean\)/);
 assert.match(details,/history\.replaceState\(state,"",target\)/);
 assert.match(details,/location\.assign\(new URL\(target,appContext\.siteRootUrl\(\)\)\.toString\(\)\)/);
 assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
 assert.match(generator,/application\/ld\+json/);
 assert.match(generator,/rel="canonical"/);
 assert.match(generator,/seo-slugs\.json/);
 assert.match(generator,/cards\/\$\{slug\}\//);
 assert.doesNotMatch(generator,/slug\}--\$\{encodeURIComponent\(card\.id\)\}/);
});

test('Phase 2A discovery surfaces keep clean-card routing and source context',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const routing=source('../beta/src/app/routing.js');
 const home=source('../beta/src/features/content/home.js');
 const tiles=source('../beta/src/features/cards/tiles.js');
 const details=source('../beta/src/features/cards/details.js');

 assert.match(routing,/function rememberCardDiscoverySource\(cardId,source\)/);
 assert.match(routing,/function currentCardDiscoverySource\(\)/);
 assert.match(routing,/openCardRoute\(cardId,discoverySource=""\)/);
 assert.match(routing,/history\.pushState\(state,"",cleanUrl\.pathname\+cleanUrl\.search\+cleanUrl\.hash\)/);
 assert.doesNotMatch(routing,/location\.assign\(clean\)/);
 assert.doesNotMatch(home,/home-collector-spotlight-media" href="#\/card\//);
 assert.match(home,/data-spotlight-card-id/);
 assert.match(home,/source:"recently-added"/);
 assert.match(home,/source:"trending"/);
 assert.match(tiles,/data-discovery-source="related"/);
 assert.match(tiles,/openCardRoute\(card\.id,tile\.dataset\.discoverySource\|\|""\)/);
 assert.match(details,/rememberCardDiscoverySource\(id,el\.dataset\.discoverySource\|\|"related"\)/);
});

test('Phase 2B1 records discovery attribution only after qualified views',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const analytics=source('../beta/src/services/analytics.js');
 const sql=source('../2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql');

 assert.match(analytics,/async function recordQualifiedViewDiscoveryAttribution\(cardId,visitorId\)/);
 assert.match(analytics,/getCardDiscoverySource\?\.\(id\)/);
 assert.match(analytics,/record_card_discovery_view/);
 assert.match(analytics,/recordQualifiedViewDiscoveryAttribution\(cardId,visitorId\)\.catch/);
 assert.match(sql,/create table if not exists public\.card_discovery_views/);
 assert.match(sql,/alter table public\.card_discovery_views enable row level security/);
 assert.match(sql,/revoke all on table public\.card_discovery_views from anon, authenticated/);
 assert.match(sql,/create or replace function public\.record_card_discovery_view/);
 assert.match(sql,/grant execute on function public\.record_card_discovery_view/);
 assert.match(sql,/lifecycle_status/);
});

test('Phase 2 Trending ranks unique collectors ahead of repeat-heavy views',()=>{
 const a=app();
 a.trending7dViewsByCard=new Map([['repeat',8],['broader',3],['single',2]]);
 a.trending7dUniqueViewsByCard=new Map([['repeat',1],['broader',3],['single',1]]);
 const repeat={id:'repeat'};
 const broader={id:'broader'};
 const single={id:'single'};
 assert.ok(a.trendingCardScore(broader)>a.trendingCardScore(repeat));
 assert.ok(a.trendingCardScore(repeat)>a.trendingCardScore(single));
 const source=fs.readFileSync(new URL('../beta/src/features/content/home.js',import.meta.url),'utf8');
 assert.match(source,/trendingCardScore\(b\)-appContext\.trendingCardScore\(a\)/);
 assert.match(source,/unique qualified collector interest/);
});

test('Phase 2 discovery summary is owner-only and intentionally lightweight',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const sql=source('../2026-09-24-v08-DISCOVERY-SUMMARY.sql');
 const analytics=source('../beta/src/services/analytics.js');
 const dashboard=source('../beta/src/features/owner/insights-dashboard.js');
 assert.match(sql,/create or replace function public\.get_card_discovery_summary/);
 assert.match(sql,/public\.is_app_owner\(\)/);
 assert.match(sql,/revoke all on function public\.get_card_discovery_summary[\s\S]*from anon/);
 assert.match(sql,/grant execute on function public\.get_card_discovery_summary[\s\S]*to authenticated/);
 assert.match(analytics,/async function fetchDiscoverySourceSummary\(start,end\)/);
 assert.match(dashboard,/Where card interest starts/);
 assert.match(dashboard,/directional context while traffic is still small/);
});

test('clean card URLs use SPA history internally while direct static pages remain supported',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const routing=source('../beta/src/app/routing.js');
 const details=source('../beta/src/features/cards/details.js');

 assert.match(routing,/state\.collectTcgSpaCardId=id/);
 assert.match(routing,/state\.collectTcgSpaCard=true/);
 assert.match(routing,/history\.pushState\(state,"",cleanUrl\.pathname\+cleanUrl\.search\+cleanUrl\.hash\)/);
 assert.match(routing,/if\(pushedCleanUrl\)\{[\s\S]*appContext\.openDetailsModal\(card\);[\s\S]*return;/);
 assert.doesNotMatch(routing,/location\.assign\(clean\)/);
 assert.match(routing,/history\.state\.collectTcgSpaCardId/);
 assert.match(routing,/meta\[name="collect-tcg-card-id"\]/);
 assert.match(routing,/window\.addEventListener\("popstate", appContext\.router\)/);

 assert.match(details,/if\(state\.collectTcgSpaCard\)\{[\s\S]*state\.collectTcgSpaCardId=id/);
 assert.match(details,/const spaCardEntry=!!\(/);
 assert.match(details,/history\.state\.collectTcgSpaCard/);
 assert.match(details,/history\.back\(\)/);
 assert.match(details,/const cleanPage=!!document\.querySelector\('meta\[name="collect-tcg-card-id"\]'\)/);
});

test('Collector Spotlight click stops before the shared card delegate',()=>{
 const source=fs.readFileSync(new URL('../beta/src/features/content/home.js',import.meta.url),'utf8');
 assert.match(source,/data-spotlight-card-id/);
 assert.match(source,/event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*openCardRoute\(id,"spotlight"\)/);
});

test('internal card opens never reload the static SEO page',()=>{
 const routing=fs.readFileSync(new URL('../beta/src/app/routing.js',import.meta.url),'utf8');
 const openStart=routing.indexOf('async function openCardRoute');
 const openEnd=routing.indexOf('\nfunction getCollectionStats',openStart);
 const openBlock=routing.slice(openStart,openEnd);

 assert.ok(openStart>=0 && openEnd>openStart);
 assert.match(openBlock,/history\.pushState\(/);
 assert.match(openBlock,/appContext\.openDetailsModal\(card\)/);
 assert.match(openBlock,/location\.hash=fallbackTarget/);
 assert.doesNotMatch(openBlock,/appContext\.router\(\)/);
 assert.doesNotMatch(openBlock,/location\.assign\(/);
});

test('Phase 3 buyer inquiries carry full card context and record explicit copies',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const details=source('../beta/src/features/cards/details.js');
 assert.match(details,/function contactCardReferenceLines\(card\)/);
 assert.match(details,/Grade \/ Condition:/);
 assert.match(details,/Language:/);
 assert.match(details,/Price:/);
 assert.match(details,/Link:/);
 assert.match(details,/recordCardEngagement\(card\.id,"inquiry_copy",platform\)/);
 assert.match(details,/inquiry copied and ready to paste/);
});

test('Phase 3 owner card details reuse existing analytics for a private conversion summary',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const analytics=source('../beta/src/services/analytics.js');
 const details=source('../beta/src/features/cards/details.js');
 assert.match(analytics,/async function fetchOwnerCardConversionSummary\(cardId/);
 assert.match(analytics,/appContext\.fetchInsights\(start,end,\{silent:true\}\)/);
 assert.match(analytics,/appContext\.fetchCardEngagementInsights\(start,end\)/);
 assert.match(analytics,/ownerCardConversionSummaryCache/);
 assert.match(analytics,/ownerCardConversionSummaryCache = new Map/);
 assert.match(details,/data-owner-conversion="unique"/);
 assert.match(details,/data-owner-conversion="favorites"/);
 assert.match(details,/data-owner-conversion="intent"/);
 assert.match(details,/data-owner-conversion="intent-rate"/);
 assert.match(details,/appContext\.refreshOwnerCardConversionSummary\(card\.id\)/);
});

test('Phase 3 card-detail media preloading deduplicates image requests',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const catalogue=source('../beta/src/services/catalogue.js');
 const tiles=source('../beta/src/features/cards/tiles.js');
 assert.match(catalogue,/cardImageLoadPromises\.get\(id\)/);
 assert.match(catalogue,/cardImageLoadPromises\.set\(id,request\)/);
 assert.match(catalogue,/async function preloadCardDetailsMedia\(card\)/);
 assert.match(tiles,/addEventListener\("pointerover"/);
 assert.match(tiles,/addEventListener\("focusin"/);
 assert.match(tiles,/preloadCardDetailsMedia\?\.\(card\)/);
});

test('Phase 3 direct card entry renders before unrelated content finishes loading',()=>{
 const startup=fs.readFileSync(new URL('../beta/src/app/startup.js',import.meta.url),'utf8');
 assert.match(startup,/const directCardEntry=String\(initialRoute\|\|""\)\.startsWith\("card\/"\)/);
 assert.match(startup,/if\(directCardEntry\)\{\s*cardsLoaded=await appContext\.loadCards\(\)/);
 assert.match(startup,/appContext\.router\(\);[\s\S]*if\(directCardEntry\)\{[\s\S]*Promise\.allSettled/);
});

test('Phase 3 Owner Insights surfaces saved cards that have not produced buyer intent',()=>{
 const dashboard=fs.readFileSync(new URL('../beta/src/features/owner/insights-dashboard.js',import.meta.url),'utf8');
 assert.match(dashboard,/const savedWithoutIntent=safe/);
 assert.match(dashboard,/favorite_adds\|\|0\)>=1 && contactIntent\(row\)===0/);
 assert.match(dashboard,/Saved without contact/);
 assert.match(dashboard,/review price or trust signals/);
});



test('2026-09-25-v06 visitor UX keeps discovery, recovery, sharing and keyboard behavior together',()=>{
 const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
 const inventory=source('../beta/src/features/inventory/page.js');
 const filtering=source('../beta/src/features/inventory/filtering.js');
 const details=source('../beta/src/features/cards/details.js');
 const home=source('../beta/src/features/content/home.js');
 const compare=source('../beta/src/features/cards/compare.js');

 assert.match(inventory,/id="pillFilterSummary"/);
 assert.match(inventory,/id="inventoryResultCount"/);
 assert.match(inventory,/data-empty-clear-all/);
 assert.match(inventory,/data-empty-clear-search/);
 assert.match(inventory,/data-empty-clear-price/);
 assert.match(filtering,/function cardSearchScore\(card,query\)/);
 assert.match(filtering,/function cardMatchesSmartSearch\(card,query\)/);
 assert.match(details,/navigator\.share/);
 assert.match(details,/detailsLastFocusedElement/);
 assert.match(home,/premiumShelf\("Recently Viewed"/);
 assert.match(home,/source:"recently-viewed"/);
 assert.match(compare,/function handleCompareModalKeydown\(event\)/);
 assert.match(compare,/event\.key==="Escape"/);
 assert.match(compare,/compareCloseBtn/);
});
