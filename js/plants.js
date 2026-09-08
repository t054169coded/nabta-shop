/* plants.js — the six plants, drawn as SVG so they can genuinely grow.
   Every plant is built in the same "studio": same viewBox, same backdrop,
   same window light, same floor shadow and the same pot family — which is what
   makes six different plants read as one photo shoot.

   Coordinate system inside the stage:
     viewBox 0 0 440 640 · floor line y = 604 · soil surface y = 528
     scale: 2.2 px per real centimetre, measured from the floor
   Each builder draws its foliage with the origin (0,0) at the soil surface and
   negative y pointing up, reaching -foliageH at full maturity. */

const PX_PER_CM = 2.2;
const FLOOR_Y = 604;
const SOIL_Y = 528;
const CENTRE_X = 210;

/** Foliage height in px for a plant whose total grown height is `cm`. */
const foliageHeight = cm => cm * PX_PER_CM - (FLOOR_Y - SOIL_Y);

/* ---------------------------------------------------------------- leaf shapes */

/** Long paddle leaf — bird of paradise, banana family. */
const paddleLeaf = (len, wid) => `M0 0
  C ${-wid * 0.45} ${-len * 0.18} ${-wid} ${-len * 0.5} ${-wid * 0.3} ${-len * 0.94}
  C ${-wid * 0.12} ${-len * 1.02} ${wid * 0.12} ${-len * 1.02} ${wid * 0.3} ${-len * 0.94}
  C ${wid} ${-len * 0.5} ${wid * 0.45} ${-len * 0.18} 0 0 Z`;

/** Plain rounded oval — rubber plant, pothos base leaves. */
const ovalLeaf = (len, wid) => `M0 0
  C ${-wid} ${-len * 0.22} ${-wid} ${-len * 0.78} 0 ${-len}
  C ${wid} ${-len * 0.78} ${wid} ${-len * 0.22} 0 0 Z`;

/** Violin-shaped leaf: narrow base, pinched waist, wide rounded top. */
const fiddleLeaf = (len, wid) => `M0 0
  C ${-wid * 0.9} ${-len * 0.1} ${-wid * 1.0} ${-len * 0.32} ${-wid * 0.46} ${-len * 0.52}
  C ${-wid * 1.5} ${-len * 0.68} ${-wid * 1.25} ${-len * 0.99} 0 ${-len}
  C ${wid * 1.25} ${-len * 0.99} ${wid * 1.5} ${-len * 0.68} ${wid * 0.46} ${-len * 0.52}
  C ${wid * 1.0} ${-len * 0.32} ${wid * 0.9} ${-len * 0.1} 0 0 Z`;

/** Heart leaf — pothos. */
const heartLeaf = (s) => `M0 0
  C ${-s * 0.72} ${-s * 0.3} ${-s * 0.62} ${-s * 1.02} 0 ${-s * 0.82}
  C ${s * 0.62} ${-s * 1.02} ${s * 0.72} ${-s * 0.3} 0 0 Z`;

/** Right-hand half of a notched monstera leaf, cut back toward the midrib. */
function monsteraHalfPath (len, wid, n) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = i / n;
    const b = (i + 0.58) / n;
    const c = (i + 1) / n;
    const w = k => wid * Math.sin(Math.PI * (0.16 + 0.84 * k)) * (1 - k * 0.22);
    d += `Q ${w(a) * 1.1} ${-len * (a + 0.04)} ${w(b)} ${-len * b} `;
    d += `Q ${wid * 0.62} ${-len * (b + 0.02)} ${wid * 0.5} ${-len * c} `;
  }
  return d;
}

/** A full monstera leaf: two mirrored notched halves meeting at the midrib. */
function monsteraLeaf (len, wid, n = 4) {
  const half = `M0 0 ${monsteraHalfPath(len, wid, n)} L0 ${-len} Z`;
  return `
    <path d="${half}" fill="var(--leaf-1)" transform="scale(-1,1)"/>
    <path d="${half}" fill="var(--leaf-1)"/>
    <path d="${half}" fill="var(--leaf-2)" opacity=".35" transform="scale(-1,1)"/>
    <path d="M0 0 L0 ${-len}" stroke="var(--leaf-3)" stroke-width="${wid * 0.05}"
          opacity=".5" fill="none" stroke-linecap="round"/>`;
}

/* --------------------------------------------------------------- leaf wrapper */

/* A leaf is wrapped twice on purpose:
   the outer <g> carries the SVG transform attribute (where the leaf sits and
   how it is angled), the inner <g class="lf"> is animated by CSS. Mixing both
   on one element would let CSS overwrite the placement. */
function leaf ({ x = 0, y = 0, rot = 0, scale = 1, delay = 0, mature = false, body }) {
  const cls = mature ? 'lf lf--mature' : 'lf';
  return `<g transform="translate(${r(x)},${r(y)}) rotate(${r(rot)}) scale(${r(scale, 3)})">
            <g class="${cls}" style="--d:${Math.round(delay)}ms">${body}</g>
          </g>`;
}

/** A stem or vine that draws itself on as the plant grows. */
function stem (d, width, delay = 0, colour = 'var(--stem)') {
  return `<path class="st" pathLength="100" style="--d:${Math.round(delay)}ms"
            d="${d}" stroke="${colour}" stroke-width="${width}" fill="none"
            stroke-linecap="round"/>`;
}

const r = (n, p = 1) => Number(n.toFixed(p));

/* -------------------------------------------------------------- plant builders
   Each returns { html, young } where `young` is the scale factor used before
   the plant has grown — small enough to read as a young plant, large enough
   to still be legible in the frame. */

function birdOfParadise (H) {
  const n = 9;
  let out = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const side = i % 2 ? 1 : -1;
    const spread = 14 + t * 34;
    const len = H * (0.5 + 0.5 * t);
    const mature = i >= 6;
    out += stem(`M0 0 Q ${side * spread * 0.3} ${-len * 0.5} ${side * spread} ${-len * 0.86}`,
      H * 0.022, i * 70);
    out += leaf({
      x: side * spread, y: -len * 0.86,
      rot: side * (18 + spread * 0.35), delay: 220 + i * 90, mature,
      body: `<path d="${paddleLeaf(H * 0.34, H * 0.085)}" fill="var(--leaf-${i % 3 === 0 ? 2 : 1})"/>
             <path d="M0 0 L0 ${-H * 0.34}" stroke="var(--leaf-3)" stroke-width="${H * 0.006}"
                   opacity=".55" fill="none"/>`
    });
  }
  return { html: out, young: 0.4 };
}

function fiddleLeafFig (H) {
  let out = stem(`M0 0 C 7 ${-H * 0.3} -7 ${-H * 0.66} 3 ${-H * 0.94}`, H * 0.024, 0, 'var(--trunk)');
  /* Uneven heights and sizes — a real fiddle fig is never symmetrical. */
  const leaves = [
    { t: 0.22, size: 0.20, rot: 52 },
    { t: 0.36, size: 0.24, rot: -44 },
    { t: 0.50, size: 0.19, rot: 58 },
    { t: 0.62, size: 0.26, rot: -40 },
    { t: 0.74, size: 0.21, rot: 46 },
    { t: 0.86, size: 0.24, rot: -34 },
    { t: 0.95, size: 0.15, rot: 14 }
  ];
  leaves.forEach((l, i) => {
    const size = H * l.size;
    out += leaf({
      x: l.rot > 0 ? 3 : -3, y: -H * l.t,
      rot: l.rot, delay: 140 + i * 115, mature: i >= 4,
      body: `<path d="${fiddleLeaf(size, size * 0.26)}" fill="var(--leaf-${i % 2 ? 1 : 2})"/>
             <path d="M0 ${-size * 0.05} L0 ${-size * 0.95}" stroke="var(--leaf-3)"
                   stroke-width="${size * 0.022}" opacity=".5" fill="none"/>`
    });
  });
  return { html: out, young: 0.38 };
}

function monstera (H) {
  const n = 8;
  let out = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const side = i % 2 ? 1 : -1;
    const spread = 8 + t * 40;
    const len = H * (0.36 + 0.44 * t);
    const size = H * (0.24 + 0.1 * t);
    const notches = i < 2 ? 0 : 2;
    out += stem(`M0 0 Q ${side * spread * 0.25} ${-len * 0.55} ${side * spread} ${-len}`,
      H * 0.022, i * 75);
    out += leaf({
      x: side * spread, y: -len,
      rot: side * (62 + spread * 0.42), delay: 240 + i * 100, mature: i >= 5,
      body: notches === 0
        ? `<path d="${ovalLeaf(size, size * 0.7)}" fill="var(--leaf-1)"/>
           <path d="M0 0 L0 ${-size}" stroke="var(--leaf-3)" stroke-width="${size * 0.035}" opacity=".45"/>`
        : monsteraLeaf(size, size * 0.82, notches)
    });
  }
  return { html: out, young: 0.42 };
}

function pothos (H) {
  /* Sits on a stand so the vines have somewhere to fall. The vines grow by
     drawing themselves on (stroke-dashoffset), then leaves appear along them. */
  let out = '';
  const vines = 4;
  for (let v = 0; v < vines; v++) {
    const x0 = -48 + v * 32;
    const sway = (v % 2 ? 1 : -1) * (26 + v * 7);
    const len = H * (0.98 + 0.3 * ((v + 1) % 3) / 2);
    const p1 = [x0 + sway, len * 0.34];
    const p2 = [x0 - sway * 0.5, len * 0.68];
    const p3 = [x0 + sway * 0.4, len];
    out += stem(`M${x0} 0 C ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`,
      3.4, v * 150, 'var(--stem)');

    const leaves = 6;
    for (let i = 0; i < leaves; i++) {
      const t = 0.14 + (i / (leaves - 1)) * 0.84;
      const q = cubic(t, [x0, 0], p1, p2, p3);
      out += leaf({
        x: q[0], y: q[1],
        rot: (i % 2 ? 132 : -132) + t * 26,
        delay: v * 150 + i * 90,
        mature: t > 0.4,
        body: `<path d="${heartLeaf(H * 0.11)}" fill="var(--leaf-${i % 3 === 0 ? 3 : i % 2 ? 1 : 2})"/>
               <path d="M0 0 L0 ${-H * 0.085}" stroke="var(--leaf-3)"
                     stroke-width="1.4" opacity=".4" fill="none"/>`
      });
    }
  }
  /* A short tuft sitting up in the pot itself. */
  for (let i = 0; i < 5; i++) {
    out += leaf({
      x: -30 + i * 15, y: -4, rot: -34 + i * 17, delay: i * 70,
      body: `<path d="${heartLeaf(H * 0.1)}" fill="var(--leaf-${i % 2 ? 1 : 2})"/>`
    });
  }
  return { html: out, young: 0.34, mount: 'shelf', trailing: true };
}

function rubberPlant (H) {
  let out = stem(`M0 0 C -5 ${-H * 0.32} 5 ${-H * 0.68} -2 ${-H * 0.95}`, H * 0.028, 0, 'var(--trunk-2)');
  const n = 8;
  for (let i = 0; i < n; i++) {
    const t = 0.14 + (i / (n - 1)) * 0.8;
    const side = i % 2 ? 1 : -1;
    const size = H * (0.25 + 0.07 * t);
    const wid = size * 0.44;
    out += leaf({
      x: side * 2, y: -H * t,
      rot: side * (56 + t * 14), delay: 150 + i * 120, mature: i >= 4,
      body: `<path d="${ovalLeaf(size, wid)}" fill="var(--pink-1)"/>
             <g transform="translate(0,${-size * 0.035}) scale(.8)">
               <path d="${ovalLeaf(size, wid)}" fill="var(--leaf-2)"/>
             </g>
             <path d="M0 ${-size * 0.06} L0 ${-size * 0.94}" stroke="var(--pink-2)"
                   stroke-width="${size * 0.03}" opacity=".85" fill="none"/>`
    });
  }
  /* The bright pink sheath at the growing tip. */
  out += leaf({
    x: -2, y: -H * 0.95, rot: 5, delay: 1050, mature: true,
    body: `<path d="${ovalLeaf(H * 0.13, H * 0.022)}" fill="var(--pink-0)"/>`
  });
  return { html: out, young: 0.38 };
}

function oliveTree (H) {
  /* A gnarled trunk, branches, then a canopy of small silver leaflets
     filled in ring by ring from the middle outward. */
  let out = stem(`M0 0 C -7 ${-H * 0.16} 9 ${-H * 0.3} 2 ${-H * 0.46} C -6 ${-H * 0.55} 5 ${-H * 0.6} 0 ${-H * 0.62}`,
    H * 0.034, 0, 'var(--trunk)');

  const branches = 5;
  for (let b = 0; b < branches; b++) {
    const ang = -90 + (b - (branches - 1) / 2) * 32;
    const rad = ang * Math.PI / 180;
    const bl = H * 0.22;
    const bx = Math.cos(rad) * bl;
    const by = -H * 0.62 + Math.sin(rad) * bl;
    out += stem(`M0 ${-H * 0.62} Q ${bx * 0.4} ${(-H * 0.62 + by) / 2} ${bx} ${by}`,
      H * 0.013, 150 + b * 80, 'var(--trunk)');
  }

  const cy = -H * 0.8, rx = H * 0.33, ry = H * 0.25;
  let k = 0;
  for (let ring = 0; ring < 5; ring++) {
    const count = 9 + ring * 9;
    const f = 0.24 + ring * 0.19;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ring * 0.55;
      const jitter = 1 - ((i * 7919) % 13) / 90;
      out += leaf({
        x: Math.cos(a) * rx * f * jitter,
        y: cy + Math.sin(a) * ry * f * jitter,
        rot: (a * 180 / Math.PI) + 90,
        delay: 240 + ring * 110 + i * 10,
        mature: ring >= 3,
        body: `<path d="${ovalLeaf(H * 0.085, H * 0.019)}"
                 fill="var(--olive-${k++ % 3 === 0 ? 2 : 1})"/>`
      });
    }
  }
  return { html: out, young: 0.55 };
}

const BUILDERS = { birdOfParadise, fiddleLeafFig, monstera, pothos, rubberPlant, oliveTree };

/* ------------------------------------------------------------------ the studio */

/** A 170 cm person, for scale. Drawn once per stage, revealed as the plant grows. */
function humanSilhouette () {
  const h = 170 * PX_PER_CM;             // 374 px
  const drawn = 358;                     // natural height of the path below
  const s = h / drawn;
  return `<g class="stage__human" transform="translate(372,${FLOOR_Y}) scale(${r(s, 3)})"
             aria-hidden="true">
            <circle cx="0" cy="-330" r="28"/>
            <path d="M-9 0 L-9 -150 L-24 -150 L-24 -252
                     C-24 -292 -15 -300 0 -300
                     C15 -300 24 -292 24 -252 L24 -150 L9 -150 L9 0 Z"/>
          </g>`;
}

/** Measuring rule up the side of the frame, ticked every 50 cm. */
function ruler (matureCm) {
  const top = FLOOR_Y - matureCm * PX_PER_CM;
  let ticks = '';
  for (let cm = 50; cm <= matureCm; cm += 50) {
    const y = FLOOR_Y - cm * PX_PER_CM;
    ticks += `<line x1="318" y1="${r(y)}" x2="331" y2="${r(y)}"/>
              <text x="336" y="${r(y + 4)}">${cm}</text>`;
  }
  return `<g class="stage__ruler" aria-hidden="true">
            <line x1="324" y1="${FLOOR_Y}" x2="324" y2="${r(top)}"/>
            ${ticks}
          </g>`;
}

/** Where the pot stands. The pot itself never changes — that consistency is
    what makes six different plants look like one photo shoot. */
const SHELF_BASE_Y = 178;                       // pot base when wall-mounted
const mountLift = mount => (mount === 'shelf' ? SHELF_BASE_Y - (FLOOR_Y - 2) : 0);

function pot (mount) {
  const lift = mountLift(mount);
  const onShelf = mount === 'shelf';

  const support = onShelf
    ? `<g class="stage__shelf">
         <rect x="26" y="${SHELF_BASE_Y}" width="286" height="13" rx="4"/>
         <path d="M60 ${SHELF_BASE_Y + 13} l16 22 h-16 Z" opacity=".55"/>
         <ellipse cx="${CENTRE_X + 4}" cy="${SHELF_BASE_Y - 1}" rx="72" ry="6"
                  fill="rgba(0,0,0,.18)"/>
       </g>`
    : `<ellipse class="stage__shadow" cx="${CENTRE_X + 6}" cy="${FLOOR_Y - 2}" rx="104" ry="13"/>`;

  return `${support}
    <g class="stage__pot" transform="translate(0,${lift})">
      <path d="M${CENTRE_X - 78} ${SOIL_Y - 4}
               C ${CENTRE_X - 80} ${SOIL_Y + 52} ${CENTRE_X - 58} ${FLOOR_Y - 2} ${CENTRE_X - 40} ${FLOOR_Y - 2}
               L ${CENTRE_X + 40} ${FLOOR_Y - 2}
               C ${CENTRE_X + 58} ${FLOOR_Y - 2} ${CENTRE_X + 80} ${SOIL_Y + 52} ${CENTRE_X + 78} ${SOIL_Y - 4} Z"
            fill="url(#potFill)"/>
      <ellipse cx="${CENTRE_X}" cy="${SOIL_Y - 4}" rx="78" ry="15" fill="var(--pot-rim)"/>
      <ellipse cx="${CENTRE_X}" cy="${SOIL_Y - 1}" rx="66" ry="11" fill="var(--soil)"/>
      <path d="M${CENTRE_X - 74} ${SOIL_Y + 10} C ${CENTRE_X - 62} ${SOIL_Y + 70} ${CENTRE_X - 44} ${FLOOR_Y - 10} ${CENTRE_X - 34} ${FLOOR_Y - 8}"
            fill="none" stroke="var(--pot-hi)" stroke-width="7" opacity=".55" stroke-linecap="round"/>
    </g>`;
}

/**
 * Build one complete stage for a product.
 * @param {object} p    product record from products.json
 * @param {string} uid  unique suffix so the gradient ids never collide
 */
function buildStage (p, uid) {
  const H = foliageHeight(p.heightMature);
  const built = BUILDERS[p.art](H);
  const lift = mountLift(built.mount);

  return `
<svg class="stage__svg" viewBox="0 0 440 640" role="img"
     aria-label="${p.name}, ${p.heightNow} cm today, growing to ${p.heightMature} cm">
  <defs>
    <linearGradient id="wall-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--stage-hi)"/>
      <stop offset=".55" stop-color="var(--stage-mid)"/>
      <stop offset="1" stop-color="var(--stage-lo)"/>
    </linearGradient>
    <linearGradient id="potFill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="var(--pot-hi)"/>
      <stop offset=".5" stop-color="var(--pot)"/>
      <stop offset="1" stop-color="var(--pot-lo)"/>
    </linearGradient>
    <linearGradient id="beam-${uid}" x1="0" y1="0" x2=".6" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".5"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="440" height="640" fill="url(#wall-${uid})"/>
  <rect class="stage__floor" y="${FLOOR_Y}" width="440" height="${640 - FLOOR_Y}"/>
  <path class="stage__beam" d="M40 0 L212 0 L118 ${FLOOR_Y} L-40 ${FLOOR_Y} Z" fill="url(#beam-${uid})"/>

  ${humanSilhouette()}
  ${ruler(p.heightMature)}
  ${pot(built.mount)}

  <g transform="translate(${CENTRE_X},${SOIL_Y + lift})">
    <g class="foliage${built.trailing ? ' foliage--trailing' : ''}" style="--young:${built.young}">
      ${built.html}
    </g>
  </g>
</svg>`;
}

/* Evaluate a cubic Bézier at t — used to sit pothos leaves on their vine. */
function cubic (t, p0, p1, p2, p3) {
  const u = 1 - t;
  const b0 = u * u * u, b1 = 3 * u * u * t, b2 = 3 * u * t * t, b3 = t * t * t;
  return [
    p0[0] * b0 + p1[0] * b1 + p2[0] * b2 + p3[0] * b3,
    p0[1] * b0 + p1[1] * b1 + p2[1] * b2 + p3[1] * b3
  ];
}
