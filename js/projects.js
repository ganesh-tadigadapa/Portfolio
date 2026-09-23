/* 02 — EXPLORE. The projects.
 *
 * Each panel carries a live screenshot of the project's own site; it settles
 * in only once it has actually decoded, and a project without one keeps its
 * label rather than showing a broken frame.
 */

export function initProjects() {
  /* ================= WORK: screenshots settle in when they decode ================= */
  (function shots(){
    document.querySelectorAll('.pview img').forEach(img => {
      const wrap = img.parentElement;
      const ok = () => { img.classList.add('ready'); wrap.classList.add('has'); };
      /* a project without a screenshot keeps its label instead of a broken frame */
      if (img.complete) (img.naturalWidth ? ok() : 0);
      img.addEventListener('load', ok);
      img.addEventListener('error', () => img.removeAttribute('src'));
    });

    /* the sheen follows the pointer across whichever panel is being read */
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    document.querySelectorAll('.prow').forEach(row => {
      let queued = false, px = 0, py = 0;
      row.addEventListener('pointermove', e => {
        const r = row.getBoundingClientRect();
        px = ((e.clientX - r.left) / r.width) * 100;
        py = ((e.clientY - r.top) / r.height) * 100;
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          row.style.setProperty('--mx', px.toFixed(1) + '%');
          row.style.setProperty('--my', py.toFixed(1) + '%');
          queued = false;
        });
      }, {passive:true});
    });
  })();
}
