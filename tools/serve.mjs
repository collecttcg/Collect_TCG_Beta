import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 let url;
 try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400).end();return;}
 if(url.pathname==='/'){res.writeHead(302,{Location:'/beta/'}).end();return;}
 if(!url.pathname.startsWith('/beta/')){res.writeHead(404).end();return;}
 let relative;try{relative=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
 const target=path.resolve(root,'.'+relative+(relative.endsWith('/')?'index.html':''));
 if(!target.startsWith(path.join(root,'beta')+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);});
});
server.listen(4173,'127.0.0.1',()=>console.log('Local development: http://127.0.0.1:4173/beta/'));
