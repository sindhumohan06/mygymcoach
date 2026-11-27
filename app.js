const KEY='pullup-coach-v1';
const AKEY='pullup-coach-avatar';
let AVATAR=null; try{ AVATAR=localStorage.getItem(AKEY); }catch(e){}
function avatarHTML(cls){
  const inner = AVATAR ? `<img class="${cls}" src="${AVATAR}" alt="Sindhu">` : `<span class="${cls} avph" aria-hidden="true">S</span>`;
  return `<label class="avpick" aria-label="Change photo">${inner}<input type="file" accept="image/*" class="avinput" hidden></label>`;
}
function bindAvatar(){ document.querySelectorAll('.avinput').forEach(inp=>inp.onchange=()=>{
  const f=inp.files&&inp.files[0]; if(!f) return; const url=URL.createObjectURL(f), img=new Image();
  img.onload=()=>{ const n=240, c=document.createElement('canvas'); c.width=c.height=n; const k=Math.min(img.width,img.height);
    c.getContext('2d').drawImage(img,(img.width-k)/2,(img.height-k)/2,k,k,0,0,n,n); URL.revokeObjectURL(url);
    AVATAR=c.toDataURL('image/jpeg',0.85); try{ localStorage.setItem(AKEY,AVATAR); }catch(e){} render(); };
  img.src=url; }); }
const HKEY='pullup-coach-history', FINISH_MS=3*60*1000;
// No weekly target: the count of sessions this week, e.g. "2 times this week"
const timesWeek = n => n===1?'time this week':'times this week';
// A line icon that grows with the week: seedling (0), spark (1), flame (2), bolt (3), trophy (4 or more)
const WEEK_ICONS = [
  '<path d="M12 21v-9"/><path d="M12 12C12 8.5 9.5 6 5.5 6c0 3.5 2.5 6 6.5 6z"/><path d="M12 10c0-3 2.2-5 5.5-5 0 3-2.2 5-5.5 5z"/>',
  '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  '<path d="M12 22c3.9 0 7-2.9 7-7 0-3.6-2.4-6.4-4.5-8.5 0 2.5-1.4 4-3 4.5C11.5 8 10 5 8 2.5 8 6.2 5 8.6 5 13.2 5 18.4 8.1 22 12 22z"/>',
  '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  '<path d="M8 4h8v6a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 14v4M8.5 21h7M10 18h4v3h-4z"/>'
];
const weekIcon = n => `<svg class="wkicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${WEEK_ICONS[Math.min(n,4)]}</svg>`;
const ymd = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today = () => ymd(new Date());
function fresh(){ return {date:today(), step:0, done:{}, finished:false, view:'welcome'}; }
let S = fresh();
try{ const raw = JSON.parse(localStorage.getItem(KEY));
  if(raw && raw.date===today()){
    if(raw.finished && raw.finishedAt && Date.now()-raw.finishedAt < FINISH_MS) S = raw;
    else if(!raw.finished && raw.view==='workout') S = raw;
  } }catch(e){}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
let history = [];
try{ history = JSON.parse(localStorage.getItem(HKEY)) || []; }catch(e){}
function saveHistory(){ try{ localStorage.setItem(HKEY, JSON.stringify(history)); }catch(e){} }
function logSession(){ if(!history.includes(today())) history.push(today()); saveHistory(); }
function unlogSession(k){ history=history.filter(x=>x!==k); saveHistory(); }
// Hang practice days, kept apart from workouts so they don't count towards the week
const GKEY='pullup-coach-hangs';
let hangs = [];
try{ hangs = JSON.parse(localStorage.getItem(GKEY)) || []; }catch(e){}
function saveHangs(){ try{ localStorage.setItem(GKEY, JSON.stringify(hangs)); }catch(e){} }
function logHang(){ if(!hangs.includes(today())) hangs.push(today()); saveHangs(); }
function unlogHang(k){ hangs=hangs.filter(x=>x!==k); saveHangs(); }
// Weeks run Sunday to Saturday
const weekStart = d => new Date(d.getFullYear(),d.getMonth(),d.getDate()-d.getDay());
function weekCount(){ const start=ymd(weekStart(new Date()));
  return history.filter(x=>x>=start && x<=today()).length; }
// Rolling calendar: one row per week (Sun to Sat), this week at the top, older weeks below.
// Home: back to the week of the first session (no earlier weeks), with dates and month names; scrolls down for older weeks.
// Mini (finish screen): just the last 4 weeks, no text.
const dayName = k => { const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'short'}); };
const loggedWhat = k => [history.includes(k)&&'workout', hangs.includes(k)&&'hang practice'].filter(Boolean).join(' and ');
// The remove sheet for a logged day: one Remove button, or a choice when both were logged
function rmSheet(k){
  const w=history.includes(k), g=hangs.includes(k);
  if(w&&g) return `<h2 class="leavetitle" id="rmtitle">Remove which?</h2><p class="leavetext" id="rmtext">${dayName(k)}</p>
    <div class="leavebtns stack"><button class="btn primary" data-rm="w">Workout</button><button class="btn primary" data-rm="g">Hang practice</button><button class="btn quiet" id="rmkeep">Keep</button></div>`;
  return `<h2 class="leavetitle" id="rmtitle">${w?'Remove this session?':'Remove hang practice?'}</h2>
    <p class="leavetext" id="rmtext">${w?`${dayName(k)} won't count as a workout.`:`${dayName(k)}'s hang practice will come off the calendar.`}</p>
    <div class="leavebtns"><button class="btn quiet" id="rmkeep">Keep</button><button class="btn primary" data-rm="${w?'w':'g'}">Remove</button></div>`;
}
function calendarHTML(mini){
  const now=new Date(), t=today(), done=new Set(history), hung=new Set(hangs);
  const sun=weekStart(now), all=history.concat(hangs);
  const first=all.length?all.reduce((a,b)=>a<b?a:b):t, [fy,fm,fd]=first.split('-').map(Number);
  const back=Math.ceil((sun-new Date(fy,fm-1,fd))/(7*864e5));
  const weeks=mini?4:Math.max(1, back+1);
  let rows='', lastMonth=-1;
  for(let w=0; w<weeks; w++){
    const start=new Date(sun.getFullYear(),sun.getMonth(),sun.getDate()-7*w);
    // Name the month beside its newest week (the top row, then wherever the Sunday's month changes)
    const m=start.getMonth();
    if(!mini) rows += `<span class="calm" aria-hidden="true">${m!==lastMonth?start.toLocaleDateString(undefined,{month:'short'}).replace('.',''):''}</span>`;
    lastMonth=m;
    for(let d=0; d<7; d++){
      const day=new Date(start.getFullYear(),start.getMonth(),start.getDate()+d), k=ymd(day);
      // Workout days are filled; hang practice days get a dot (home calendar only)
      const cls=`cald${done.has(k)?' on':''}${!mini&&hung.has(k)?' hg':''}${k===t?' now':''}${k>t?' fut':''}`;
      // On the home calendar a logged day is a button, so a session logged by mistake can be removed
      rows += !mini && (done.has(k)||hung.has(k)) ? `<button class="${cls}" data-day="${k}" aria-label="${dayName(k)}, ${loggedWhat(k)} logged. Remove">${day.getDate()}</button>`
        : `<span class="${cls}" aria-hidden="true">${mini?'':day.getDate()}</span>`;
    }
  }
  if(mini) return `<div class="cal mini" role="img" aria-label="Sessions in the last 4 weeks: ${history.filter(x=>x<=t&&x>=ymd(new Date(sun.getFullYear(),sun.getMonth(),sun.getDate()-21))).length}">${rows}</div>`;
  const n=history.filter(x=>x<=t).length;
  const head=['S','M','T','W','T','F','S'].map(x=>`<span>${x}</span>`).join('');
  return `<div class="calwrap" role="group" aria-label="Workout calendar: ${n} session${n===1?'':'s'} logged">
    <div class="cal calhead" aria-hidden="true"><span></span>${head}</div>
    <div class="calscroll" id="cal"><div class="cal">${rows}</div></div></div>`;
}
let homeTimer = null;
function finishSession(){ S.finished=true; S.finishedAt=Date.now(); rest=null; clearInterval(tick); logSession(); save(); render(); confetti(); say('Workout complete. Great job, Sindhu!'); scheduleHome(); }
function scheduleHome(){ clearTimeout(homeTimer); if(!S.finished) return; const left = FINISH_MS - (Date.now()-(S.finishedAt||0));
  homeTimer = setTimeout(goHome, Math.max(0,left)); }
function goHome(){ clearTimeout(homeTimer); S=fresh(); save(); render(); }
function leaveWorkout(){ leaveOpen=false; rest=null; clearInterval(tick); goHome(); }
function startWorkout(){ unlockAudio(); keepAwake(); S=fresh(); S.view='workout'; save(); render(); }

let rest = null; // {end,total}
let tipsOpen = false, leaveOpen = false, removeDay = null;
let tick = null, audio = null, wake = null;

const frac = (n,of) => `<span aria-hidden="true">${n}<span class="of">/${of}</span></span><span class="sr">${n} of ${of}</span>`;
const NOFIG = '<p class="nofig">The 3D demo needs a connection to load. Check your internet and reopen the page.</p>';
const chip = t => `<div class="setchip">${t}</div>`;
const fmt = s => { s=Math.max(0,Math.ceil(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const ICON = {
  prev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  // Icons for the big action buttons, drawn at the button's text size
  play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 4.8v14.4a1 1 0 0 0 1.5.86l11.6-7.2a1 1 0 0 0 0-1.72L9.5 3.94A1 1 0 0 0 8 4.8z"/></svg>',
  stop:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5.5" y="5.5" width="13" height="13" rx="2.5"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4"/><path d="M5 4h12l-2.5 4.5L17 13H5" fill="currentColor"/></svg>',
  hang:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3.5h18"/><path d="M8 3.5l2.5 7M16 3.5l-2.5 7"/><circle cx="12" cy="7.5" r="1.7" fill="currentColor" stroke="none"/><path d="M10.5 10.5h3M12 10.5v5.5M12 16l-2 5M12 16l2 5"/></svg>'
};
// Button content: an icon then its label (a forward arrow goes after it)
const withIcon = (icon, text) => icon==='arrow' ? `<span>${text}</span>${ICON[icon]}` : `${ICON[icon]}<span>${text}</span>`;

function keepAwake(){ try{ if(!wake && navigator.wakeLock) navigator.wakeLock.request('screen').then(w=>{wake=w; w.addEventListener('release',()=>wake=null);}).catch(()=>{}); }catch(e){} }
function beep(){
  try{
    audio = audio || new (window.AudioContext||window.webkitAudioContext)();
    [0,0.25,0.5].forEach(t=>{ const o=audio.createOscillator(), g=audio.createGain(); o.frequency.value=880; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.0001,audio.currentTime+t); g.gain.exponentialRampToValueAtTime(0.3,audio.currentTime+t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,audio.currentTime+t+0.18);
      o.start(audio.currentTime+t); o.stop(audio.currentTime+t+0.2); });
  }catch(e){}
  try{ navigator.vibrate && navigator.vibrate([200,100,200]); }catch(e){}
}
function unlockAudio(){ try{ audio = audio || new (window.AudioContext||window.webkitAudioContext)(); audio.resume && audio.resume(); }catch(e){}
  // iOS only lets a page speak after it has spoken once during a tap, so prime it silently
  try{ if(!voiceReady && window.speechSynthesis){ const u=new SpeechSynthesisUtterance(' '); u.volume=0; speechSynthesis.speak(u); voiceReady=true; } }catch(e){} }

// Spoken announcements: what's next when a rest ends, and a heads-up 10 seconds before
let voiceReady = false, warned = false;
function say(text, delay){
  try{ if(!window.speechSynthesis) return;
    setTimeout(()=>{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='en-GB'; u.rate=1; speechSynthesis.speak(u); }, delay||0);
  }catch(e){}
}
const spoken = t => t.replace(/(\d)\s*s\+/g,'$1 seconds or more').replace(/\s\+\s/g,' and ').replace(/\s*·\s*/g,', ')
  .replace(/(\d)\s*–\s*(\d)/g,'$1 to $2').replace(/(\d)\s*s\b/g,'$1 seconds').replace(/\bsec\b/g,'seconds').replace(/\s+/g,' ').trim();
function nextLine(){
  const st=STEPS[S.step], done=S.done[st.id]||0;
  if(done>=st.sets) return '';
  const reps=spoken(`${st.big} ${st.unit}`);
  if(done===0) return `Next up, ${st.name}. ${st.sets>1?'Set 1, ':''}${reps}.`;
  return `Set ${done+1}, ${reps}.`;
}

function startRest(sec){
  unlockAudio(); keepAwake();
  rest = {end:Date.now()+sec*1000, total:sec}; warned = sec<=15;
  clearInterval(tick); tick = setInterval(updateRest, 250);
  render();
}
function stopRest(){ rest=null; clearInterval(tick); render(); }
function updateRest(){
  if(!rest) return;
  const left = (rest.end-Date.now())/1000;
  if(left<=0){ beep(); { const l=nextLine(); if(l) say(l, 700); } stopRest(); return; }
  if(!warned && left<=10){ warned=true; say('10 seconds'); }
  const t=document.getElementById('rt'), c=document.getElementById('rc');
  if(t) t.textContent = fmt(left);
  if(c) c.style.strokeDashoffset = String(289*(1-left/rest.total));
}

// ---------- Hang practice: rounds of easy hangs with spoken cues ----------
const HANG = {rounds:10, on:10, off:20, ready:8};
let hang = null; // {phase:'ready'|'hang'|'rest'|'done', round, doneRounds, end, total, paused, left, said}
function hangPhase(p, sec, from){ hang.phase=p; hang.total=sec; hang.end=(from||Date.now())+sec*1000; hang.said={}; }
const hangLeft = () => hang.paused ? hang.left : (hang.end-Date.now())/1000;
function startHang(){
  unlockAudio(); keepAwake();
  hang = {round:1, doneRounds:0, paused:false};
  hangPhase('ready', HANG.ready);
  say(`Hang practice, ${HANG.rounds} rounds. Feet on the chair, and keep it easy.`);
  clearInterval(tick); tick = setInterval(updateHang, 200);
  render();
}
function updateHang(){
  if(!hang || hang.paused || hang.phase==='done') return;
  const left = hangLeft();
  if(left<=0){
    // Chain from the planned end time, so the rounds stay on time after the phone sleeps
    const at = hang.end;
    if(hang.phase==='hang'){
      hang.doneRounds++;
      if(hang.doneRounds>=HANG.rounds) return finishHang();
      hang.round++; hangPhase('rest', HANG.off, at); say('And rest.');
    } else { hangPhase('hang', HANG.on, at); say('Hang.'); }
    render(); return;
  }
  // Count down into each hang, and name the round partway through the rest
  if(hang.phase!=='hang'){
    const s = Math.ceil(left);
    if(hang.phase==='rest' && s===6 && !hang.said[6]){ hang.said[6]=1; say(`Round ${hang.round}.`); }
    if(s<=3 && !hang.said[s]){ hang.said[s]=1; say(String(s)); }
  }
  const t=document.getElementById('ht'), c=document.getElementById('hc');
  if(t) t.textContent = Math.ceil(left);
  if(c) c.style.strokeDashoffset = String(289*(1-left/hang.total));
}
const HANG_MIN = 3; // ending early still logs the day after this many rounds
const roundsText = n => `${n} round${n===1?'':'s'}`;
// Done: the full set gets confetti; ending early after HANG_MIN rounds shows what was done
function finishHang(){
  const full = hang.doneRounds>=HANG.rounds;
  hang.phase='done'; hang.paused=false; hang.round=hang.doneRounds; clearInterval(tick); logHang(); render();
  if(full) confetti();
  say(`${full?"That's ":''}${roundsText(hang.doneRounds)}. Nice work, Sindhu!`);
}
function pauseHang(){ hang.left=hangLeft(); hang.paused=true; try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){} render(); }
// Resuming mid-hang restarts that hang after a short count, since you've likely let go of the bar
function resumeHang(){
  hang.paused=false; keepAwake();
  if(hang.phase==='hang') hangPhase('ready', 4); else hang.end=Date.now()+hang.left*1000;
  render();
}
function endHang(){ if(hang.phase!=='done' && hang.doneRounds>=HANG_MIN) return finishHang(); leaveHang(); }
function leaveHang(){ hang=null; clearInterval(tick); try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){} render(); }
const PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="3.6" height="14" rx="1.2"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2"/></svg>';
function renderHang(app){
  app.classList.add('focus');
  const h=hang, done=h.phase==='done', left=done?0:hangLeft();
  const segs=Array.from({length:HANG.rounds},(_,i)=>`<div class="seg ${i<h.doneRounds?'done':''} ${!done&&i===h.round-1?'now':''}"></div>`).join('');
  const word=h.paused?'Paused':{ready:'Get ready', hang:'Hang', rest:'Rest'}[h.phase];
  app.innerHTML = `
    <div class="top">
      <button class="iconbtn" id="hback" aria-label="${done?'Home':'End hang practice'}">${ICON.prev}</button>
      <div class="progress"><div class="plabel count"><span class="sr">Round </span>${frac(h.round,HANG.rounds)}</div><div class="segs" style="grid-template-columns:repeat(${HANG.rounds},minmax(0,1fr))">${segs}</div></div>
      ${done||h.paused?'<span class="iconspace" aria-hidden="true"></span>':`<button class="iconbtn" id="hpause" aria-label="Pause">${PAUSE_ICON}</button>`}
    </div>
    <div class="stage"><div class="figwrap" id="figwrap">${View3D?'':NOFIG}</div></div>
    <div class="zone">
      <div class="card fcard hcard${h.phase==='hang'&&!h.paused?' on':''}">
        ${done ? `<h1 class="name hword">Done!</h1><p class="hnote">${roundsText(h.doneRounds)} of easy hangs</p>` :
        `<h1 class="name hword" aria-live="polite">${word}</h1>
        <div class="ring" role="timer" aria-live="off"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" class="track" stroke-width="7"/>
          <circle id="hc" cx="50" cy="50" r="46" fill="none" class="arc" stroke-width="7" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="${289*(1-left/h.total)}"/></svg>
          <div class="t" id="ht">${Math.ceil(left)}</div></div>`}
      </div>
      ${done ? `<div class="actions one"><button class="btn primary" id="hhome">${withIcon('home','Home')}</button></div>` :
        h.paused ? `<div class="actions two"><button class="btn primary" id="hresume">${withIcon('play','Resume')}</button><button class="btn soft" id="hend">${withIcon('stop','End')}</button></div>` : ''}
    </div>`;
  if(View3D) View3D.mount(document.getElementById('figwrap'), 'easyhang');
  const on=(id,f)=>{ const el=document.getElementById(id); if(el) el.onclick=()=>{ unlockAudio(); f(); }; };
  on('hback', endHang); on('hpause', pauseHang); on('hresume', resumeHang); on('hend', endHang); on('hhome', leaveHang);
  const first=document.getElementById('hresume'); if(first) first.focus();
}

function go(i){ tipsOpen=false; S.step=Math.max(0,Math.min(STEPS.length-1,i)); S.finished=false; rest=null; clearInterval(tick); save(); render(); }

function render(){
  const app=document.getElementById('app');
  app.classList.remove('focus');
  if(hang) return renderHang(app);
  if(S.finished){
    const n = history.length, wk = weekCount();
    app.innerHTML = `<div class="screen finish">
      <div class="finhead"><div class="plabel left">${new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'short'})}</div>
        <button class="iconbtn" id="home" aria-label="Home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg></button></div>
      <div class="finbody">
      <div class="champ">${avatarHTML('avatar big')}<span class="champtick" aria-hidden="true"><svg viewBox="0 0 120 120"><path d="M34 62l17 17 36-40" class="badge-tick"/></svg></span></div>
      <h1 class="hero">Session<br>done!</h1>
      <p class="lede">One step closer to your first pull-up.</p>
      <div class="weekcard">${calendarHTML(true)}
        <div class="wklab"><span class="wkrow"><span class="wknum">${wk}</span>${weekIcon(wk)}</span>${timesWeek(wk)}</div></div>
      </div>
</div>`;
    document.getElementById('home').onclick=goHome; bindAvatar();
    return;
  }
  if(S.view!=='workout'){
    const n = history.length, wk = weekCount(), h = new Date().getHours();
    const hello = h<12?'Good morning':h<18?'Good afternoon':'Good evening';
    app.innerHTML = `<div class="screen welcome">
      <div class="finhead"><div class="plabel left">${new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'short'})}</div>${n?`<span class="totpill">${n} session${n>1?'s':''} total</span>`:''}</div>
      <div class="hellorow">${avatarHTML('avatar')}<h1 class="hello">${hello},<br><span class="hl">Sindhu</span></h1></div>
      <section class="bigweek" aria-label="Your sessions">
        <div class="bwhead"><span class="bwnum">${wk}</span>${weekIcon(wk)}<span class="bwlab">${timesWeek(wk)}</span></div>
        ${calendarHTML()}
      </section>
      <div class="decor" aria-hidden="true"><div class="figwrap" id="figwrap"></div></div>
      <div class="homebtns"><button class="btn primary big" id="start">${withIcon('play','Start workout')}</button><button class="btn soft" id="hangbtn">${withIcon('hang','Hang practice')}</button></div></div>
    <div class="scrim" id="rmscrim" ${removeDay?'':'hidden'}>
      <div class="sheet" id="rmsheet" role="alertdialog" aria-modal="true" aria-labelledby="rmtitle" aria-describedby="rmtext">${removeDay?rmSheet(removeDay):''}</div>
    </div>`;
    if(View3D) View3D.mount(document.getElementById('figwrap'), 'pullup');
    document.getElementById('start').onclick=startWorkout; document.getElementById('hangbtn').onclick=startHang; bindAvatar();
    // Tapping a logged day asks before removing it; the sheet opens without a re-render so the calendar keeps its scroll
    const rm=document.getElementById('rmscrim'), sheet=document.getElementById('rmsheet');
    const closeRemove=()=>{ const b=document.querySelector(`.cald[data-day="${removeDay}"]`); removeDay=null; rm.hidden=true; if(b) b.focus(); };
    const bindRemove=()=>{
      document.getElementById('rmkeep').onclick=closeRemove;
      sheet.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ const top=document.getElementById('cal').scrollTop;
        (b.dataset.rm==='w'?unlogSession:unlogHang)(removeDay); removeDay=null; render(); document.getElementById('cal').scrollTop=top; });
    };
    document.querySelectorAll('.cald[data-day]').forEach(b=>b.onclick=()=>{ removeDay=b.dataset.day;
      sheet.innerHTML=rmSheet(removeDay); bindRemove(); rm.hidden=false; document.getElementById('rmkeep').focus(); });
    if(removeDay) bindRemove();
    rm.onclick=e=>{ if(e.target===rm) closeRemove(); };
    return;
  }
  const st=STEPS[S.step], done=S.done[st.id]||0, complete=done>=st.sets, last=S.step===STEPS.length-1;
  const segs=STEPS.map((x,i)=>`<div class="seg ${i<S.step?'done':''} ${i===S.step?'now':''}"></div>`).join('');
  const focus = done>0;
  app.classList.toggle('focus', focus);
  const primaryLabel = complete ? (last?'Finish session':'Next exercise') : 'Done';
  // Set 1 shows a compact exercise card; from set 2 the full card takes over: name, set chip and reps, or the rest timer
  const setChip = !rest && (focus || st.sets>1) ? chip(complete?(st.sets===1?'Done':'All sets done'):`Set ${frac(done+1,st.sets)}`) : '';
  const restTimer = rest ? `<div class="rest" role="timer" aria-live="off">
      <div class="ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="var(--line)" stroke-width="7"/>
      <circle id="rc" cx="50" cy="50" r="46" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="0"/></svg>
      <div class="t" id="rt">${fmt((rest.end-Date.now())/1000)}</div></div>
      <div class="restinfo">${focus&&!complete?chip(`Set ${frac(done+1,st.sets)} next`):'<div class="restlabel">Resting</div>'}
      <div class="restbtns"><button class="small" id="plus">+15 s</button><button class="small fill" id="skip">Skip</button></div></div></div>` : '';
  const restBlock = rest ? (focus ? '' : restTimer) :
    `<div class="actions"><button class="btn primary" id="primary"${!complete&&st.sets>1?` aria-label="Done, set ${done+1} of ${st.sets}"`:''}>${withIcon(complete?(last?'flag':'arrow'):'check', primaryLabel)}</button>${st.noTimer?'':`<button class="timerbtn" id="timer" aria-label="Start rest timer, ${fmt(st.rest)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.5 1.5M10 2.5h4M12 2.5V6"/></svg></button>`}</div>`;

  app.innerHTML = `
    <div class="top">
      <button class="iconbtn" id="prev" aria-label="${S.step===0?'Leave workout':'Previous exercise'}">${ICON.prev}</button>
      <div class="progress"><div class="plabel count"><span class="sr">Exercise </span>${frac(S.step+1,STEPS.length)}</div><div class="segs">${segs}</div></div>
      <button class="iconbtn" id="next" aria-label="Next exercise" ${last?'disabled':''}>${ICON.next}</button>
    </div>
    <div class="stage">
      <div class="figwrap" id="figwrap">${View3D?'':NOFIG}</div>
      <div class="stagefoot"><div class="legend"><span><i class="k1"></i>${st.mpl}</span>${st.msl?`<span><i class="k2"></i>${st.msl}</span>`:''}</div></div></div>
    <div class="zone">
    <div class="card${focus?' fcard':' ccard'}${focus&&rest?' resting':''}">
      <div class="namerow"><h1 class="name">${st.name}</h1><button class="tipsbtn" id="tipsbtn" aria-label="Form tips" aria-haspopup="dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg></button></div>
      ${focus?'':setChip}<div class="rx">${focus?setChip:''}<span class="big">${st.big}</span><span class="unit">${st.unit}</span></div>
      ${focus?restTimer:''}
    </div>
    ${restBlock}</div>
    <div class="scrim" id="scrim" ${tipsOpen?'':'hidden'}>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheettitle">
        <div class="sheethead"><h2 id="sheettitle">${st.name}</h2><button class="iconbtn" id="closetips" aria-label="Close tips"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
        <h3 class="sheetsec">How to do it</h3>
        <ul class="tips">${st.tips.map(t=>`<li>${t}</li>`).join('')}</ul>
        <h3 class="sheetsec">Common mistakes</h3>
        <ul class="mistakes">${st.mistakes.map(([m,f])=>`<li><b>${m}<span class="sr">.</span></b> ${f}</li>`).join('')}</ul>
      </div>
    </div>
    <div class="scrim" id="leavescrim" ${leaveOpen?'':'hidden'}>
      <div class="sheet" role="alertdialog" aria-modal="true" aria-labelledby="leavetitle" aria-describedby="leavetext">
        <h2 class="leavetitle" id="leavetitle">Leave workout?</h2>
        <p class="leavetext" id="leavetext">Today's sets won't be saved.</p>
        <div class="leavebtns"><button class="btn quiet" id="stay">Keep going</button><button class="btn primary" id="leave">Leave</button></div>
      </div>
    </div>`;
  if(View3D){ View3D.mount(document.getElementById('figwrap'), st.anim); }
  document.getElementById('tipsbtn').onclick=()=>{ tipsOpen=true; document.getElementById('scrim').hidden=false; document.getElementById('closetips').focus(); };
  const closeTips=()=>{ tipsOpen=false; document.getElementById('scrim').hidden=true; document.getElementById('tipsbtn').focus(); };
  document.getElementById('closetips').onclick=closeTips;
  document.getElementById('scrim').onclick=e=>{ if(e.target.id==='scrim') closeTips(); };

  // On the first exercise the back arrow leaves the workout; ask first once a set is logged
  const closeLeave=()=>{ leaveOpen=false; document.getElementById('leavescrim').hidden=true; document.getElementById('prev').focus(); };
  document.getElementById('prev').onclick=()=>{
    if(S.step>0) return go(S.step-1);
    if(!Object.keys(S.done).length && !rest) return leaveWorkout();
    leaveOpen=true; document.getElementById('leavescrim').hidden=false; document.getElementById('stay').focus();
  };
  document.getElementById('stay').onclick=closeLeave;
  document.getElementById('leave').onclick=leaveWorkout;
  document.getElementById('leavescrim').onclick=e=>{ if(e.target.id==='leavescrim') closeLeave(); };
  document.getElementById('next').onclick=()=>go(S.step+1);
  if(rest){
    document.getElementById('plus').onclick=()=>{ rest.end+=15000; rest.total+=15; if((rest.end-Date.now())/1000>10) warned=false; updateRest(); };
    document.getElementById('skip').onclick=stopRest;
    updateRest();
  } else {
    if(!st.noTimer) document.getElementById('timer').onclick=()=>startRest(st.rest);
    document.getElementById('primary').onclick=()=>{
      keepAwake();
      if(complete){ if(last) finishSession(); else go(S.step+1); return; }
      S.done[st.id]=done+1; save();
      if(done+1<st.sets){ startRest(st.rest); return; }
      if(last){ finishSession(); return; }
      go(S.step+1); if(!st.noTimer) startRest(st.rest);
    };
  }
}
document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return;
  if(tipsOpen){ tipsOpen=false; const sc=document.getElementById('scrim'); if(sc) sc.hidden=true; }
  if(leaveOpen){ leaveOpen=false; const sc=document.getElementById('leavescrim'); if(sc) sc.hidden=true; }
  if(removeDay){ removeDay=null; const sc=document.getElementById('rmscrim'); if(sc) sc.hidden=true; } });
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible'){ if(rest) updateRest(); if(hang) updateHang(); if(wake===null && (rest||hang)) keepAwake(); }});
try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>View3D&&View3D.rebuild()); new MutationObserver(()=>View3D&&View3D.rebuild()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); }catch(e){}
function confetti(){
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c=document.createElement('canvas'); c.className='confetti'; document.body.appendChild(c);
  const dpr=Math.min(window.devicePixelRatio||1,2), W=innerWidth, H=innerHeight; c.width=W*dpr; c.height=H*dpr; const x=c.getContext('2d'); x.scale(dpr,dpr);
  const cs=getComputedStyle(document.documentElement), cols=['--accent','--m1','--m2'].map(v=>cs.getPropertyValue(v).trim());
  const P=Array.from({length:140},()=>({x:W/2+(Math.random()-0.5)*60,y:H*0.35,vx:(Math.random()-0.5)*9,vy:-Math.random()*11-4,r:Math.random()*Math.PI,vr:(Math.random()-0.5)*0.3,w:6+Math.random()*6,h:3+Math.random()*4,c:cols[Math.floor(Math.random()*cols.length)]}));
  const t0=performance.now();
  (function f(now){ const e=(now-t0)/1000; x.clearRect(0,0,W,H);
    P.forEach(p=>{ p.vy+=0.28; p.vx*=0.99; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; x.save(); x.translate(p.x,p.y); x.rotate(p.r); x.globalAlpha=Math.max(0,1-e/3.2); x.fillStyle=p.c; x.fillRect(-p.w/2,-p.h/2,p.w,p.h); x.restore(); });
    if(e<3.3) requestAnimationFrame(f); else c.remove(); })(t0);
}
render(); scheduleHome();
