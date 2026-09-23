/* Act one and act two.
 *
 * The intro counts real load signals — fonts, then assets — never Math.random,
 * with a floor so the sequence is always seen and a failsafe so a blocked CDN
 * can never hold the door shut. It hands over to the gate, whose doors are
 * scrubbed open by scroll: the raw scroll value drives a target and a lerped
 * value chases it, which is what gives the swing its weight.
 */

import {
  $, reduced, reobserveReveal, sweepReveal, sweepBands, driftMarks,
} from './animations.js';
import { refreshJourney } from './journey.js';

export function initIntro() {
  const WORDS = [
    ["静寂","Seijaku · Silence"],
    ["創造","Souzou · Create"],
    ["未来","Mirai · Future"],
    ["光","Hikari · Light"],
    ["夢","Yume · Dream"],
    ["情熱","Jounetsu · Passion"],
  ];

  const kanji = $('kanji'), meaning = $('meaning'), num = $('num'),
        fill = $('fill'), intro = $('intro'), site = $('site'),
        tagState = $('tagState'), skip = $('skip');

  /* ---- rotating word, characters staggered in and out ---- */
  let wi = 0, wordTimer;
  function paint([text, mean]){
    kanji.innerHTML = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.transitionDelay = (i * 0.06) + 's';
      kanji.appendChild(s);
    });
    meaning.textContent = mean;
    requestAnimationFrame(() => {
      kanji.classList.add('show');
      meaning.classList.add('show');
    });
  }
  function nextWord(){
    kanji.classList.add('out');
    meaning.classList.remove('show');
    setTimeout(() => {
      kanji.classList.remove('out','show');
      paint(WORDS[wi]);
      wi = (wi + 1) % WORDS.length;
    }, 420);
  }
  paint(WORDS[0]); wi = 1;
  wordTimer = setInterval(nextWord, 1150);

  /* ---- progress driven by REAL load signals, not Math.random ---- */
  const MIN_MS = reduced ? 300 : 2400;   // floor so the intro is always seen
  const start  = performance.now();
  let target = 8, shown = 0, finished = false;

  const stage = (to, label) => { target = Math.max(target, to); if (label) tagState.textContent = label; };

  document.fonts.ready.then(() => stage(58, 'typefaces'));
  const assetsIn = () => stage(100, 'assets');
  if (document.readyState === 'complete') assetsIn();
  else addEventListener('load', assetsIn);
  // failsafe: a slow or blocked CDN must never hold the door shut
  setTimeout(() => stage(100, 'assets'), MIN_MS + 3500);

  (function frame(now){
    const elapsed = (now || performance.now()) - start;
    const timeCap = (elapsed / MIN_MS) * 100;                // never outruns MIN_MS
    const cap = Math.min(target, timeCap, 100);

    shown += (cap - shown) * 0.08;          // eased chase, so the digits breathe
    if (cap - shown < 0.4) shown = cap;

    num.textContent = Math.floor(shown);
    fill.style.width = shown.toFixed(2) + '%';

    // done once the real signals are in AND the counter has caught up to them
    if (elapsed >= MIN_MS && target >= 100 && shown >= 99.4) return complete();
    requestAnimationFrame(frame);
  })();

  /* ---- finish: last word, then wipe up to the site ---- */
  function complete(){
    if (finished) return;
    finished = true;
    clearInterval(wordTimer);

    num.textContent = '100';
    fill.style.width = '100%';
    tagState.textContent = 'ready';

    kanji.classList.add('out');
    meaning.classList.remove('show');
    setTimeout(() => {
      kanji.classList.remove('out','show');
      paint(["ようこそ","Youkoso · Welcome"]);
    }, reduced ? 0 : 420);

    /* light the gate now: it is still hidden behind the opaque intro, so by the
       time the wipe uncovers it, it is already fully rendered */
    liftGate();

    setTimeout(() => {
      intro.classList.add('out');
      startSettle();                             // motion carries across the seam
      document.body.classList.add('ready');      // scroll on, to drive the gate
      skip.remove();
      setTimeout(() => intro.remove(), 1400);    // stop it eating pointer events
      if (reduced) enterSite(true);              // no 3D swing under reduced motion
    }, reduced ? 120 : 800);
  }

  skip.addEventListener('click', complete);
  addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter') complete(); });

  /* ================= GATE ================= */
  /* scroll scrubs the doors open. the raw scroll value drives a target, and a
     lerped value chases it — same trick as the cursor, so the swing has weight. */
  const gate = $('gate'), spacer = $('spacer'), bloom = $('bloom'),
        gvig = $('gvig'), gfog = $('gfog'),
        portal = $('portal'), gateImg = $('gateImg'),
        full = document.querySelector('.scene .full');

  let gateLive = false, gateDone = false, pTarget = 0, pShown = 0,
      forcing = false, liftAt = 0;

  function liftGate(){
    gateLive = true;
    liftAt = performance.now();
    gate.classList.add('live');
    requestAnimationFrame(gateLoop);
  }

  /* the drift is measured from the moment the wipe starts uncovering the
     photograph, not from when it was mounted behind the intro — otherwise it
     has already decayed by the time anyone can see it */
  function startSettle(){ liftAt = performance.now(); }

  /* fade the photograph in once it has actually decoded */
  const wake = () => gateImg.classList.add('awake');
  if (gateImg.decode) gateImg.decode().then(wake).catch(wake);
  else if (gateImg.complete) wake();
  else gateImg.addEventListener('load', wake);

  /* walk toward the torii: the frame pushes in around its mouth while the
     light between the pillars swells to meet you.
     `settle` is a small extra scale that decays right after the gate appears,
     so the photograph is already drifting as the intro wipes off it — the two
     acts share one motion instead of stopping between them. */
  function paintGate(p, settle){
    const k = 1 + settle + p * 1.15;
    full.style.transform = 'translate3d(-50%,-50%,0) scale3d(' + k + ',' + k + ',1)';

    /* speed reads as blur. held at zero for the first third so the still frame
       stays crisp while you are only leaning in, then ramps with the dive. */
    const v = Math.max(0, (p - 0.32) / 0.68);
    full.style.filter = 'brightness(' + (1 + v * 0.35).toFixed(3) + ') ' +
                        'blur(' + (v * v * 3.6).toFixed(2) + 'px)';

    /* the tunnel closes from a wide frame down to just the opening */
    gvig.style.setProperty('--hole', (72 - p * 60) + '%');

    /* fog peaks mid-dive and is gone by the threshold */
    gfog.style.opacity = String(Math.sin(Math.min(1, p) * Math.PI) * 0.9);
    gfog.style.transform = 'scale3d(' + (1 + p * 1.6) + ',' + (1 + p * 1.6) + ',1)';

    const q = 1 + p * 5.2;
    portal.style.transform = 'translate3d(-50%,-50%,0) scale3d(' + q + ',' + q + ',1)';
    portal.style.opacity = String(0.45 + p * 0.55);
  }

  let lastFrame = 0;
  function gateLoop(now){
    if (gateDone) return;
    now = now || performance.now();

    /* smoothing has to be time-based, not per-frame: at 120Hz a fixed 0.12 lerp
       chases twice as fast as it does at 60Hz, which is why it felt different
       on different machines */
    const dt = lastFrame ? Math.min(64, now - lastFrame) : 16.7;
    lastFrame = now;
    const k = 1 - Math.pow(1 - 0.14, dt / 16.7);

    if (forcing) pTarget = Math.min(1, pTarget + dt / 900);
    pShown += (pTarget - pShown) * k;
    if (Math.abs(pTarget - pShown) < 0.0015) pShown = pTarget;

    const t = Math.min(1, (now - liftAt) / 2200);
    paintGate(pShown, 0.09 * Math.pow(1 - t, 3));   // expo-out decay

    if (pTarget >= 1 && pShown > 0.965) return enterSite();
    requestAnimationFrame(gateLoop);
  }

  function onGateScroll(){
    if (!gateLive || gateDone || forcing) return;
    const z = spacer.offsetHeight - innerHeight;
    const raw = z > 0 ? Math.min(1, Math.max(0, scrollY / (z * 0.82))) : 1;
    /* ease-in-out: the doors part gently, gather pace, then arrive softly,
       instead of tracking the trackpad one-to-one */
    pTarget = raw < 0.5 ? 4 * raw * raw * raw
                        : 1 - Math.pow(-2 * raw + 2, 3) / 2;
  }
  addEventListener('scroll', onGateScroll, {passive:true});

  /* click or Enter/Space walks through without scrolling */
  const forceOpen = () => { if (gateLive && !gateDone) forcing = true; };
  gate.addEventListener('click', forceOpen);
  addEventListener('keydown', e => {
    if (gateLive && !gateDone && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); forceOpen();
    }
  });

  /* Once, immediately; again after the swap has been laid out; and once more a
     beat later, because anchoring and restoration both adjust asynchronously. */
  function toTop(){
    scrollTo(0, 0);
    requestAnimationFrame(() => {
      scrollTo(0, 0);
      setTimeout(() => scrollTo(0, 0), 80);
    });
  }

  /* Kill the inertia outright: with the document unscrollable the momentum has
     nothing to act on, and anything that still fires is pinned back to zero. */
  function holdTop(ms){
    const body = document.body;
    body.classList.add('landing');
    const pin = () => { if (body.classList.contains('landing')) scrollTo(0, 0); };
    addEventListener('scroll', pin, {passive:true});
    setTimeout(() => {
      body.classList.remove('landing');
      removeEventListener('scroll', pin);
    }, ms);
  }

  function enterSite(instant){
    if (gateDone) return;
    gateDone = true;
    removeEventListener('scroll', onGateScroll);

    /* Swap the page in while the gate is still fully opaque: the spacer
       disappearing and the scroll resetting both happen out of sight. */
    document.body.classList.add('entered');
    requestAnimationFrame(refreshJourney);
    toTop();
    holdTop(instant || reduced ? 260 : 1500);   // ride out the flick

    if (instant || reduced){
      gate.classList.add('opened');
      site.classList.add('reveal');
      bloom.remove();
      setTimeout(() => gate.remove(), 400);
      afterEnter();
      return;
    }

    /* Hand the transform to CSS so the photograph keeps travelling through
       the dissolve, and start the hero underneath at the same moment. */
    requestAnimationFrame(() => {
      full.style.transition = 'transform 1.9s cubic-bezier(.16,1,.3,1)';
      full.style.transform  = 'translate3d(-50%,-50%,0) scale3d(3.6,3.6,1)';
      portal.style.transition = 'opacity .7s cubic-bezier(.16,1,.3,1)';
      portal.style.opacity = '0';
      gvig.style.transition = '--hole 1.2s cubic-bezier(.16,1,.3,1), opacity .9s ease';
      gvig.style.opacity = '0';
      gfog.style.transition = 'opacity .6s ease';
      gfog.style.opacity = '0';

      gate.classList.add('opened');
      bloom.classList.add('on');      // the gate's light carries across the cut
      site.classList.add('arrive');   // hero flown in from the same vanishing point
      site.classList.add('reveal');   // name begins forming during the arrival
      setTimeout(() => gate.remove(), 1900);
    });
    afterEnter();
  }

  /* the page only now has a layout box, so observations must be retaken */
  function afterEnter(){
    requestAnimationFrame(() => {
      reobserveReveal();
      sweepReveal();
      sweepBands();
      driftMarks();
    });
  }
}
