import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const repoRoot=fileURLToPath(new URL('../',import.meta.url));
const betaRoot=fileURLToPath(new URL('../beta/',import.meta.url));

function files(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>
    entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]
  );
}

let count=0;
for(const file of files(betaRoot)){
  if(!file.endsWith('.js')) continue;
  if(/-v\d+\.js$/i.test(path.basename(file))) throw new Error('Version-suffixed active JavaScript module: '+file);
  execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
  const source=fs.readFileSync(file,'utf8');
  for(const match of source.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)){
    const target=path.resolve(path.dirname(file),match[1].split(/[?#]/,1)[0]);
    if(!fs.existsSync(target)) throw new Error('Missing module: '+target);
  }
  count++;
}

const html=fs.readFileSync(path.join(betaRoot,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)){
  const target=fileURLToPath(new URL(match[1],new URL('index.html',new URL('../beta/',import.meta.url))));
  if(!fs.existsSync(target)) throw new Error('Missing HTML asset: '+match[1]);
}
if(fs.existsSync(path.join(betaRoot,'collect-tcg-service-worker.js'))) throw new Error('Beta must not ship the production service worker.');

const retired=[
  'beta/src/app/beta-config.js',
  'beta/src/features/content/retention.js',
  'beta/src/styles/beta.css',
  'beta/assets/one-piece-card-game-logo.png',
  'beta/README.md',
  'docs/SANDBOX.md',
  'docs/package-checksums.json'
];
for(const rel of retired){
  if(fs.existsSync(path.join(repoRoot,rel))) throw new Error('Retired repository file returned: '+rel);
}

function repositoryFiles(dir,relative=''){
  const skip=new Set(['.git','node_modules','dist','migrations']);
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(entry.isDirectory() && skip.has(entry.name)) return [];
    const rel=path.join(relative,entry.name);
    const absolute=path.join(dir,entry.name);
    return entry.isDirectory()?repositoryFiles(absolute,rel):[rel];
  });
}
const misplacedSql=repositoryFiles(repoRoot).filter(rel=>rel.toLowerCase().endsWith('.sql'));
if(misplacedSql.length) throw new Error('SQL files must live under migrations/: '+misplacedSql.join(', '));

const requiredMigrations=[
  'migrations/legacy/V208-GIVEAWAY-FACEBOOK-GROUP-BONUS.sql',
  'migrations/2026/2026-09-15-v10-LANGUAGE-DETAILS.sql',
  'migrations/2026/2026-09-15-v13-EXTEND-LANGUAGE-OPTIONS.sql',
  'migrations/2026/2026-09-17-v18-COUNTRY-CARD-DEMAND.sql',
  'migrations/2026/2026-09-24-v01-SEO-PUBLIC-CATALOG.sql',
  'migrations/2026/2026-09-24-v07-DISCOVERY-ATTRIBUTION.sql',
  'migrations/2026/2026-09-24-v08-DISCOVERY-SUMMARY.sql',
  'migrations/2026/2026-09-26-v10-PUBLIC-HIDDEN-LISTING-GUARD.sql'
];
for(const rel of requiredMigrations){
  if(!fs.existsSync(path.join(repoRoot,rel))) throw new Error('Missing migration history: '+rel);
}

const styleOrder=JSON.parse(fs.readFileSync(path.join(repoRoot,'docs/style-order.json'),'utf8'));
for(const row of styleOrder){
  const file=path.join(betaRoot,row.file);
  if(!fs.existsSync(file)) throw new Error('Missing documented stylesheet: '+row.file);
}

console.log(`Checked ${count} JavaScript files, imports, HTML assets, migrations and repository structure.`);
