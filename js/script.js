/* =====================================================
   CURASOAP — script de la page
   Tout ce que vous pouvez vouloir modifier est dans la
   section « RÉGLAGES » juste en dessous.
   ===================================================== */
'use strict';

/* ===================== RÉGLAGES ===================== */

// Numéro WhatsApp qui reçoit les commandes (indicatif + numéro, sans « + » ni espaces)
const WHATSAPP_NUMBER = '2290169777434';

// Enregistrement des commandes dans une feuille Google (recommandé, surtout pour TikTok).
// Collez ici l'adresse de l'application Web (voir outils/google-sheet.gs). Laisser vide = désactivé.
const ORDERS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyaLtiaSkO52sizwfdDsL4W3vWx0ofy4ZKN5J0ea0BbK6QJ7v56U022Lg58rEYm8kVnzA/exec';

// Pays proposés dans le formulaire.
// Bénin, Côte d’Ivoire et Sénégal : prix en FCFA. France : prix en euros (voir OFFERS.eur).
const COUNTRIES = {
  BJ: { name: 'Bénin',         prefix: '+229', euro: false, city: 'Ex : Cotonou, Akpakpa' },
  CI: { name: 'Côte d’Ivoire', prefix: '+225', euro: false, city: 'Ex : Abidjan, Cocody' },
  SN: { name: 'Sénégal',       prefix: '+221', euro: false, city: 'Ex : Dakar, Plateau' },
  FR: { name: 'France',        prefix: '+33',  euro: true,  city: 'Ex : Paris 18e' }
};

// Offres : nombre de savons, sacs offerts, prix en FCFA et équivalent en euros (1 € ≈ 656 FCFA)
const OFFERS = {
  1:  { soaps: 1,  bags: 1,  fcfa: 5000,  eur: 7.6  },
  3:  { soaps: 3,  bags: 3,  fcfa: 10000, eur: 15.2 },
  15: { soaps: 15, bags: 15, fcfa: 35000, eur: 53.5 }
};

// Mots qui alternent sous le titre : « Idéal pour … »
const TYPED_WORDS = [
  'les taches brunes',
  'l’hyperpigmentation',
  'les aisselles foncées',
  'les genoux et coudes',
  'l’entre-cuisses',
  'les marques d’acné'
];

/* ===================== OUTILS ===================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===================== TITRES ANIMÉS ===================== */
function splitWords(root){
  let i = 0;
  (function walk(node){
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.className = 'wi';
          inner.style.transitionDelay = (i++ * 70) + 'ms';
          inner.textContent = part;
          w.appendChild(inner); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1){ walk(n); }
    });
  })(root);
}

const splitEls = $$('.split');
splitEls.forEach(splitWords);

const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); }
  });
}, { threshold: 0.25 });
splitEls.forEach(el => revealObserver.observe(el));
$$('[data-reveal]').forEach(el => revealObserver.observe(el));

/* ===================== MOTS QUI S’ÉCRIVENT ET ALTERNENT ===================== */
(function typed(){
  const el = $('#typed');
  if (!el || reduceMotion) return;
  let w = 0, c = 0, del = false;
  el.textContent = '';
  (function tick(){
    const word = TYPED_WORDS[w];
    if (!del){
      c++; el.textContent = word.slice(0, c);
      if (c === word.length){ del = true; return setTimeout(tick, 1700); }
      return setTimeout(tick, 70);
    }
    c--; el.textContent = word.slice(0, c);
    if (c === 0){ del = false; w = (w + 1) % TYPED_WORDS.length; return setTimeout(tick, 320); }
    setTimeout(tick, 35);
  })();
})();

/* =====================================================
   CARROUSEL DES CRÉATIVES (tout en haut de la page)
   Comme BricoDéco : toutes les cartes gardent la MÊME TAILLE.
   - la 1re vidéo démarre toute seule (avec le son si le navigateur l'autorise)
   - toucher une vidéo la lance avec le son, sur place (sans agrandir, sans défiler)
   - toucher la vidéo qui joue la met en pause
   - à la fin d'une vidéo, la suivante démarre
   ===================================================== */
(function reel(){
  const reelEl = $('#reel');
  const track = $('#reelTrack');
  const slides = $$('.slide', track);
  if (!track || !slides.length) return;
  const vid = i => $('video', slides[i]);

  let current = 0;         // vidéo en cours (ou à lancer)
  let blocked = false;     // le navigateur refuse le son : lecture muette en attendant un toucher
  let visible = false;     // le carrousel est à l'écran
  let voiceOn = false;     // un témoignage audio est en cours
  let manualPause = false; // la personne a mis la vidéo en pause

  slides.forEach((s, i) => {
    const v = $('video', s);
    v.muted = true; v.loop = false; v.controls = false;
    v.playsInline = true; v.disablePictureInPicture = true;
    // lecture DANS la page (TikTok, Instagram, Facebook, navigateurs Android) : jamais en plein écran
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('x5-playsinline', '');
    v.setAttribute('x5-video-player-type', 'h5-page');
    v.setAttribute('x5-video-player-fullscreen', 'false');
    v.setAttribute('disablepictureinpicture', '');
    v.setAttribute('disableremoteplayback', '');
    v.setAttribute('controlslist', 'nofullscreen nodownload noremoteplayback');
    v.addEventListener('contextmenu', e => e.preventDefault());
    // si un navigateur passe quand même en plein écran, on en ressort aussitôt
    v.addEventListener('webkitbeginfullscreen', () => { try { v.webkitExitFullscreen(); } catch (e) {} });

    // bouton play (visible tant que la vidéo ne joue pas)
    const pb = document.createElement('button');
    pb.type = 'button'; pb.className = 'play'; pb.setAttribute('aria-label', 'Lire la vidéo');
    pb.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    s.appendChild(pb);
    v.addEventListener('playing', () => s.classList.add('is-playing'));
    ['pause', 'ended', 'emptied'].forEach(ev => v.addEventListener(ev, () => s.classList.remove('is-playing')));

    // vidéo terminée → la suivante démarre
    v.addEventListener('ended', () => {
      if (i !== current) return;
      const n = (i + 1) % slides.length;
      goTo(n);
      if (visible && !manualPause && !voiceOn) play(n, !blocked);
    });

    // toucher une carte
    s.addEventListener('click', () => {
      const cur = vid(i);
      if (i === current && !cur.paused){
        if (blocked || cur.muted){ enableSound(); return; }    // lecture muette → le toucher active le son
        manualPause = true; cur.pause(); return;                // sinon : pause
      }
      // lancer CETTE vidéo, avec le son (le toucher l'autorise), sur place
      manualPause = false; blocked = false;
      pauseOthers(i); current = i;
      cur.muted = false;
      const p = cur.play();
      if (p && p.catch) p.catch(() => { cur.muted = true; blocked = true; cur.play().catch(() => {}); });
    });
  });

  document.addEventListener('fullscreenchange', () => {
    const fs = document.fullscreenElement;
    if (fs && fs.tagName === 'VIDEO' && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  });

  function pauseOthers(keep){
    slides.forEach((s, k) => { if (k !== keep){ const v = vid(k); if (!v.paused) v.pause(); } });
  }

  async function play(i, withSound){
    current = i; pauseOthers(i);
    const v = vid(i);
    v.muted = !withSound;
    try { await v.play(); }
    catch (err){
      if (!v.muted){                     // son refusé → lecture muette
        v.muted = true; blocked = true;
        try { await v.play(); } catch (e2){}
      }
    }
  }
  const autoStart = () => {
    if (!visible || manualPause || voiceOn || document.hidden) return;
    const v = vid(current);
    if (v.paused) play(current, !blocked);
  };

  function enableSound(){
    blocked = false;
    const v = vid(current);
    v.muted = false;
    const p = v.play();
    if (p && p.catch) p.catch(() => { v.muted = true; blocked = true; v.play().catch(() => {}); });
  }
  // premier toucher n'importe où : on active le son en silence (sans bouton)
  function tryUnmute(){
    if (!blocked || manualPause || !visible || voiceOn) return;
    const v = vid(current);
    const back = () => { if (!visible || voiceOn) return; v.muted = true; v.play().catch(() => {}); };
    v.muted = false;
    const p = v.play();
    if (p && p.then) p.then(() => { blocked = false; }).catch(back);
    setTimeout(() => { if (v.paused && !v.ended) back(); }, 250);
  }
  ['click', 'touchend', 'pointerup', 'keydown'].forEach(ev => document.addEventListener(ev, tryUnmute, { passive: true }));

  // défilement (sans changer la lecture, sans changer les tailles)
  function centerOffset(i){
    const s = slides[i];
    return s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2;
  }
  function nearest(){
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
      if (d < dist){ dist = d; best = i; }
    });
    return best;
  }
  function goTo(i){
    track.scrollTo({ left: centerOffset(i), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  const step = d => goTo((nearest() + d + slides.length) % slides.length);
  $('#reelPrev').addEventListener('click', () => step(-1));
  $('#reelNext').addEventListener('click', () => step(1));
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight'){ e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); step(-1); }
  });

  // la vidéo qui joue est sortie du carrousel (on a fait glisser) → pause
  const inView = slides.map(() => false);
  const slideIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const i = slides.indexOf(e.target);
      const now = e.intersectionRatio >= 0.35;
      if (i === current && inView[i] && !now){ const v = vid(i); if (!v.paused) v.pause(); }
      inView[i] = now;
    });
  }, { root: track, threshold: [0, 0.35, 1] });
  slides.forEach(s => slideIO.observe(s));

  // pause quand le carrousel sort de l'écran ou que l'onglet est caché
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible){ const v = vid(current); if (v) v.pause(); } else { autoStart(); }
  }, { threshold: 0.35 }).observe(reelEl);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){ const v = vid(current); if (v) v.pause(); } else { autoStart(); }
  });

  // un témoignage audio coupe la vidéo
  document.addEventListener('voice:start', () => { voiceOn = true; const v = vid(current); if (v) v.pause(); });
  document.addEventListener('voice:stop',  () => { voiceOn = false; autoStart(); });

  // démarrage : la 1re vidéo est centrée
  track.scrollLeft = centerOffset(0);
})();

/* =====================================================
   GALERIE PRODUIT + AGRANDISSEMENT
   ===================================================== */
(function gallery(){
  const thumbs = $$('.g-thumb');
  const main = $('#gMain');
  const stage = $('#gStage');
  if (!thumbs.length) return;

  const items = thumbs.map(t => ({ src: t.dataset.src, alt: t.dataset.alt }));
  let idx = 0, token = 0;

  const strip = $('#gThumbs');
  function centerThumb(){
    const t = thumbs[idx];
    if (!strip || !t) return;
    strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
  }

  function preload(i){ const im = new Image(); im.src = items[(i + items.length) % items.length].src; }

  function show(i){
    idx = (i + items.length) % items.length;
    const my = ++token;
    main.classList.add('swap');
    const im = new Image();
    im.onload = im.onerror = () => {
      if (my !== token) return;
      main.src = items[idx].src; main.alt = items[idx].alt;
      main.classList.remove('swap');
      if (!lb.hidden){ lbImg.src = items[idx].src; lbImg.alt = items[idx].alt; }
    };
    im.src = items[idx].src;
    thumbs.forEach((t, k) => t.classList.toggle('is-on', k === idx));
    centerThumb();
    preload(idx + 1);
  }

  thumbs.forEach((t, k) => t.addEventListener('click', () => show(k)));
  $('#gPrev').addEventListener('click', () => show(idx - 1));
  $('#gNext').addEventListener('click', () => show(idx + 1));

  // glisser au doigt
  function swipe(el, onLeft, onRight){
    let x0 = 0, y0 = 0, on = false;
    el.addEventListener('touchstart', e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; on = true; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (!on) return; on = false;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3){ dx < 0 ? onLeft() : onRight(); }
    }, { passive: true });
  }
  swipe(stage, () => show(idx + 1), () => show(idx - 1));

  // agrandissement plein écran
  const lb = $('#lightbox'), lbImg = $('#lbImg');
  function openLb(){
    lbImg.src = items[idx].src; lbImg.alt = items[idx].alt;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    $('#cta').classList.add('is-hidden');
  }
  function closeLb(){
    lb.hidden = true; document.body.style.overflow = '';
    $('#cta').classList.remove('is-hidden');
    document.dispatchEvent(new Event('cta:refresh'));
  }
  main.addEventListener('click', openLb);
  $('#gZoom').addEventListener('click', openLb);
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
  $('#lbNext').addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target === lbImg) closeLb(); });
  swipe(lb, () => show(idx + 1), () => show(idx - 1));
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });

  preload(1);
})();

/* =====================================================
   TÉMOIGNAGES AUDIO
   ===================================================== */
(function voices(){
  const cards = $$('.voice-card');
  if (!cards.length) return;
  const hint = $('#voiceHint');
  const N = 40;
  const fmt = t => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };

  cards.forEach((card, ci) => {
    const audio = $('audio', card), btn = $('.vplay', card), wave = $('.wave', card);
    const cur = $('.cur', card), dur = $('.dur', card);

    // barres du signal sonore
    for (let i = 0; i < N; i++){
      const b = document.createElement('i');
      const h = 22 + Math.abs(Math.sin(i * 1.7 + ci * 2.3) * Math.cos(i * .53 + ci)) * 68;
      b.style.setProperty('--h', h.toFixed(0) + '%');
      b.style.setProperty('--d', ((i * 83) % 700) + 'ms');
      wave.appendChild(b);
    }
    const bars = [...wave.children];
    const paint = () => {
      const p = audio.duration ? audio.currentTime / audio.duration : 0;
      bars.forEach((b, i) => b.classList.toggle('on', (i + 1) / N <= p + 0.001));
      cur.textContent = fmt(audio.currentTime);
    };

    audio.addEventListener('loadedmetadata', () => { if (isFinite(audio.duration)) dur.textContent = fmt(Math.round(audio.duration)); });
    audio.addEventListener('timeupdate', paint);

    audio.addEventListener('play', () => {
      cards.forEach(o => { if (o !== card){ const a = $('audio', o); if (!a.paused) a.pause(); } });
      card.classList.add('is-playing', 'was-played');
      if (hint) hint.classList.add('is-gone');
      document.dispatchEvent(new Event('voice:start'));
    });
    const stop = () => {
      card.classList.remove('is-playing');
      if (cards.every(o => $('audio', o).paused)) document.dispatchEvent(new Event('voice:stop'));
    };
    audio.addEventListener('pause', stop);
    audio.addEventListener('ended', () => { audio.currentTime = 0; paint(); stop(); });

    btn.addEventListener('click', () => { audio.paused ? audio.play().catch(() => {}) : audio.pause(); });

    // toucher le signal pour se déplacer dans le message
    const seek = clientX => {
      const r = wave.getBoundingClientRect();
      if (audio.duration) audio.currentTime = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * audio.duration;
      paint();
    };
    wave.addEventListener('click', e => seek(e.clientX));
    wave.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
      if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
    });
  });
})();

/* =====================================================
   FORMULAIRE → WHATSAPP
   ===================================================== */
(function order(){
  const form = $('#orderForm');
  if (!form) return;

  const clean = s => s.replace(/[\u202f\u00a0]/g, ' ');
  const nf = n => clean(n.toLocaleString('fr-FR'));

  function priceParts(offerKey, countryKey){
    const o = OFFERS[offerKey], c = COUNTRIES[countryKey];
    return c.euro
      ? { num: clean(o.eur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })), cur: '€' }
      : { num: nf(o.fcfa), cur: 'FCFA' };
  }
  const price = (k, ck) => { const p = priceParts(k, ck); return p.num + ' ' + p.cur; };
  const priceHtml = (k, ck) => { const p = priceParts(k, ck); return `<span class="pn">${p.num}</span><span class="pc">${p.cur}</span>`; };
  function offerLabel(k){
    const o = OFFERS[k];
    return `${o.soaps} savon${o.soaps > 1 ? 's' : ''} + ${o.bags} sac${o.bags > 1 ? 's' : ''} à savon offert${o.bags > 1 ? 's' : ''}`;
  }
  const country = () => form.country.value;
  const offer = () => form.offer.value;

  function refresh(){
    const c = COUNTRIES[country()];
    $$('[data-price]').forEach(el => { el.innerHTML = priceHtml(el.dataset.price, country()); });
    $('#prefix').textContent = c.prefix;
    $('#fCity').placeholder = c.city;
    $('#recapText').textContent = offerLabel(offer());
    $('#recapPrice').innerHTML = priceHtml(offer(), country());

    // prix sur le bouton fixe
    const o = OFFERS[offer()];
    const ctaOffer = $('#ctaOffer'), ctaPrice = $('#ctaPrice');
    if (ctaOffer && ctaPrice){
      const txt = price(offer(), country());
      ctaOffer.textContent = o.soaps + ' savon' + (o.soaps > 1 ? 's' : '');
      if (ctaPrice.textContent !== txt){
        ctaPrice.textContent = txt;
        ctaPrice.classList.remove('pop'); void ctaPrice.offsetWidth; ctaPrice.classList.add('pop');
      }
    }
  }
  form.addEventListener('change', refresh);

  // pré-sélection : les visiteurs situés en Europe voient la France
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.indexOf('Europe/') === 0) form.country.value = 'FR';
  } catch (e) {}
  refresh();

  const btn = $('#submitBtn'), label = $('#submitLabel');
  const original = label.textContent;

  // ---- fenêtre de confirmation : « commande prise en compte » + bouton WhatsApp ----
  const panel = $('#waPanel');
  const prettyNumber = '+' + WHATSAPP_NUMBER.slice(0, 3) + ' ' + WHATSAPP_NUMBER.slice(3).replace(/(\d{2})(?=\d)/g, '$1 ');
  let lastMsg = '';

  function showPanel(o){
    lastMsg = o.msg;
    $('#waApp').href = o.appUrl;
    $('#waWeb').href = o.webUrl;
    $('#waNum').textContent = prettyNumber;
    $('#waCopy').textContent = 'Copier ma commande';
    $('#dOffer').textContent = o.offer;
    $('#dTotal').textContent = o.total;
    $('#dCity').textContent = o.city;
    const first = (o.name || '').split(' ')[0];
    if (o.saved){
      $('#waTitle').textContent = 'Commande prise en compte';
      $('#waText').textContent = 'Merci' + (first ? ' ' + first : '') + ' ! Votre commande est bien enregistrée.';
    } else {
      $('#waTitle').textContent = 'Votre commande est prête';
      $('#waText').textContent = 'Merci' + (first ? ' ' + first : '') + ' ! Envoyez-la sur WhatsApp pour la confirmer.';
    }
    $('#waTip').hidden = !IN_APP;
    panel.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#cta').classList.add('is-hidden');
  }
  function closePanel(){
    panel.hidden = true;
    document.body.style.overflow = '';
    document.dispatchEvent(new Event('cta:refresh'));
  }
  $('#waClose').addEventListener('click', closePanel);
  panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });

  async function copyText(t){
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e){
      const ta = document.createElement('textarea');
      ta.value = t; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2){}
      ta.remove(); return ok;
    }
  }
  $('#waCopy').addEventListener('click', async () => {
    const ok = await copyText(lastMsg);
    $('#waCopy').textContent = ok ? 'Copié ✓ collez-la dans WhatsApp' : 'Copie impossible : notez le numéro';
  });

  // enregistre la commande (Google Sheet + e-mails) sans attendre de réponse
  function sendOrder(order){
    if (!ORDERS_ENDPOINT) return false;
    const body = JSON.stringify(order);
    try {
      fetch(ORDERS_ENDPOINT, {
        method: 'POST', mode: 'no-cors', keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body
      }).catch(() => {});
    } catch (err){
      try { navigator.sendBeacon(ORDERS_ENDPOINT, new Blob([body], { type: 'text/plain' })); } catch (e2){}
    }
    return true;
  }
  const IN_APP = /TikTok|musical_ly|Bytedance|trill/i.test(navigator.userAgent);
  let lastSent = { key: '', at: 0 };

  form.addEventListener('submit', e => {
    e.preventDefault();
    const c = COUNTRIES[country()];
    let phone = $('#fPhone').value.trim().replace(/\s+/g, ' ');
    // si la personne a déjà tapé l'indicatif (+229… ou 00229…), on le garde tel quel
    if (!/^(\+|00)/.test(phone)){
      if (country() === 'FR') phone = phone.replace(/^0/, '');
      phone = c.prefix + ' ' + phone;
    }
    const name = $('#fName').value.trim(), city = $('#fCity').value.trim(), landmark = $('#fLandmark').value.trim();

    // Message WhatsApp : même format que la toute première version
    const msg =
`Bonjour CuraSoap 👋
Je souhaite commander :

🧼 Offre : ${offerLabel(offer())}
💰 Total : ${price(offer(), country())}
🌍 Pays : ${c.name}

👤 Nom : ${name}
📞 Téléphone : ${phone}
📍 Ville / quartier : ${city}
🧭 Point de repère : ${landmark}`;

    // Lien de la même forme que la page BricoDéco (texte lisible + %0A) ; on protège seulement % & # +
    const raw = msg.replace(/%/g, '%25').replace(/&/g, '%26').replace(/#/g, '%23').replace(/\+/g, '%2B').replace(/\n/g, '%0A');
    const webUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + raw;
    const appUrl = 'whatsapp://send?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(msg);

    // 1) on enregistre la commande (sans doublon si l'on appuie deux fois de suite)
    let saved = !!ORDERS_ENDPOINT;
    if (saved && !(lastSent.key === msg && Date.now() - lastSent.at < 120000)){
      sendOrder({
        offre: offerLabel(offer()),
        total: price(offer(), country()),
        pays: c.name,
        nom: name,
        telephone: phone,
        ville: city,
        repere: landmark,
        provenance: IN_APP ? 'TikTok / navigateur intégré' : 'Navigateur',
        appareil: navigator.userAgent.slice(0, 140)
      });
      lastSent = { key: msg, at: Date.now() };
    }

    // 2) on affiche la fenêtre : la personne envoie elle-même sa commande sur WhatsApp
    showPanel({
      msg, webUrl, appUrl, saved, name,
      offer: offerLabel(offer()),
      total: price(offer(), country()),
      city: city + (landmark ? ' · ' + landmark : '')
    });
  });

  window.addEventListener('pageshow', () => { btn.disabled = false; label.textContent = original; });
})();

/* =====================================================
   BOUTON FIXE « Je fais rayonner ma peau » + prix de l'offre choisie
   - visible partout, il affiche le prix de la sélection en cours
   - il se range quand le bouton d'envoi du formulaire est à l'écran
   - pendant que l'on remplit le formulaire, un appui envoie la commande
   ===================================================== */
(function cta(){
  const btn = $('#cta'), form = $('#orderForm'), send = $('#submitBtn');
  if (!btn || !form || !send) return;
  let sendVisible = false;

  new IntersectionObserver(([e]) => {
    sendVisible = e.isIntersecting;
    btn.classList.toggle('is-hidden', sendVisible);
  }, { threshold: 0.6 }).observe(send);
  document.addEventListener('cta:refresh', () => btn.classList.toggle('is-hidden', sendVisible));

  btn.addEventListener('click', e => {
    const r = form.getBoundingClientRect();
    const inView = r.top < window.innerHeight * 0.55 && r.bottom > window.innerHeight * 0.45;
    if (inView){
      e.preventDefault();
      if (form.requestSubmit) form.requestSubmit(); else send.click();
    }
  });
})();
