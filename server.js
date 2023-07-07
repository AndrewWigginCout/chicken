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

var roots = {'a':'/media/x/BAC8697EC86939B11/Users/X/Music','b':'/run/media/public/sdb2/_s/_ks/music'}
var head        = fs.readFileSync(path.join(__dirname, "head.html"));
var player_html = fs.readFileSync(path.join(__dirname, "player.html"));
var player_js   = fs.readFileSync(path.join(__dirname, "player.js"));
var locally_hosted_files = [
  "/style.css",
  "/favicon.ico",
  "/ajax/libs/font-awesome/5.13.0/css/all.min.css",
  "/ajax/libs/font-awesome/5.13.0/webfonts/fa-solid-900.woff2",
  "/ajax/libs/font-awesome/5.13.0/webfonts/fa-solid-900.woff",
  "/ajax/libs/font-awesome/5.13.0/webfonts/fa-solid-900.ttf"
]
function sendfile(fullpath,res){
  fs.readFile(fullpath, function(error, data) {
    console.log(`serving file ${fullpath}`);
    if (error) {
      console.log("error=", error);
      res.writeHead(404);
      res.write('404 Error: File Not Found');
    } else {
      res.write(data);
    }
    res.end();
  })
}
function directory_listing(segpath) {
  if (! segpath[0] in roots) {return 'segpath[0] not in roots';}
  var root = roots[segpath[0]];
  var leaf = path.join(...segpath.slice(1))
  var fullpath = path.join(root,leaf)
  var mp3_list = [];
  var possible_images = ["Folder.jpg", "folder.jpg", "Cover.jpg", "cover.jpg", "AlbumArtSmall.jpg"];
  var possible_formats = ["wav", "mp3", "aac", "ogg", "webm", "flac", "m4a", "opus"];
  var cover;
  var f_music = ''
  var f_reg = ''
  var d = ''
  files = fs.readdirSync(fullpath);
  files.forEach(file => {
    var stat = fs.statSync(path.join(fullpath,file));
    if (stat && stat.isDirectory()) {
      d +=`  <li><a href="./${file}/">${file}/</a></li>\n`;
    } else {
      if (possible_formats.includes(file.split('.').pop().toLowerCase())){
        mp3_list.push(file);
        f_music +=`  <li><a href="./${file}">${file}</a></li>\n`;
      } else {
        f_reg +=`  <li><a href="./${file}">${file}</a></li>\n`;
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
  var ul = `<ul>
  <li><a href="..">..</li>
${d}</ul>
<hr>
<ol>
${f_music}</ol>
<hr>
<ul>
${f_reg}</ul>
`
  console.log("cover=",cover);
  // Don't sweat track_list having undefined values, they disappear when stringifying
  var track_list=[];
  mp3_list.forEach(file => {
    track_list.push({
      image: cover,
      path: file,
      name: file,
      artist: segpath[segpath.length-2]
    })
  })
  console.log("track_list=\n", track_list);
  var dl=`<hr>
<h1>Directory listing for ${leaf}</h1>
${ul}`

  var tail =`<!-- Load the main script for the player -->
<script>
var track_list = ${JSON.stringify(track_list,null,2)};
${player_js}
</script>
</body>
</html>`;
  //console.log("HTML=");
  //console.log(html);
  return head+'\n'+player_html+'\n'+dl+'\n'+tail;
  }
const requestListener = function (req, res) {
  var decodedurl = decodeURIComponent(req.url);
  console.log('decodedurl=',decodedurl)
  if (locally_hosted_files.includes(req.url)){
    console.log('locally hosted includes');
    var fullpath=path.join(__dirname,path.basename(req.url))
    sendfile(fullpath,res);
    console.log('returned from sendfile. file: '+fullpath);
    return;
  }
  console.log('not locally hosted')
if (Object.keys(roots).length > 1){
  if (req.url === '/' || req.url === '/index.html') {
    s=''
    for (const [k,v] of Object.entries(roots)){
      console.log(k,v)
      s+=`  <li><a href = "./${k}/">${k}</a></li>\n`
    }
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    return res.end(`${head}
<ul>
${s}
</ul>
</body>
</html>`)
  }
  var segpath = decodedurl.split(path.sep);
  segpath = segpath.filter(x => x != '');
  //console.log('segpath=',segpath)
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
    console.log(`catch fs.statSync(${fullpath} failed.`)
    res.setHeader("Content-Type", "text/html");
    res.writeHead(404);
    res.end('path does not exist in hard drive');
    return;
  }
  if (stat && stat.isDirectory()){
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(directory_listing(segpath));
    return;
  }
  if (stat && stat.isFile()){
  sendfile(fullpath,res);
  return;
  }
  console.log("----THIS CONDITION SHOULD BE IMPOSSIBLE-----")
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
