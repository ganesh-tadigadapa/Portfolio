/* Navigation: the hero's links, the footer's, and every other in-page anchor.
 * They glide rather than jump, so each chapter's arrival can actually play.
 */

import { reduced } from './animations.js';

export function initNavigation() {
  /* in-page links glide rather than jump, so the arrival can actually play */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    a.addEventListener('click', e => {
      const t = document.querySelector(href);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block:'start'});
      history.replaceState(null, '', href);
    });
  });
}
