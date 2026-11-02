// Runs browser tests and their static server in the same process lifetime.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let url;try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
 const file=path.resolve(root,'.'+(url==='/'?'/index.html':url));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data);});
});
server.listen(8000,'127.0.0.1',async()=>{
 for(const test of process.argv.slice(2)){
  const code=await new Promise(resolve=>{const child=spawn(process.execPath,[test],{cwd:root,stdio:'inherit'});child.on('exit',resolve);child.on('error',()=>resolve(1));});
  if(code!==0){process.exitCode=code||1;break;}
 }
 server.close();
});
server.on('error',error=>{console.error(error);process.exitCode=1;});
