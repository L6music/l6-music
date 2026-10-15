'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const audio=$('#audio');audio.volume=.75;
let shuffle=false,repeat=false;let tracks=[],current=null,page='home',artistView=null,searchTerm='',objectUrl=null,db=null;
let cloudTracks=[];let cloudSession=null;const CLOUD=window.L6_CONFIG||{};const cloudEnabled=!!(CLOUD.supabaseUrl&&CLOUD.anonKey);let liked=new Set(JSON.parse(localStorage.getItem('l6-likes')||'[]'));
const gradients=[['#783cc0','#251036'],['#bd468a','#2d154a'],['#3d6ab9','#201b47'],['#ad673b','#38203e'],['#357f7c','#152a48']];
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2800)}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('l6-music-v1',1);req.onupgradeneeded=()=>{const s=req.result.createObjectStore('tracks',{keyPath:'id'});s.createIndex('artist','artist')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function allTracks(){return new Promise((resolve,reject)=>{const req=db.transaction('tracks').objectStore('tracks').getAll();req.onsuccess=()=>resolve(req.result.sort((a,b)=>b.created-a.created));req.onerror=()=>reject(req.error)})}
function deleteTrack(id){return new Promise((resolve,reject)=>{const req=db.transaction('tracks','readwrite').objectStore('tracks').delete(id);req.onsuccess=resolve;req.onerror=()=>reject(req.error)})}
function addTrack(t){return new Promise((resolve,reject)=>{const req=db.transaction('tracks','readwrite').objectStore('tracks').put(t);req.onsuccess=resolve;req.onerror=()=>reject(req.error)})}
function artSource(t){return t.artUrl||(t.art instanceof Blob?URL.createObjectURL(t.art):null)}
function cover(t,cls=''){const g=gradients[(t.color||0)%gradients.length];return `<div class="cover ${cls}" style="--c1:${g[0]};--c2:${g[1]}">${artSource(t)?`<img src="${esc(artSource(t))}" alt="Cover art for ${esc(t.title)}">`:'L6'}</div>`}
function tile(t){return `<article class="tile"><div data-play="${t.id}">${cover(t)}</div><strong>${esc(t.title)}</strong><small>${esc(t.artist)} · ${esc(t.genre)}</small><div class="tile-actions"><button data-play="${t.id}" aria-label="Play ${esc(t.title)}">▶ Play</button><button data-like="${t.id}" aria-label="Toggle favourite">${liked.has(t.id)?'♥':'♡'}</button></div></article>`}
function cards(items){return items.length?`<div class="grid">${items.map(tile).join('')}</div>`:`<div class="empty"><h3>No music here yet</h3><p>Go to Artist Studio and upload an audio file to get started.</p><button class="primary" data-page="upload">Upload your first track</button></div>`}
function section(title,items,action){return `<div class="section-head"><h2>${title}</h2>${action?`<button data-page="${action}">View all →</button>`:''}</div>${cards(items)}`}
function artists(){const map=new Map();tracks.forEach(t=>map.set(t.artist,(map.get(t.artist)||0)+1));return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]))}
function render(){const content=$('#content');document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));let html='';
if(page==='home'){html=`<div class="hero"><div class="eyebrow">WELCOME TO L6 MUSIC</div><h1>Independent sound.<br>Unlimited possibility.</h1><p>A new home for independent artists. Upload your music, discover fresh voices, and make your sound heard.</p><button class="primary" data-page="discover">Explore music →</button><span class="hero-art">♫</span></div>${section('Fresh uploads',tracks.slice(0,8),'discover')}${section('From your library',tracks.filter(t=>liked.has(t.id)).slice(0,4),'library')}`}
if(page==='discover'){html=`<h1 class="page-title">Discover music</h1><p class="page-intro">Explore independent sounds from the L6 community.</p>${cards(tracks.filter(t=>[t.title,t.artist,t.genre].join(' ').toLowerCase().includes(searchTerm)))}`}
if(page==='artists'){html=`<h1 class="page-title">Artists</h1><p class="page-intro">Find the creators behind the sound.</p><div class="artist-list">${artists().map(([name,count])=>`<div class="artist-row" data-artist="${encodeURIComponent(name)}"><div class="avatar">${esc(name.slice(0,2).toUpperCase())}</div><div><strong>${esc(name)}</strong><small>${count} track${count===1?'':'s'}</small></div><span class="arrow">→</span></div>`).join('')||'<div class="empty">No artist profiles yet. Upload a track to create one.</div>'}</div>`}
if(page==='profile'){const ts=tracks.filter(t=>t.artist===artistView);html=`<div class="profile"><div class="avatar">${esc((artistView||'L6').slice(0,2).toUpperCase())}</div><div><div class="eyebrow">ARTIST PROFILE</div><h1>${esc(artistView)}</h1><p class="muted">${ts.length} published track${ts.length===1?'':'s'}</p></div></div>${section('Releases',ts)}`}
if(page==='library'){html=`<h1 class="page-title">Your library</h1><p class="page-intro">Tracks you've saved on this browser.</p>${cards(tracks.filter(t=>liked.has(t.id)))}`}
if(page==='upload'){html=`<h1 class="page-title">Artist Studio</h1><p class="page-intro">Share your sound with L6 Music.</p><div class="notice"><strong>Prototype mode:</strong> Files are saved in this browser only, not uploaded to a public server. Upload music you own or have permission to use. Avoid private or sensitive files.</div><form id="uploadForm" class="form-card"><label for="title">Track title *</label><input id="title" name="title" maxlength="100" required placeholder="e.g. A New Beginning"><label for="artist">Artist name *</label><input id="artist" name="artist" maxlength="100" required placeholder="e.g. Lenze26"><label for="genre">Genre</label><select id="genre" name="genre"><option>Hip-Hop</option><option>Afrobeats</option><option>R&B / Soul</option><option>Reggae</option><option>Gospel</option><option>Electronic</option><option>Pop</option><option>Other</option></select><label for="audioFile">Audio file * (MP3, WAV, M4A, OGG)</label><input id="audioFile" name="audioFile" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/ogg,.mp3,.wav,.m4a,.ogg" required><label for="artFile">Cover artwork (optional)</label><input id="artFile" name="artFile" type="file" accept="image/png,image/jpeg,image/webp"><p class="hint">Maximum audio file size: 40 MB. Artwork: 5 MB. Your browser may limit total storage. Large files are best handled with cloud storage in the next version.</p><label class="hint"><input type="checkbox" id="rights" required style="width:auto;margin-right:8px">I own this recording or have permission to upload it.</label><button class="primary" type="submit">Publish to my browser library</button></form><div class="section-head"><h2>Manage local uploads</h2></div>${tracks.length?`<div class="manage-list">${tracks.map(t=>`<div class="manage-row"><span>${esc(t.title)} — ${esc(t.artist)}</span><button data-delete="${t.id}" aria-label="Delete ${esc(t.title)}">Delete</button></div>`).join('')}</div>`:'<p class="muted">No tracks uploaded yet.</p>'}` }
content.innerHTML=html}
function navigate(p){page=p;artistView=null;if(p!=='discover')searchTerm='';if(p!=='discover')$('#search').value='';render();$('.sidebar').classList.remove('open');window.scrollTo(0,0)}
function time(n){if(!Number.isFinite(n))return '0:00';return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`}
function updatePlayer(){const t=tracks.find(x=>x.id===current);$('#nowTitle').textContent=t?.title||'Nothing playing';$('#nowArtist').textContent=t?.artist||'Choose a track to listen';$('#favBtn').textContent=t&&liked.has(t.id)?'♥':'♡';const c=$('#playerCover');c.textContent=t?'♫':'L6';if(t){const g=gradients[t.color%gradients.length];c.style.background=`linear-gradient(135deg,${g[0]},${g[1]})`;if(artSource(t)){c.textContent='';const img=document.createElement('img');img.src=artSource(t);img.alt='';c.append(img)}}$('#playBtn').textContent=audio.paused?'▶':'Ⅱ'}
function play(id){const t=tracks.find(x=>x.id===id);if(!t)return;if(current!==id){if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=t.audioUrl?null:URL.createObjectURL(t.audio);audio.src=t.audioUrl||objectUrl;current=id}audio.play().catch(()=>toast('Unable to play this audio file'));updatePlayer()}
function toggle(){if(!current){if(tracks.length)play(tracks[0].id);else toast('Upload a song to start listening');return}audio.paused?audio.play().catch(()=>toast('Playback unavailable')):audio.pause();updatePlayer()}
function skip(direction){if(!tracks.length)return;const i=tracks.findIndex(t=>t.id===current);const j=shuffle&&tracks.length>1?(i+1+Math.floor(Math.random()*(tracks.length-1)))%tracks.length:(i+direction+tracks.length)%tracks.length;play(tracks[j].id)}
function like(id){if(!id)return;liked.has(id)?liked.delete(id):liked.add(id);localStorage.setItem('l6-likes',JSON.stringify([...liked]));updatePlayer();render()}
document.addEventListener('click',e=>{const p=e.target.closest('[data-page]');if(p){navigate(p.dataset.page);return}const a=e.target.closest('[data-artist]');if(a){artistView=decodeURIComponent(a.dataset.artist);page='profile';render();return}const del=e.target.closest('[data-delete]');if(del){const t=tracks.find(x=>x.id===del.dataset.delete);if(!t||!confirm('Delete '+t.title+' from this browser? This cannot be undone.'))return;(async()=>{try{await deleteTrack(t.id);if(current===t.id){audio.pause();audio.removeAttribute('src');audio.load();current=null;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;}tracks=await allTracks();liked.delete(t.id);localStorage.setItem('l6-likes',JSON.stringify([...liked]));render();updatePlayer();toast('Track deleted')}catch(err){toast('Unable to delete track')}})();return}const l=e.target.closest('[data-like]');if(l){like(l.dataset.like);return}const t=e.target.closest('[data-play]');if(t){play(t.dataset.play)}});
document.addEventListener('submit',async e=>{if(e.target.id!=='uploadForm')return;e.preventDefault();const f=e.target,af=f.elements.namedItem('audioFile').files[0],art=f.elements.namedItem('artFile').files[0];if(!af||af.size>40*1024*1024){toast('Select an audio file under 40 MB');return}if(art&&art.size>5*1024*1024){toast('Artwork must be under 5 MB');return}if(!af.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|ogg)$/i.test(af.name)){toast('Please choose a supported audio file');return}if(art&&!art.type.startsWith('image/')){toast('Please choose an image file');return}const button=f.querySelector('[type=submit]');button.disabled=true;button.textContent='Saving…';try{await addTrack({id:crypto.randomUUID(),title:f.elements.namedItem('title').value.trim(),artist:f.elements.namedItem('artist').value.trim(),genre:f.elements.namedItem('genre').value,created:Date.now(),color:Math.floor(Math.random()*gradients.length),audio:af,art:art||null});tracks=[...cloudTracks,...await allTracks()];navigate('home');toast('Track added to your local L6 Music library!')}catch(err){console.error(err);toast('Unable to save. Browser storage may be full.');button.disabled=false;button.textContent='Publish to my browser library'}});
$('#search').addEventListener('input',e=>{searchTerm=e.target.value.trim().toLowerCase();page='discover';render()});$('#mobileMenu').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));$('#playBtn').addEventListener('click',toggle);$('#shuffleBtn').addEventListener('click',()=>{shuffle=!shuffle;$('#shuffleBtn').classList.toggle('enabled',shuffle);toast(shuffle?'Shuffle on':'Shuffle off')});$('#repeatBtn').addEventListener('click',()=>{repeat=!repeat;$('#repeatBtn').classList.toggle('enabled',repeat);toast(repeat?'Repeat track on':'Repeat off')});$('#prevBtn').addEventListener('click',()=>skip(-1));$('#nextBtn').addEventListener('click',()=>skip(1));$('#favBtn').addEventListener('click',()=>like(current));$('#volume').addEventListener('input',e=>audio.volume=e.target.value/100);$('#seek').addEventListener('input',e=>{if(Number.isFinite(audio.duration))audio.currentTime=audio.duration*e.target.value/100});audio.addEventListener('timeupdate',()=>{$('#currentTime').textContent=time(audio.currentTime);$('#duration').textContent=time(audio.duration);$('#seek').value=audio.duration?100*audio.currentTime/audio.duration:0});audio.addEventListener('loadedmetadata',()=>$('#duration').textContent=time(audio.duration));audio.addEventListener('play',updatePlayer);audio.addEventListener('pause',updatePlayer);audio.addEventListener('ended',()=>{if(repeat){audio.currentTime=0;audio.play().catch(()=>{})}else skip(1)});
(async()=>{try{db=await openDB();tracks=[...cloudTracks,...await allTracks()];render();updatePlayer()}catch(err){console.error(err);$('#content').innerHTML='<div class="empty"><h3>Browser storage unavailable</h3><p>Please use a modern browser with local storage enabled, and access the app through localhost.</p></div>'}})();

if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

// Supabase public catalogue and authenticated uploads.
// Public anon key is safe in client code; never use a service-role or secret key here.
function endpoint(path){return CLOUD.supabaseUrl.replace(/\/$/,'')+path}
function headers(token){return {'apikey':CLOUD.anonKey,...(token?{'Authorization':'Bearer '+token}:{})}}
async function cloudRequest(path,options={}){
 const r=await fetch(endpoint(path),{...options,headers:{...headers(cloudSession?.access_token),...(options.headers||{})}});
 if(!r.ok)throw Error((await r.text()).slice(0,250));
 return r.status===204?null:r.json();
}
async function refreshCloud(){
 if(!cloudEnabled)return;
 while(!db)await new Promise(r=>setTimeout(r,50));
 const rows=await cloudRequest('/rest/v1/tracks?select=id,title,artist,genre,audio_path,art_path,created_at&order=created_at.desc&limit=500');
 const base=endpoint('/storage/v1/object/public/'+encodeURIComponent(CLOUD.bucket||'l6-music')+'/');
 cloudTracks=rows.map(t=>({id:t.id,title:t.title,artist:t.artist,genre:t.genre,created:Date.parse(t.created_at),color:0,
 audioUrl:base+t.audio_path.split('/').map(encodeURIComponent).join('/'),
 artUrl:t.art_path?base+t.art_path.split('/').map(encodeURIComponent).join('/'):null,cloud:true}));
 tracks=[...cloudTracks,...await allTracks()];
 render();updatePlayer();
}
async function signIn(email,password){
 const r=await fetch(endpoint('/auth/v1/token?grant_type=password'),{method:'POST',
 headers:{'apikey':CLOUD.anonKey,'Content-Type':'application/json'},
 body:JSON.stringify({email,password})});
 const data=await r.json();if(!r.ok)throw Error(data.msg||data.error_description||'Sign-in failed');
 cloudSession=data;return data;
}
async function uploadObject(path,file){
 const r=await fetch(endpoint('/storage/v1/object/'+encodeURIComponent(CLOUD.bucket||'l6-music')+'/'+path),{
 method:'POST',headers:{...headers(cloudSession.access_token),'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
 if(!r.ok)throw Error((await r.text()).slice(0,250));
}
async function publishCloud(form){
 const audioFile=form.elements.namedItem('audioFile').files[0],art=form.elements.namedItem('artFile').files[0];
 const id=crypto.randomUUID(),prefix=cloudSession.user.id+'/'+id+'/';
 const ext=(f)=>f.name.split('.').pop().toLowerCase();
 const audioPath=prefix+'audio.'+ext(audioFile),artPath=art?prefix+'cover.'+ext(art):null;
 await uploadObject(audioPath,audioFile);
 if(art)await uploadObject(artPath,art);
 await cloudRequest('/rest/v1/tracks',{method:'POST',
 headers:{'Content-Type':'application/json','Prefer':'return=minimal'},
 body:JSON.stringify({id,owner_id:cloudSession.user.id,title:form.elements.namedItem('title').value.trim(),
 artist:form.elements.namedItem('artist').value.trim(),genre:form.elements.namedItem('genre').value,
 audio_path:audioPath,art_path:artPath})});
 await refreshCloud();
}
document.addEventListener('submit',async e=>{
 if(e.target.id==='cloudLogin'){
 e.preventDefault();try{await signIn(e.target.elements.namedItem('email').value,e.target.elements.namedItem('password').value);toast('Signed in');render()}
 catch(err){toast('Sign-in failed: '+err.message)}}
},true);
// Intercept uploads only when cloud is configured AND artist is signed in.
document.addEventListener('submit',async e=>{
 if(e.target.id!=='uploadForm'||!cloudEnabled)return;
 e.stopImmediatePropagation();e.preventDefault();
 if(!cloudSession){toast('Sign in before publishing');return}
 const af=e.target.elements.namedItem('audioFile').files[0],art=e.target.elements.namedItem('artFile').files[0];
 if(!af||af.size>40*1024*1024||!['audio/mpeg','audio/wav','audio/x-wav','audio/mp4','audio/x-m4a','audio/ogg'].includes(af.type)){toast('Choose a supported audio file under 40 MB');return}
 if(art&&(art.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(art.type))){toast('Artwork must be JPG, PNG or WebP under 5 MB');return}
 const b=e.target.querySelector('[type=submit]');b.disabled=true;b.textContent='Publishing…';
 try{await publishCloud(e.target);navigate('home');toast('Song published to L6 Music')}
 catch(err){console.error(err);toast('Cloud upload failed: '+err.message);b.disabled=false;b.textContent='Publish to L6 Music'}
},true);
const oldRender=render;
render=function(){
 oldRender();
 if(page!=='upload'||!cloudEnabled)return;
 const notice=document.querySelector('.notice');if(notice)notice.innerHTML='<strong>Cloud mode:</strong> Published tracks are shared with visitors. Only upload music you have permission to distribute.';
 const button=document.querySelector('#uploadForm button[type=submit]');if(button)button.textContent='Publish to L6 Music';
 const container=document.querySelector('#uploadForm');
 if(!cloudSession){
 container.insertAdjacentHTML('beforebegin',`<form id="cloudLogin" class="form-card"><h2>Artist sign in</h2><label>Email</label><input name="email" type="email" required autocomplete="email"><label>Password</label><input name="password" type="password" required autocomplete="current-password"><button class="primary">Sign in</button></form><p class="hint">An administrator must create or invite artist accounts in Supabase.</p>`);
 container.style.display='none';
 }
 const manage=document.querySelector('.manage-list');if(manage)manage.style.display='none';
};
if(cloudEnabled){
 // Local library stays available when the cloud is temporarily unreachable.
 window.addEventListener('load',()=>setTimeout(()=>refreshCloud().catch(err=>{console.error(err);toast('Cloud catalogue unavailable; showing local library')}),300));
}
