/* Entry point.
 *
 * Modules are wired in the order the original single script ran them, which
 * matters in two places: the tile grid must exist before the reveal observer
 * collects its targets, and the intro registers its load listeners first.
 */

import { initReveal, initScrollWatch, $, reduced } from './animations.js';
import { initIntro } from './intro.js';
import { initTechStack } from './tech-stack.js';
import { initProjects } from './projects.js';
import { initPhotography } from './photography.js';
import { initJourney } from './journey.js';
import { initNavigation } from './navigation.js';

initIntro();                       // act one and two: intro, then the gate

const tiles = initTechStack();     // builds the grid the reveal observer needs
initProjects();
initPhotography();
initReveal(tiles);
initJourney();
initNavigation();
initScrollWatch();

/* ================= CURSOR ================= */
  /* ================= CURSOR ================= */
  /* two elements chasing the pointer at different rates: the dot is quick,
     the ring lags behind and catches up — that gap is the "butter". */
  (function cursor(){
    if (reduced || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    const dot = $('curDot'), ring = $('curRing');
    let mx = innerWidth / 2, my = innerHeight / 2;     // true pointer
    let dx = mx, dy = my, rx = mx, ry = my;            // rendered positions
    let alive = false;

    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!alive){                                     // first move: snap, don't fly in
        alive = true; dx = rx = mx; dy = ry = my;
        document.body.classList.add('cursor-on');
      }
    }, {passive:true});

    addEventListener('mousedown', () => document.body.classList.add('cur-down'));
    addEventListener('mouseup',   () => document.body.classList.remove('cur-down'));
    addEventListener('mouseleave',() => document.body.classList.remove('cursor-on'));
    addEventListener('mouseenter',() => alive && document.body.classList.add('cursor-on'));

    /* delegated hover state — survives cards being added or removed */
    const HOT = 'a, button, .shot, [role="button"], #gate';
    addEventListener('mouseover', e => {
      if (e.target.closest && e.target.closest(HOT)) document.body.classList.add('cur-hot');
    }, {passive:true});
    addEventListener('mouseout', e => {
      if (e.target.closest && e.target.closest(HOT)) document.body.classList.remove('cur-hot');
    }, {passive:true});

    (function loop(){
      dx += (mx - dx) * 0.34;      // dot: tight, almost on the pointer
      dy += (my - dy) * 0.34;
      rx += (mx - rx) * 0.12;      // ring: slack, glides in behind it
      ry += (my - ry) * 0.12;
      dot.style.transform  = 'translate3d(' + dx + 'px,' + dy + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();
  })();

/* ================= THEME ================= */
  /* ================= THEME ================= */
  (function theme(){
    const btn = $('theme'), root = document.documentElement;
    const save = v => { try{ localStorage.setItem('theme', v); }catch(e){} };

    let timer;
    const apply = next => { root.dataset.theme = next; save(next); };

    /* arm the global easing, then disarm it once the change has settled */
    const eased = next => {
      root.classList.add('theming');
      apply(next);
      clearTimeout(timer);
      timer = setTimeout(() => root.classList.remove('theming'), 650);
    };

    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';

      /* no View Transitions (or reduced motion): the CSS transitions carry it */
      if (!document.startViewTransition || reduced) return eased(next);

      /* otherwise the new theme irises out of the button itself */
      const r = btn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

      document.startViewTransition(() => apply(next)).ready.then(() => {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)',
                       'circle(' + far + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 720, easing: 'cubic-bezier(.76,0,.24,1)',
            pseudoElement: '::view-transition-new(root)' }
        );
      }); 
    });
  })();
