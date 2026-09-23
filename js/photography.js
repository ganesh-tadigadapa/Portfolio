/* 04 — OBSERVE (first movement). The horizontal film rail.
 *
 * A native scroll container with its own counter, progress bar and arrows,
 * kept reachable by keyboard and by trackpad without trapping the page.
 */

import { $ } from './animations.js';

export function initPhotography() {
  /* ================= LENS: horizontal film rail ================= */
  (function lens(){
    const rail = $('lensRail'), prog = $('lensProg'), count = $('lensCount'),
          foot = document.querySelector('.lensfoot');
    if (!rail) return;

    /* A caption and, where it matters, where the crop should hold. The frames
       are 3:4 boxes and the sources are taller than that, so a photograph whose
       subject sits low would lose it to a centred crop — `pos` anchors those. */
    const SHOTS = [
      {cap:'The road ahead'},
      {cap:'Last light',            pos:'center 82%'},
      {cap:'City after the rain'},
      {cap:'Gold on still water'},
      {cap:'Where the valley ends'},
      {cap:'Arches, monsoon sky'},
      {cap:'Dusk on the river',     pos:'center 64%'}
    ];
    const N = SHOTS.length;

    SHOTS.forEach(({cap, pos}, k) => {
      const n = String(k + 1).padStart(2, '0');
      const fig = document.createElement('figure');
      fig.className = 'shot';
      fig.tabIndex = 0;
      fig.innerHTML =
        '<img alt="' + cap + '" loading="lazy" decoding="async" src="assets/lens/' + n + '.jpg">' +
        '<span class="ghost">[ ' + n + ' ]</span>' +
        '<figcaption class="cap"><b>' + n + '</b><span>' + cap + '</span></figcaption>';
      rail.appendChild(fig);

      /* a landscape frame simply gets a wider box — same height, so the strip
         keeps one baseline and nothing is cropped into a sliver */
      const img = fig.querySelector('img');
      if (pos) img.style.objectPosition = pos;
      const settle = () => {
        if (img.naturalWidth > img.naturalHeight * 1.05) fig.classList.add('wide');
        fig.classList.add('loaded');
      };
      if (img.complete) (img.naturalWidth ? settle() : img.dataset.missing = '');
      img.addEventListener('load', settle);
      img.addEventListener('error', () => img.dataset.missing = '');
    });

    const prev = $('lensPrev'), next = $('lensNext');
    const shots = [...rail.children];

    /* scroll by whatever is actually on screen, so one press always lands a
       new frame whether the rail is showing two cards or six */
    const step = () => {
      const w = shots[0].getBoundingClientRect().width + 14;
      return Math.max(w, Math.round(rail.clientWidth * 0.8 / w) * w);
    };
    prev.addEventListener('click', () => rail.scrollBy({left:-step()}));
    next.addEventListener('click', () => rail.scrollBy({left: step()}));

    let queued = false;
    function sync(){
      const max = rail.scrollWidth - rail.clientWidth;
      const ratio = max > 2 ? rail.scrollLeft / max : 0;
      /* the bar's own width stands for how much of the strip is in view */
      const seen = Math.min(1, rail.clientWidth / rail.scrollWidth);
      prog.style.width = (seen * 100) + '%';
      prog.style.transform = 'translateX(' + (ratio * (100 / seen - 100)) + '%)';

      /* count from the first frame still whole at the left edge, so a rail
         that has not been touched yet reads 01 rather than its midpoint */
      const edge = rail.scrollLeft - 8;
      let near = shots.length - 1;
      for (let k = 0; k < shots.length; k++){
        if (shots[k].offsetLeft >= edge){ near = k; break; }
      }
      count.textContent = String(near + 1).padStart(2, '0') + ' / ' +
                          String(N).padStart(2, '0');

      prev.disabled = rail.scrollLeft < 4;
      next.disabled = rail.scrollLeft > max - 4;
      foot.classList.toggle('still', max < 4);
    }
    rail.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { sync(); queued = false; });
    }, {passive:true});
    addEventListener('resize', sync, {passive:true});

    /* arrow keys, but only while the rail is the thing on screen */
    let onScreen = false;
    new IntersectionObserver(es => es.forEach(e => {
      onScreen = e.isIntersecting;
      if (onScreen) sync();
    }), {threshold:.35}).observe(rail);
    addEventListener('keydown', e => {
      if (!onScreen || e.target.closest('input,textarea')) return;
      if (e.key === 'ArrowLeft')  { rail.scrollBy({left:-step()}); e.preventDefault(); }
      if (e.key === 'ArrowRight') { rail.scrollBy({left: step()}); e.preventDefault(); }
    });

    /* a trackpad's vertical flick should move the strip, but only while there
       is strip left to move — otherwise the page stops scrolling and traps you */
    rail.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = rail.scrollWidth - rail.clientWidth;
      if ((e.deltaY < 0 && rail.scrollLeft < 1) ||
          (e.deltaY > 0 && rail.scrollLeft > max - 1)) return;
      rail.scrollLeft += e.deltaY;
      e.preventDefault();
    }, {passive:false});

    sync();
    /* the band is display:none until the gate opens, so the first measurement
       is taken on a zero-width box — take it again once it has a layout */
    addEventListener('load', sync);
  })();
}
