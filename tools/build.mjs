import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath,[new URL('./check.mjs',import.meta.url).pathname],{stdio:'inherit'});
const output=new URL('../dist/beta/',import.meta.url);
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
fs.cpSync(new URL('../beta/',import.meta.url),output,{recursive:true});
console.log('Built dist/beta/. Upload only this beta folder; never replace root index.html.');
