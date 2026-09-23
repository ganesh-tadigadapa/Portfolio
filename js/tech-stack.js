/* 03 — BUILD. The tech stack.
 *
 * The environment is a drawing that already contains the eighteen panels, laid
 * into its drafting surface in perspective. So the grid is not built here — it
 * is traced:
 * each entry carries the quad its tile occupies in the painting's own
 * 1554x1012 space, and this module lays a hit area over it, centres the mark
 * and the name inside it, and leans them to match the tile's own vanishing.
 *
 * Exactly one tile is live at a time — TensorFlow at rest, then whatever is
 * under the pointer.
 *
 * Below the width where the painted labels stop being legible the artboard's
 * tile layer is hidden and the same eighteen are listed as an ordinary grid;
 * both are built from this one array.
 */

import { $ } from './animations.js';

const NS = 'http://www.w3.org/2000/svg';

/* name, devicon class, and the quad it sits on: [topLeft, topRight, bottomRight, bottomLeft] */
const TILES = [
  {n:'Python',     i:'devicon-python-plain',      q:[[272,524],[428,524],[410,608],[228,608]]},
  {n:'JavaScript', i:'devicon-javascript-plain',  q:[[445,524],[597,524],[592,608],[415,608]]},
  {n:'Java',       i:'devicon-java-plain',        q:[[615,524],[768,524],[768,608],[600,608]]},
  {n:'React',      i:'devicon-react-original',    q:[[786,524],[939,524],[954,608],[786,608]]},
  {n:'Next.js',    i:'devicon-nextjs-plain',      q:[[957,524],[1109,524],[1139,608],[962,608]]},
  {n:'Tailwind',   i:'devicon-tailwindcss-plain', q:[[1126,524],[1282,524],[1326,608],[1144,608]]},

  {n:'Node.js',    i:'devicon-nodejs-plain',      q:[[218,622],[386,622],[362,722],[162,722]]},
  {n:'FastAPI',    i:'devicon-fastapi-plain',     q:[[402,622],[578,622],[565,722],[370,722]]},
  {n:'TensorFlow', i:'devicon-tensorflow-original', q:[[595,622],[768,622],[768,722],[578,722]]},
  {n:'Keras',      i:'devicon-keras-plain',       q:[[786,622],[959,622],[976,722],[786,722]]},
  {n:'OpenCV',     i:'devicon-opencv-plain',      q:[[976,622],[1152,622],[1184,722],[989,722]]},
  {n:'Git',        i:'devicon-git-plain',         q:[[1168,622],[1336,622],[1392,722],[1192,722]]},

  {n:'PostgreSQL', i:'devicon-postgresql-plain',  q:[[162,740],[338,740],[302,858],[100,858]]},
  {n:'MySQL',      i:'devicon-mysql-original',    q:[[352,740],[552,740],[538,858],[322,858]]},
  {n:'MongoDB',    i:'devicon-mongodb-plain',     q:[[568,740],[768,740],[768,858],[555,858]]},
  {n:'Firebase',   i:'devicon-firebase-plain',    q:[[786,740],[986,740],[999,858],[786,858]]},
  {n:'Docker',     i:'devicon-docker-plain',      q:[[1002,740],[1202,740],[1232,858],[1016,858]]},
  {n:'AWS',        i:'devicon-amazonwebservices-plain-wordmark', q:[[1216,740],[1392,740],[1454,858],[1252,858]]},
];

const W = 1554, H = 1012;
const pctX = x => (x / W * 100).toFixed(3) + '%';
const pctY = y => (y / H * 100).toFixed(3) + '%';

export function initTechStack() {
  const board = $('stackBoard'), svg = $('stackQuads'), grid = $('stackGrid');
  if (!board || !svg) return [];

  const live = [];

  TILES.forEach(t => {
    const [tl, tr, br, bl] = t.q;

    /* the hit area, traced onto the painted tile */
    const quad = document.createElementNS(NS, 'polygon');
    quad.setAttribute('points', t.q.map(p => p.join(',')).join(' '));
    quad.setAttribute('class', 'quad');
    quad.setAttribute('tabindex', '0');
    quad.setAttribute('role', 'img');
    quad.setAttribute('aria-label', t.n);
    svg.appendChild(quad);

    /* the mark and name, centred in the quad and leaned to match it: the
       painted tiles converge on the gate, so upright labels look pasted on */
    const cx = (tl[0] + tr[0] + br[0] + bl[0]) / 4;
    const cy = (tl[1] + tr[1] + br[1] + bl[1]) / 4 + 2;
    const lean = ((tl[0] + tr[0]) / 2 - (bl[0] + br[0]) / 2) / (bl[1] - tl[1]);
    const skew = -Math.atan(lean) * 180 / Math.PI * 0.75;

    const mark = document.createElement('div');
    mark.className = 'tmark';
    mark.style.left = pctX(cx);
    mark.style.top = pctY(cy);
    mark.style.transform = `translate(-50%,-50%) skewX(${skew.toFixed(2)}deg)`;
    mark.innerHTML = `<i class="${t.i}" aria-hidden="true"></i><span>${t.n}</span>`;
    board.appendChild(mark);

    /* the indicator that burns at the live tile's top corner */
    const spark = document.createElement('span');
    spark.className = 'tspark';
    spark.style.left = pctX(tr[0] - 16);
    spark.style.top = pctY(tr[1] + 9);
    board.appendChild(spark);

    live.push({quad, mark, spark, name: t.n});
  });

  const light = item =>
    live.forEach(x => [x.quad, x.mark, x.spark]
      .forEach(el => el.classList.toggle('on', x === item)));

  const rest = live.find(x => x.name === 'TensorFlow') || live[0];
  light(rest);
  live.forEach(it => {
    it.quad.addEventListener('pointerenter', () => light(it));
    it.quad.addEventListener('focus', () => light(it));
  });
  board.addEventListener('pointerleave', () => light(rest));

  /* the same eighteen, for widths the painting cannot carry */
  if (grid) {
    grid.innerHTML = TILES.map(t =>
      `<div class="tile" data-tech="${t.n}">` +
      `<i class="${t.i}" aria-hidden="true"></i><span>${t.n}</span></div>`
    ).join('');
  }

  fitTitle(board);
  return [];
}

/* The plate was calibrated against one cut of Cormorant Garamond: the heading
   spans 587-968 in the painting's own units with its baseline on y 291, which
   is what puts the drawn full stop where the painting expects it. A different
   cut — or the fallback, if the webfont never arrives — sets to a different
   width, so the fit is measured once the fonts have settled and corrected. */
function fitTitle(board) {
  const h = $('stackTitle');
  if (!h) return;
  const bl = h.querySelector('.bl');

  const apply = () => {
    const scale = board.getBoundingClientRect().width / W;
    if (!scale) return;
    const width = h.getBoundingClientRect().width / scale;
    if (!width) return;

    const current = parseFloat(getComputedStyle(h).fontSize) / scale;
    h.style.fontSize = (current * 381 / width) / W * 100 + 'cqw';
    if (bl) h.style.top = pctY(291 - bl.offsetTop / scale);
  };

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  else addEventListener('load', apply);
}
