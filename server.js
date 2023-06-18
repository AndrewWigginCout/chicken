const http = require("http");
const fs   = require('fs');
const path = require('path');

const host = '0.0.0.0';
const port = 8080;
//var root = process.argv[2] || '/media/x/BAC8697EC86939B11/Users/X/Music/';
var root = process.argv[2] || '/run/media/public/sdb2/_s/_ks/music/';
if (root[root.length-1]==='/'){
  root = root.substring(0,root.length-1);}
console.log('root=',root);

var roots = {40:'/run/media/public/sdb2/_s/_ks/music',8:'/media/x/BAC8697EC86939B11/Users/X/Music'}
function stripfirst(n){
  if (n[0]==='/'){
    n=n.slice(1)
  }
  var v = n.split('/')
  v2 = v.slice(1)
  //console.log(v)
  return [v[0], '/'+v2.join('/')]
}
var head        = fs.readFileSync(path.join(__dirname, "head.html"));
var css         = fs.readFileSync(path.join(__dirname, "style.css"));
var player_html = fs.readFileSync(path.join(__dirname, "player.html"));
var player_js   = fs.readFileSync(path.join(__dirname, "player.js"));

function directory_listing(segpath) {
  if (! segpath[0] in roots) {return 'segpath[0] not in roots';}
  var root = roots[segpath[0]];
  var leaf = path.join(...segpath.slice(1))
  var fullpath = path.join(root,leaf)
  var mp3_list = [];
  var possible_images = ["Folder.jpg", "folder.jpg", "Cover.jpg", "cover.jpg", "AlbumArtSmall.jpg"];
  var possible_formats = ["wav", "mp3", "aac", "ogg", "webm", "flac", "m4a", "opus"];
  var cover;
  var ul = `<ul>
  <li><a href="..">..</li>
  `
  var f = ''
  var d = ''
  files = fs.readdirSync(fullpath);
  files.forEach(file => {
    console.log("gen file=", file);
    var stat = fs.statSync(path.join(fullpath,file));
    if (stat && stat.isDirectory()) {
      d +=`<li><a href="./${file}/">${file}/</a></li>\n`;
    } else {
      f +=`<li><a href="./${file}">${file}</a></li>\n`;
      if (possible_formats.includes(file.split('.').pop().toLowerCase())){
        mp3_list.push(file);
      }
      if (possible_images.includes(file.toLowerCase())){
        console.log("cover art found");
        cover = file;
      }
      else if (file === 'folder.jpg'){
        cover = 'folder.jpg'
      }
    }
  });
  ul += d + "<hr>" + f;
  console.log("cover=",cover);
  var track_list=[];
  mp3_list.forEach(file => {
    track_list.push({
      image: cover,
      path: file,
      name: file,
      artist: segpath[segpath.length-3]
    })
  })
  ul += `<ul>\n`
  //console.log("track_list=", track_list);
  var dl=`
  <hr>
  <h1>Directory listing for ${leaf}</h1>
  ${ul}`

  var tail =`<!-- Load the main script for the player -->
  <script>
  var track_list = ${JSON.stringify(track_list)};
  ${player_js}
  </script>
  </body>
  </html>`;
  //console.log("HTML=");
  //console.log(html);
  return head+player_html+dl+tail;
  }
const requestListener = function (req, res) {
  var decodedurl = decodeURIComponent(req.url);
  console.log('req.url=',req.url)
  console.log('decodedurl=',decodedurl)
  if (decodedurl === "/style.css") {
    res.setHeader("Content-Type", "text/css");
    res.writeHead(200);
    res.end(css);
    return;
  }
if (Object.keys(roots).length > 1){
  if (decodedurl === '/') {
    s=''
    for (const [k,v] of Object.entries(roots)){
      console.log(k,v)
      s+=`  <li><a href = "./${k}/">${k}</a></li>\n`
    }
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    return res.end(`<ul>\n${s}</ul>`)
  }
  var segpath = decodedurl.split(path.sep);
  segpath = segpath.filter(x => x != '');
  console.log('segpath=',segpath)
  if (! (segpath[0] in roots)) {
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end('segpath[0] not in roots');
    return;
  }
  var root = roots[segpath[0]];
  var leaf = path.join(...segpath.slice(1))
  var fullpath = path.join(root,leaf)
  try {
    var stat = fs.statSync(fullpath);
  } catch{
    console.log('catch line 135')
    res.setHeader("Content-Type", "text/html");
    res.writeHead(404);
    res.end('path does not exist in hard drive');
    return;
  }
  if (stat && stat.isDirectory()){
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    return res.end(directory_listing(segpath));
  }

  fs.readFile(fullpath, function(error, data) {
    console.log("req some file or something");
    if (error) {
      console.log("error=", error);
      res.writeHead(404);
      res.write('Error: File Not Found');
    } else {
      res.write(data);
    }
    res.end();
  })
} else{
  //console.log("stat=", stat);
  //console.log("stat.isDirectory()=", stat.isDirectory());
  //console.log("stat.isFile()=", stat.isFile());
  
  try {
    console.log("RL try");
    var stat = fs.statSync(fullpath);
  } catch{
    return;
  }
  if (stat && stat.isDirectory()){
    // if (relpath.length>1 && relpath[relpath.length]!='/'){
    //   relpath+='/';
    // }
    //console.log("is directory");

    if (relpath[relpath.length-1]!='/') relpath+='/';
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    var content = directory_listing(root,relpath);
    res.end(content);
    return;
  }

  fs.readFile(root + relpath, function(error, data) {
    console.log("req some file or something");
    if (error) {
      console.log("error=", error);
      res.writeHead(404);
      res.write('Error: File Not Found');
    } else {
      res.write(data);
    }
    res.end();
  })


}
}
const server = http.createServer(requestListener);
server.listen(port, host, (error) => {
  if (error) {
    console.log('Something went wrong', error);
  } else {
  console.log(`Server is running on http://${host}:${port}`);
  }
});
