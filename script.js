/*
  ISAI Tamil Music Player - script.js
  Bugs fixed:
  - Removed curly/smart quotes that caused SyntaxError in strict mode
  - Removed duplicate const (elAutoplayBt2)
  - Waveform canvas init deferred to after first paint (requestAnimationFrame)
  - prog-knob now inside prog-fill so it moves correctly with width
  - vol-fill synced via JS on input
  - All DOM refs inside init() so they are guaranteed to exist
*/

'use strict';

/* ─────────────────────────────────
   TRACK DATA  (straight ASCII quotes only)
───────────────────────────────── */
var tracks = [
  {
    title:      'Naan Varaindhu Vaitha',
    short:      'Naan V.',
    artists:    'Madhushree, Yuga Bharathi, Vidyasagar, Hariharan',
    display:    'Madhushree \u00b7 Hariharan \u00b7 Vidyasagar',
    album:      'Jeyam Kondan (Original Motion Picture Soundtrack)',
    movie:      'Jeyam Kondan',
    year:       '2008',
    duration:   256,
    labelColor: '#7a3e12',
    accent:     { r: 200, g: 120, b: 50 },
    story:      'A tender melody from the 2008 Tamil blockbuster, weaving together the voices of Madhushree and Hariharan into a timeless declaration of longing -- written before meeting, lived after finding.'
  },
  {
    title:      'Sirikkadhey',
    short:      'Sirik.',
    artists:    'Srinidhi Venkatesh, Arjun Kanungo, Anirudh Ravichander, Vignesh Shivan',
    display:    'Srinidhi Venkatesh \u00b7 Arjun Kanungo',
    album:      'Remo (Original Motion Picture Soundtrack)',
    movie:      'Remo',
    year:       '2016',
    duration:   218,
    labelColor: '#1a5e7a',
    accent:     { r: 60, g: 160, b: 210 },
    story:      'Anirudh\'s infectious 2016 hit -- playful, rhythmic, impossible to sit still to. A song that dares you not to smile. Its irresistible beat became the anthem of an entire generation.'
  },
  {
    title:      'Kaarkuzhal Kadavaiye',
    short:      'Kaar K.',
    artists:    'Sriram Parthasarathy, Vijaynarain, Vivek, Santhosh Narayanan, Pradeep Kumar, Ananthu',
    display:    'Sriram Parthasarathy \u00b7 Vijaynarain',
    album:      'Vada Chennai (Original Motion Picture Soundtrack)',
    movie:      'Vada Chennai',
    year:       '2018',
    duration:   274,
    labelColor: '#2e6040',
    accent:     { r: 80, g: 180, b: 100 },
    story:      'Santhosh Narayanan\'s raw, earth-drenched composition for the 2018 epic Vada Chennai. A voice that rises like smoke from the streets -- gritty, spiritual, and deeply human.'
  },
  {
    title:      'Kaattrae En Vaasal: Wind',
    short:      'Kaattrae',
    artists:    'P. Unnikrishnan, Kavita Krishnamurthy, A.R. Rahman',
    display:    'P. Unnikrishnan \u00b7 Kavita Krishnamurthy',
    album:      'Rhythm (Original Motion Picture Soundtrack)',
    movie:      'Rhythm',
    year:       '2000',
    duration:   312,
    labelColor: '#5a3a7a',
    accent:     { r: 160, g: 90, b: 210 },
    story:      'A.R. Rahman crafted this breeze of a song in 2000 -- two voices, a gentle wind, and the eternal question of what we search for in the faces of strangers. Ethereal and quietly devastating.'
  },
  {
    title:      'Ennul Maelae',
    short:      'Ennul',
    artists:    'Harris Jayaraj, Sudha Ragunathan',
    display:    'Harris Jayaraj \u00b7 Sudha Ragunathan',
    album:      'Vaaranam Aayiram (Original Motion Picture Soundtrack)',
    movie:      'Vaaranam Aayiram',
    year:       '2008',
    duration:   264,
    labelColor: '#7a5520',
    accent:     { r: 210, g: 150, b: 60 },
    story:      'Harris Jayaraj and the legendary Sudha Ragunathan merged classical grace with cinematic emotion in this 2008 gem. A song that dissolves time -- ancient ragas meeting modern longing.'
  }
];

/* ─────────────────────────────────
   STATE
───────────────────────────────── */
var currentIdx  = 0;
var isPlaying   = false;
var autoplay    = true;
var shuffle     = false;
var repeat      = false;
var currentSec  = 0;
var isMuted     = false;
var lastVol     = 80;
var tickTimer   = null;
var wvCtx       = null;
var wvW         = 0;
var wvH         = 44;
var wvAnimId    = null;
var particleArr = [];
var pCtx        = null;
var pAnimId     = null;
var specBars    = [];
var msAnimId    = null;

/* ─────────────────────────────────
   DOM REFS  (grabbed inside init after DOM parsed)
───────────────────────────────── */
var elApp, elPlaylist, elSongNumber, elSongTitle, elSongArtists,
    elSongMovie, elSongYear, elTimeCur, elTimeTotal,
    elProgFill, elPlayIcon, elArtDisc, elArtContainer,
    elDiscLabel, elLabelNum, elLabelTitle, elTonearm,
    elDetailAlbum, elDetailYear, elDetailDur, elDetailArtists,
    elStoryText, elMiniSpec, elBlob1, elBlob3,
    elAutoplayBtn, elShuffleBtn, elRepeatBtn,
    elVolSlider, elVolFill, elVolNum, elVolSvg,
    wvCanvas, pCanvas,
    elPanelInfo, elPanelStory;

function grab(id) { return document.getElementById(id); }

/* ─────────────────────────────────
   INIT
───────────────────────────────── */
function init() {
  /* Assign DOM refs */
  elApp           = grab('app');
  elPlaylist      = grab('playlist');
  elSongNumber    = grab('songNumber');
  elSongTitle     = grab('songTitle');
  elSongArtists   = grab('songArtists');
  elSongMovie     = grab('songMovie');
  elSongYear      = grab('songYear');
  elTimeCur       = grab('timeCurrent');
  elTimeTotal     = grab('timeTotal');
  elProgFill      = grab('progFill');
  elPlayIcon      = grab('playIcon');
  elArtDisc       = grab('artDisc');
  elArtContainer  = grab('artContainer');
  elDiscLabel     = grab('discLabel');
  elLabelNum      = grab('labelNum');
  elLabelTitle    = grab('labelTitle');
  elTonearm       = grab('tonearm');
  elDetailAlbum   = grab('detailAlbum');
  elDetailYear    = grab('detailYear');
  elDetailDur     = grab('detailDur');
  elDetailArtists = grab('detailArtists');
  elStoryText     = grab('storyText');
  elMiniSpec      = grab('miniSpectrum');
  elBlob1         = grab('blob1');
  elBlob3         = grab('blob3');
  elAutoplayBtn   = grab('autoplayToggle');
  elShuffleBtn    = grab('shuffleToggle');
  elRepeatBtn     = grab('repeatToggle');
  elVolSlider     = grab('volSlider');
  elVolFill       = grab('volFill');
  elVolNum        = grab('volNum');
  elVolSvg        = grab('volSvg');
  wvCanvas        = grab('waveCanvas');
  pCanvas         = grab('particleCanvas');
  elPanelInfo     = grab('panelInfo');
  elPanelStory    = grab('panelStory');

  /* Click seek on progress bar */
  grab('progressHit').addEventListener('click', seek);

  buildPlaylist();
  loadTrack(0, false);
  buildMiniSpectrum();
  initParticles();

  /* Defer waveform init until after first layout paint */
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      initWaveform();
    });
  });
}

/* ─────────────────────────────────
   PLAYLIST
───────────────────────────────── */
function buildPlaylist() {
  elPlaylist.innerHTML = '';
  tracks.forEach(function(t, i) {
    var li = document.createElement('li');
    li.className = 'playlist-item';
    li.id = 'pi-' + i;
    li.addEventListener('click', function() { selectTrack(i); });
    li.innerHTML =
      '<span class="pi-num">' + pad(i + 1) + '</span>' +
      '<div class="pi-eq">' +
        '<div class="pi-eq-bar stopped" id="eqb-a-' + i + '"></div>' +
        '<div class="pi-eq-bar stopped" id="eqb-b-' + i + '"></div>' +
        '<div class="pi-eq-bar stopped" id="eqb-c-' + i + '"></div>' +
      '</div>' +
      '<div class="pi-info">' +
        '<div class="pi-title">' + esc(t.title) + '</div>' +
        '<div class="pi-artist">' + esc(t.artists.split(',').slice(0, 2).join(', ')) + '</div>' +
      '</div>' +
      '<span class="pi-dur">' + fmt(t.duration) + '</span>';
    elPlaylist.appendChild(li);
  });
}

function refreshPlaylist() {
  document.querySelectorAll('.playlist-item').forEach(function(el, i) {
    el.classList.toggle('active', i === currentIdx);
  });
  var active = grab('pi-' + currentIdx);
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ─────────────────────────────────
   LOAD TRACK
───────────────────────────────── */
function loadTrack(idx, andPlay) {
  if (andPlay === undefined) andPlay = true;
  currentIdx = idx;
  currentSec = 0;
  var t = tracks[idx];

  /* Text content */
  elSongNumber.textContent    = pad(idx + 1) + ' / ' + pad(tracks.length);
  elSongTitle.textContent     = t.title;
  elSongArtists.textContent   = t.display;
  elSongMovie.textContent     = t.movie;
  elSongYear.textContent      = t.year;
  elTimeTotal.textContent     = fmt(t.duration);
  elTimeCur.textContent       = '0:00';
  elDetailAlbum.textContent   = t.album;
  elDetailYear.textContent    = t.year;
  elDetailDur.textContent     = fmt(t.duration);
  elDetailArtists.innerHTML   = t.artists.split(',').map(function(a) { return esc(a.trim()); }).join('<br>');
  elStoryText.textContent     = t.story;

  /* Disc */
  elDiscLabel.style.background = t.labelColor;
  elLabelNum.textContent       = pad(idx + 1);
  elLabelTitle.textContent     = t.short;

  /* Progress reset */
  setProgWidth(0);

  /* Theme */
  applyAccent(t.accent);

  /* Playlist */
  refreshPlaylist();
  syncEqBars(false);

  /* Waveform */
  if (wvCtx) drawWaveform();

  if (andPlay) play();
}

/* ─────────────────────────────────
   ACCENT THEMING
───────────────────────────────── */
function applyAccent(a) {
  var r = a.r, g = a.g, b = a.b;
  var gold     = 'rgb(' + r + ',' + g + ',' + b + ')';
  var goldMid  = 'rgb(' + Math.min(r+40,255) + ',' + Math.min(g+30,255) + ',' + Math.min(b+20,255) + ')';
  var goldBri  = 'rgb(' + Math.min(r+80,255) + ',' + Math.min(g+70,255) + ',' + Math.min(b+40,255) + ')';
  var goldGlow = 'rgba(' + r + ',' + g + ',' + b + ',0.35)';
  var goldDim  = 'rgba(' + r + ',' + g + ',' + b + ',0.14)';

  var root = document.documentElement;
  root.style.setProperty('--gold',        gold);
  root.style.setProperty('--gold-mid',    goldMid);
  root.style.setProperty('--gold-bright', goldBri);
  root.style.setProperty('--gold-glow',   goldGlow);
  root.style.setProperty('--accent-dim',  goldDim);

  elBlob1.style.background = 'radial-gradient(circle, rgba(' + r + ',' + g + ',' + b + ',0.17) 0%, transparent 70%)';
  elBlob3.style.background = 'radial-gradient(circle, rgba(' + r + ',' + g + ',' + b + ',0.09) 0%, transparent 70%)';
}

/* ─────────────────────────────────
   PLAY / PAUSE
───────────────────────────────── */
function play() {
  isPlaying = true;
  elApp.classList.add('playing');
  elPlayIcon.innerHTML = '<rect x="5" y="3" width="5" height="18" rx="2"/><rect x="14" y="3" width="5" height="18" rx="2"/>';
  syncEqBars(true);
  startTick();
  animateWaveform();
  animateMiniSpectrum();
}

function pause() {
  isPlaying = false;
  elApp.classList.remove('playing');
  elPlayIcon.innerHTML = '<polygon points="6 3 20 12 6 21 6 3"/>';
  syncEqBars(false);
  clearInterval(tickTimer);
  cancelAnimationFrame(wvAnimId);
  cancelAnimationFrame(msAnimId);
  if (wvCtx) drawWaveform();
}

function togglePlay() {
  if (isPlaying) { pause(); } else { play(); }
}

/* ─────────────────────────────────
   NAVIGATION
───────────────────────────────── */
function nextTrack() {
  var next;
  if (shuffle) {
    do { next = Math.floor(Math.random() * tracks.length); }
    while (next === currentIdx && tracks.length > 1);
  } else {
    next = (currentIdx + 1) % tracks.length;
  }
  loadTrack(next, isPlaying || autoplay);
}

function prevTrack() {
  if (currentSec > 3) {
    currentSec = 0;
    setProgWidth(0);
    elTimeCur.textContent = '0:00';
    if (isPlaying) { clearInterval(tickTimer); startTick(); }
    return;
  }
  loadTrack((currentIdx - 1 + tracks.length) % tracks.length, isPlaying);
}

function selectTrack(idx) {
  loadTrack(idx, true);
}

/* ─────────────────────────────────
   TICK / PROGRESS
───────────────────────────────── */
function startTick() {
  clearInterval(tickTimer);
  tickTimer = setInterval(function() {
    var dur = tracks[currentIdx].duration;
    currentSec = Math.min(currentSec + 1, dur);
    elTimeCur.textContent = fmt(currentSec);
    setProgWidth(currentSec / dur);
    if (currentSec >= dur) {
      clearInterval(tickTimer);
      onEnd();
    }
  }, 1000);
}

function onEnd() {
  if (repeat) {
    currentSec = 0; play();
  } else if (autoplay) {
    nextTrack();
  } else {
    pause();
  }
}

function setProgWidth(ratio) {
  elProgFill.style.width = (ratio * 100).toFixed(2) + '%';
}

function seek(e) {
  var bar  = grab('progressHit');
  var rect = bar.getBoundingClientRect();
  var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  currentSec = Math.floor(ratio * tracks[currentIdx].duration);
  setProgWidth(ratio);
  elTimeCur.textContent = fmt(currentSec);
  if (isPlaying) { clearInterval(tickTimer); startTick(); }
}

/* ─────────────────────────────────
   VOLUME
───────────────────────────────── */
function setVolume(val) {
  var v = parseInt(val, 10);
  lastVol = v;
  isMuted = false;
  elVolNum.textContent    = v;
  elVolFill.style.width   = v + '%';
  updateVolIcon(v);
}

function toggleMute() {
  if (isMuted) {
    isMuted = false;
    elVolSlider.value = lastVol;
    elVolNum.textContent  = lastVol;
    elVolFill.style.width = lastVol + '%';
    updateVolIcon(lastVol);
  } else {
    lastVol = parseInt(elVolSlider.value, 10);
    isMuted = true;
    elVolSlider.value = 0;
    elVolNum.textContent  = '0';
    elVolFill.style.width = '0%';
    updateVolIcon(0);
  }
}

function updateVolIcon(v) {
  if (v === 0) {
    elVolSvg.innerHTML =
      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' +
      '<line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      '<line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
  } else if (v < 50) {
    elVolSvg.innerHTML =
      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' +
      '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
  } else {
    elVolSvg.innerHTML =
      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' +
      '<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>' +
      '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
  }
}

/* ─────────────────────────────────
   TOGGLES
───────────────────────────────── */
function toggleAutoplay() {
  autoplay = !autoplay;
  elAutoplayBtn.classList.toggle('active', autoplay);
}

function toggleShuffle() {
  shuffle = !shuffle;
  elShuffleBtn.classList.toggle('active', shuffle);
}

function toggleRepeat() {
  repeat = !repeat;
  elRepeatBtn.classList.toggle('active', repeat);
}

/* ─────────────────────────────────
   EQ BAR SYNC
───────────────────────────────── */
function syncEqBars(playing) {
  tracks.forEach(function(_, i) {
    ['a', 'b', 'c'].forEach(function(l) {
      var el = grab('eqb-' + l + '-' + i);
      if (!el) return;
      el.classList.toggle('stopped', !(playing && i === currentIdx));
    });
  });
  document.querySelectorAll('.eq-bar').forEach(function(b) {
    b.classList.toggle('stopped', !playing);
  });
}

/* ─────────────────────────────────
   WAVEFORM CANVAS
───────────────────────────────── */
function initWaveform() {
  if (!wvCanvas) return;
  var dpr  = window.devicePixelRatio || 1;
  var rect = wvCanvas.parentElement.getBoundingClientRect();
  wvW = rect.width > 0 ? rect.width : (wvCanvas.offsetWidth || 400);
  wvH = 44;
  wvCanvas.width  = Math.round(wvW * dpr);
  wvCanvas.height = Math.round(wvH * dpr);
  wvCanvas.style.width  = wvW + 'px';
  wvCanvas.style.height = wvH + 'px';
  wvCtx = wvCanvas.getContext('2d');
  wvCtx.scale(dpr, dpr);
  drawWaveform();
}

function getWaveData(tIdx, count) {
  var seed = tIdx * 7 + 3;
  var data = [];
  for (var i = 0; i < count; i++) {
    var x = i / count;
    var v = 0.3
      + 0.35 * Math.sin(x * Math.PI * (4 + seed % 3))
      + 0.20 * Math.sin(x * Math.PI * (9 + seed % 5) + seed)
      + 0.15 * Math.cos(x * Math.PI * (13 + seed % 7) + seed * 2);
    data.push(Math.max(0.06, Math.min(1, v)));
  }
  return data;
}

function drawWaveform() {
  if (!wvCtx || wvW === 0) return;
  var W = wvW, H = wvH;
  var N = 80;
  var BW = 2;
  var gap = (W - N * BW) / (N - 1);
  var t = tracks[currentIdx];
  var progress = (t.duration > 0) ? currentSec / t.duration : 0;
  var litN = Math.floor(progress * N);
  var wave = getWaveData(currentIdx, N);
  var ar = t.accent.r, ag = t.accent.g, ab = t.accent.b;

  wvCtx.clearRect(0, 0, W, H);

  for (var i = 0; i < N; i++) {
    var x    = i * (BW + gap);
    var base = wave[i];
    var jitter = (isPlaying && Math.abs(i - litN) < 5) ? Math.random() * 0.28 : 0;
    var h = (base + jitter) * (H - 6);
    if (h < 2) h = 2;
    var y = (H - h) / 2;

    if (i < litN) {
      var grad = wvCtx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, 'rgba(' + ar + ',' + ag + ',' + ab + ',0.9)');
      grad.addColorStop(1, 'rgba(' + ar + ',' + ag + ',' + ab + ',0.4)');
      wvCtx.fillStyle = grad;
    } else {
      wvCtx.fillStyle = 'rgba(255,255,255,0.07)';
    }

    /* Rounded rect without relying on roundRect() method */
    var rr = 1;
    wvCtx.beginPath();
    wvCtx.moveTo(x + rr, y);
    wvCtx.lineTo(x + BW - rr, y);
    wvCtx.quadraticCurveTo(x + BW, y, x + BW, y + rr);
    wvCtx.lineTo(x + BW, y + h - rr);
    wvCtx.quadraticCurveTo(x + BW, y + h, x + BW - rr, y + h);
    wvCtx.lineTo(x + rr, y + h);
    wvCtx.quadraticCurveTo(x, y + h, x, y + h - rr);
    wvCtx.lineTo(x, y + rr);
    wvCtx.quadraticCurveTo(x, y, x + rr, y);
    wvCtx.closePath();
    wvCtx.fill();
  }
}

function animateWaveform() {
  cancelAnimationFrame(wvAnimId);
  function loop() {
    if (!isPlaying) return;
    drawWaveform();
    wvAnimId = requestAnimationFrame(loop);
  }
  loop();
}

/* ─────────────────────────────────
   MINI SPECTRUM
───────────────────────────────── */
function buildMiniSpectrum() {
  elMiniSpec.innerHTML = '';
  specBars = [];
  for (var i = 0; i < 28; i++) {
    var b = document.createElement('div');
    b.className = 'ms-bar';
    var h = 4 + Math.abs(Math.sin(i * 0.5)) * 20;
    b.style.height = h + 'px';
    elMiniSpec.appendChild(b);
    specBars.push(b);
  }
}

function animateMiniSpectrum() {
  cancelAnimationFrame(msAnimId);
  function loop() {
    if (!isPlaying) return;
    var now = Date.now();
    specBars.forEach(function(b, i) {
      var h = 4 + Math.abs(Math.sin(i * 0.5 + now * 0.002 * (i % 3 + 1))) * 20;
      b.style.height = h + 'px';
      b.style.opacity = (0.3 + (h / 24) * 0.5).toString();
    });
    msAnimId = requestAnimationFrame(loop);
  }
  loop();
}

/* ─────────────────────────────────
   PARTICLES
───────────────────────────────── */
function initParticles() {
  if (!pCanvas) return;
  var dpr = window.devicePixelRatio || 1;
  var W = window.innerWidth, H = window.innerHeight;
  pCanvas.width  = Math.round(W * dpr);
  pCanvas.height = Math.round(H * dpr);
  pCanvas.style.width  = W + 'px';
  pCanvas.style.height = H + 'px';
  pCtx = pCanvas.getContext('2d');
  pCtx.scale(dpr, dpr);

  particleArr = [];
  for (var i = 0; i < 55; i++) {
    particleArr.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.5 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.28,
      life: Math.random()
    });
  }
  if (pAnimId) cancelAnimationFrame(pAnimId);
  animateParticles();
}

function animateParticles() {
  var W = window.innerWidth, H = window.innerHeight;
  var t = tracks[currentIdx];
  var r = t.accent.r, g = t.accent.g, b = t.accent.b;

  pCtx.clearRect(0, 0, W, H);

  particleArr.forEach(function(p) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.002;
    if (p.life <= 0 || p.y < -10) {
      p.x    = Math.random() * W;
      p.y    = H + 10;
      p.life = 0.4 + Math.random() * 0.6;
      p.vx   = (Math.random() - 0.5) * 0.3;
      p.vy   = -0.1 - Math.random() * 0.28;
    }
    var alpha = isPlaying ? p.life * 0.5 : p.life * 0.12;
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pCtx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(3) + ')';
    pCtx.fill();
  });

  pAnimId = requestAnimationFrame(animateParticles);
}

/* ─────────────────────────────────
   TAB SWITCH
───────────────────────────────── */
function switchTab(tab, btn) {
  document.querySelectorAll('.panel-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  elPanelInfo.classList.toggle('hidden',  tab !== 'info');
  elPanelStory.classList.toggle('hidden', tab !== 'story');
}

/* ─────────────────────────────────
   KEYBOARD
───────────────────────────────── */
document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      e.preventDefault();
      nextTrack();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      prevTrack();
      break;
    case 'ArrowUp':
      e.preventDefault();
      elVolSlider.value = Math.min(100, parseInt(elVolSlider.value, 10) + 5);
      setVolume(elVolSlider.value);
      break;
    case 'ArrowDown':
      e.preventDefault();
      elVolSlider.value = Math.max(0, parseInt(elVolSlider.value, 10) - 5);
      setVolume(elVolSlider.value);
      break;
    case 'KeyM': toggleMute();    break;
    case 'KeyR': toggleRepeat();  break;
    case 'KeyS': toggleShuffle(); break;
  }
});

window.addEventListener('resize', function() {
  initParticles();
  requestAnimationFrame(function() { initWaveform(); });
});

/* ─────────────────────────────────
   UTILITIES
───────────────────────────────── */
function fmt(s) {
  var m   = Math.floor(s / 60);
  var sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function esc(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ─────────────────────────────────
   BOOT — wait for DOM
───────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
