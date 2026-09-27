import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath,[new URL('./check.mjs',import.meta.url).pathname],{stdio:'inherit'});
const output=new URL('../dist/dev/',import.meta.url);
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
fs.cpSync(new URL('../dev/',import.meta.url),output,{recursive:true});
console.log('Built dist/dev/. Deploy this validated dev folder as the GitHub Pages artifact root.');
