import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'..');
const beta=path.join(repo,'beta');

test('beta mirror does not contain the obsolete beta-only runtime shim',()=>{
  assert.equal(fs.existsSync(path.join(beta,'src/app/beta-runtime.js')),false);
});

test('beta entry point uses the same production application structure',()=>{
  const html=fs.readFileSync(path.join(beta,'index.html'),'utf8');
  assert.match(html,/src\/main\.js/);
  assert.doesNotMatch(html,/beta-runtime\.js/);
});

test('beta mirror contains the current production UI assets',()=>{
  for(const rel of [
    'src/features/cards/details.js',
    'src/ui/enhancement-2.js',
    'src/styles/26-compatibility.css',
    'assets/shop-logo.png'
  ]) assert.equal(fs.existsSync(path.join(beta,rel)),true,rel);
});
