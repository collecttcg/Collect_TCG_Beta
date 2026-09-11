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
