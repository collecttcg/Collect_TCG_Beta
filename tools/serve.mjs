import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const devRoot=fileURLToPath(new URL('../dev/',import.meta.url));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.webmanifest':'application/manifest+json','.xml':'application/xml'};

const server=http.createServer((req,res)=>{
  let url;
  try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
  let relative;
  try{relative=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
  const clean=relative==='/'?'/index.html':relative.endsWith('/')?relative+'index.html':relative;
  const target=path.resolve(devRoot,'.'+clean);
  if(!(target===devRoot||target.startsWith(devRoot+path.sep))){res.writeHead(403).end();return;}
  fs.readFile(target,(err,data)=>{
    if(err){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
  });
});
server.listen(4173,'127.0.0.1',()=>console.log('Local Development: http://127.0.0.1:4173/'));
