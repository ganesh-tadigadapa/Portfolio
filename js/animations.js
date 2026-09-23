/* Shared animation layer.
 *
 * Two primitives every module needs ($ and the reduced-motion flag), plus the
 * scroll machinery the rest of the page hangs off: one observer that reveals
 * text blocks and tiles, one that arms each band's arrival, the watermark
 * drift, and the rAF-throttled scroll handler that drives them.
 *
 * The backstops matter. Everything in #page is display:none until the gate
 * opens, and an observation taken while an element has no layout box cannot be
 * trusted to re-fire — so each observer has a sweep that can finish the job.
 */

export const $ = id => document.getElementById(id);
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let io = null;
let revealTargets = [];
let bands = [];
let marks = [];

/* generic reveal: text blocks and tiles share one observer, one easing.
   The tile stagger reads back to front, so the grid has to exist first. */
export function initReveal(tiles = []) {
  const prows = [...document.querySelectorAll('.prow')];

  io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      let delay = 0;
      if (el.classList.contains('tile')) {
        delay = tiles.indexOf(el) * 55;              // reads back to front
      } else if (el.classList.contains('prow')) {
        delay = prows.indexOf(el) * 45;              // reads down the list
      }
      setTimeout(() => el.classList.add('in'), delay);
      io.unobserve(el);
    });
  }, {threshold:.15, rootMargin:'0px 0px -8% 0px'});

  revealTargets = [...document.querySelectorAll('.rv, .tile')];
  revealTargets.forEach(el => io.observe(el));

  /* Section arrival. The band itself is the unit here: a seam draws across the
     top, the content lifts out of a shallow blur, and the watermark fades up —
     so moving between sections reads as a transition, not as more scrolling. */
  bands = [...document.querySelectorAll('section.band')];
  marks = bands.map(b => b.querySelector('.mark'));
  const bio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('act');
      bio.unobserve(e.target);
    });
  }, {threshold:.06, rootMargin:'0px 0px -12% 0px'});
  bands.forEach(b => bio.observe(b));
}

/* The gate re-arms the observer once #page finally has a layout box: the
   earlier observations were taken on zero-height elements and cannot be
   trusted to re-fire, so the observer is dropped and rebuilt from scratch. */
export function reobserveReveal() {
  if (!io) return;
  io.disconnect();
  revealTargets.forEach(el => io.observe(el));
}

/* watermark drift: each mark trails its own band by a fraction of the scroll */
export function driftMarks() {
  if (reduced) return;
  const h = innerHeight;
  for (let i = 0; i < bands.length; i++) {
    const m = marks[i]; if (!m) continue;
    const r = bands[i].getBoundingClientRect();
    if (r.bottom < -200 || r.top > h + 200) continue;
    const t = (h / 2 - (r.top + r.height / 2)) / h;   // -1..1 through the band
    m.style.setProperty('--my', (t * 38).toFixed(1) + 'px');
  }
}

/* backstop for the bands, mirroring sweepReveal */
export function sweepBands() {
  if (!document.body.classList.contains('entered')) return;
  bands.forEach(b => {
    if (b.classList.contains('act')) return;
    const r = b.getBoundingClientRect();
    if (r.top < innerHeight * 0.9 && r.bottom > 0) b.classList.add('act');
  });
}

/* Backstop. If anything is scrolled into view and still hidden, show it. */
export function sweepReveal() {
  if (!document.body.classList.contains('entered')) return;
  for (let i = revealTargets.length - 1; i >= 0; i--) {
    const el = revealTargets[i];
    if (el.classList.contains('in')) { revealTargets.splice(i, 1); continue; }
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.92 && r.bottom > 0) {
      el.classList.add('in');
      revealTargets.splice(i, 1);
    }
  }
}

/* hero parallax + scroll progress, one rAF-throttled handler */
export function initScrollWatch() {
  const jp = document.querySelector('#site .jp'), prog = $('sprog');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (prog) prog.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      if (jp && !reduced && y < innerHeight)
        jp.style.transform = 'translate(-50%,calc(-50% + ' + (y * 0.18) + 'px)) scale(1)';
      sweepReveal();
      sweepBands();
      driftMarks();
      ticking = false;
    });
  }

  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', () => { sweepReveal(); sweepBands(); driftMarks(); },
    {passive:true});
}
