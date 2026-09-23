/* The journey: four chapters read as one continuous descent.
 *
 *   01 ENTER · 02 EXPLORE · 03 BUILD · 04 OBSERVE · CONNECT
 *
 * One handler measures each chapter against the viewport rather than against
 * the document, so it does not care which element is doing the scrolling, and
 * writes one number per chapter: how far it has been left behind.
 */

import { $, reduced } from './animations.js';

/* the gate needs to re-measure the moment #page is revealed, which is before
   this module has anything to measure — so the call is routed through here */
let frameRef = () => {};
export const refreshJourney = () => frameRef();

export function initJourney() {
  /* ================= THE JOURNEY =================
     One handler for the whole descent. It measures each chapter against the
     viewport rather than against the document, so it does not care which
     element is doing the scrolling, and writes one number per chapter: how
     far that chapter has been left behind. Everything it drives is a
     transform or an opacity, so the cost is a compositor pass. */
  (function journey(){
    const chapters = [...document.querySelectorAll('.chapter')];
    const root = document.documentElement;
    if (!chapters.length) return;

    let current = 0, queued = false;

    /* the mark re-reads itself: the outgoing numeral lifts away as the next
       one rises into its place */
    function setChapter(n){
      if (n === current) return;
      current = n;
      root.setAttribute('data-ch', n);
      const old = document.getElementById('chNum');
      if (!old) return;
      old.className = 'out';
      old.removeAttribute('id');
      const next = document.createElement('span');
      next.id = 'chNum';
      next.className = 'in enter';
      next.textContent = String(n).padStart(2, '0');
      old.parentNode.appendChild(next);
      requestAnimationFrame(() => next.classList.remove('enter'));
      setTimeout(() => old.remove(), 900);
    }

    function frame(){
      queued = false;
      if (!document.body.classList.contains('entered')) return;
      const vh = innerHeight;
      let active = 1;

      for (const el of chapters){
        const r = el.getBoundingClientRect();
        /* A chapter holds still for as long as any of it is worth reading. It
           only drifts and dims once its foot has risen past the bottom of the
           viewport — that is, once the next chapter is taking over. */
        const lv = reduced ? 0 : (vh - r.bottom) / (vh * .75);
        el.style.setProperty('--lv', Math.max(0, Math.min(1, lv)).toFixed(3));
        /* the chapter holding the middle of the viewport is the one we are in */
        if (r.top <= vh * .5) active = +el.dataset.ch;
      }
      setChapter(active);
    }

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    };

    root.setAttribute('data-ch', '1');
    addEventListener('scroll', onScroll, {passive:true, capture:true});
    addEventListener('resize', onScroll, {passive:true});
    /* the gate calls this the moment the page is revealed, and again on load,
       because until then the chapters have no layout to measure */
    frameRef = frame;
    addEventListener('load', frame);
    frame();
  })();

  /* the closing movement waits until it is actually reached, so chapter four
     reads as two beats rather than one */
  (function closingMovement(){
    const c = $('connect');
    if (!c) return;
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('seen');
      o.unobserve(e.target);
    }), {threshold:.18, rootMargin:'0px 0px -8% 0px'}).observe(c);
  })();
}
