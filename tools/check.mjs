import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import { execFileSync } from 'node:child_process';
const root=new URL('../beta/',import.meta.url);
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
let count=0;
for(const file of files(fileURLToPath(root))){
 if(!file.endsWith('.js'))continue;
 execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
 const source=fs.readFileSync(file,'utf8');
 for(const match of source.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)){
  const target=path.resolve(path.dirname(file),match[1]);
  if(!fs.existsSync(target))throw new Error('Missing module: '+target);
 }
 count++;
}
const html=fs.readFileSync(new URL('index.html',root),'utf8');
for(const m of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)){
 const target=new URL(m[1],new URL('index.html',root));
 if(!fs.existsSync(target))throw new Error('Missing HTML asset: '+m[1]);
}
if(fs.existsSync(new URL('collect-tcg-service-worker.js',root)))throw new Error('Beta must not ship the production service worker.');
console.log(`Checked ${count} JavaScript files, imports and HTML assets.`);
