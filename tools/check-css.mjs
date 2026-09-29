import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const styleDir=path.join(root,"dev/src/styles");
const files=fs.readdirSync(styleDir).filter(name=>name.endsWith(".css")).sort();
const deadSelectors=[".mobile-buy-sticky",".mobile-buy-backdrop",".mobile-buy-close",".detail-action-bar",".home-premium-hero-meta",".home-premium-hero-visual",".desktop-filter-panel",".inventory-search-filter-row",".home-discovery-grid",".inventory-grid"];

function assertCssSyntax(file,text){
  if(/\\n\\n\/\*/.test(text)) throw new Error(`${file}: literal escaped newlines found outside generated strings`);
  let depth=0,quote="",comment=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(comment){ if(ch==="*"&&next==="/"){comment=false;i++;} continue; }
    if(quote){ if(ch==="\\"){i++;continue;} if(ch===quote) quote=""; continue; }
    if(ch==="/"&&next==="*"){comment=true;i++;continue;}
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==="{") depth++;
    if(ch==="}"){depth--;if(depth<0) throw new Error(`${file}: unexpected }`);}
  }
  if(comment||quote||depth!==0) throw new Error(`${file}: unbalanced CSS structure (${JSON.stringify({comment,quote,depth})})`);
}

for(const name of files){
  const file=path.join(styleDir,name);
  const text=fs.readFileSync(file,"utf8");
  assertCssSyntax(name,text);
}
const sourceFiles=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else sourceFiles.push(full);}}
walk(path.join(root,"dev"));
const nonCss=sourceFiles.filter(file=>!file.endsWith(".css")&&!file.includes(`${path.sep}cards${path.sep}`)).map(file=>fs.readFileSync(file,"utf8")).join("\n");
for(const selector of deadSelectors){
  const cls=selector.slice(1);
  if(nonCss.includes(cls)) throw new Error(`Dead-selector guard is no longer valid: ${selector} is referenced by active source`);
  for(const name of files){
    const text=fs.readFileSync(path.join(styleDir,name),"utf8");
    if(text.includes(selector)) throw new Error(`${name}: obsolete selector remains: ${selector}`);
  }
}
console.log(`CSS checks passed (${files.length} active stylesheets).`);
