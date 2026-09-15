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
 assert.match(drop,/Full photos, prices & availability/);
 for(const card of cards.slice(0,3)) assert.match(drop,new RegExp(card.name));
 for(const card of cards.slice(3)) assert.doesNotMatch(drop,new RegExp(card.name));
 const full=a.buildFbCardListPost(cards,{...prefs,postFormat:"full"});
 assert.match(full,/CARD LIST/);
});
