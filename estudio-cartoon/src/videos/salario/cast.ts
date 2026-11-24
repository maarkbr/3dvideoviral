// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, INK, bodyFront, bodySide, swingKid, soldier, townsfolk, OFFICER, KID, PARENT, fxNote, fxBurst, fxSplash, fxStars, fxCreak, fxRing, fxBlob, fxShadow, fxContact, fxPlank, fxDrum, fxPuff,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, FILES, ROW_GAP, COUNT, PARK, SHOTS, SNAP, DROP0, DROP1, DROP_H, V3, front, marchPhase, stomp, deckY, dropW, dropU, shapeZ,
  smooth, clamp01, BridgeState,
} from "./story";
import { FILME0, KX, KZ, PX, PZ, RUA as RUA_F } from "./story";
import { W as TW } from "./tempos";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const SOLDIER = [0, 1, 2, 3].map((v) => soldier(v));
const BARE = [0, 1, 2, 3].map((v) => soldier(v, { hat: null }));
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const vOf = (i: number) => (i * 7 + (i >> 2)) % 4;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const SWAPS: Record<number, number[]> = { 4: [16.17, 17.3], 5: [19.48, 20.6], 6: [21.9, 23.7], 7: [29.4, 30.6], 8: [SNAP] };
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- crowd by shot ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };

const exprMarch = (id: number, t: number, i: number, tau: number): { expr: Expr; look: number } => {
  const lau = i % 3 === 0, whi = i % 5 === 1, L = LEAD;
  switch (id) {
    case 1: return { expr: lau ? "laugh" : whi ? "whistle" : "grin", look: 0 };
    case 2: case 3: return { expr: i % 4 === 3 ? "smile_closed" : i % 2 ? "neutral" : "stern", look: 0 };
    case 4: return t < 16.17 - L ? { expr: i % 2 ? "neutral" : "stern", look: 0 } : t < 17.3 - L ? { expr: lau ? "shock" : "nervous", look: 0 } : { expr: "neutral", look: 0 };
    case 5: return { expr: t < 19.48 - L ? "neutral" : t < 20.6 - L ? "grin" : i % 2 ? "laugh" : "grin", look: 0 };
    case 6: return { expr: (i === 2 && t > 21.9 - L) || (t > 23.7 - L && i % 4 === 1) ? "whistle" : t > 23.7 - L && lau ? "laugh" : "grin", look: 0 };
    case 7: return t < 29.4 - L ? { expr: lau ? "laugh" : "grin", look: 0 } : t < 30.6 - L ? { expr: i % 2 ? "nervous" : "grin", look: -1 } : { expr: "nervous", look: 0 };
    case 8: return { expr: tau < SNAP - L ? "nervous" : "shock", look: tau < SNAP + 0.6 ? -1 : 0 };
    default: return { expr: whi ? "whistle" : "grin", look: 0 };
  }
};

/** the marching column (shots 1-8, 13) */
const column = (id: number, t: number, b: BridgeState, cam: CamInfo, out: Stage) => {
  const s = SHOTS[id - 1], tau = s.tau(t);
  const stopT = SNAP + 0.3, walkT = id === 8 ? Math.min(tau, stopT) : tau;
  const F = front(walkT), ph = marchPhase(walkT), st = stomp(tau);
  const falling = id === 8 && tau >= DROP0;
  for (let i = 0; i < COUNT; i++) {
    const row = i >> 2, x0 = FILES[i & 3] + (hh(i) - 0.5) * 0.08, z = F + row * ROW_GAP + (hh(i, 2) - 0.5) * 0.1;
    let x = x0, y = Math.abs(z) <= 30 ? deckY(z, b) : D0;
    const who: Who = { i, o: SOLDIER[vOf(i)], okey: `s${vOf(i)}` };
    let { expr, look } = exprMarch(id, t, i, tau);
    let mode: "march" | "stand" | "fall" | "sit" = id === 8 && tau >= SNAP + 0.25 ? "stand" : "march";
    let tilt = 0;
    if (falling) {
      // the soldiers lag the falling deck a little (cartoon hang time), then sit in the water
      const lagY = D0 + b.bounce * shapeZ(z) - dropU(tau - 0.13) * DROP_H * dropW(z);
      const air = Math.max(0, lagY - y);
      y += air;
      const u = clamp01((tau - DROP0) / (DROP1 - DROP0));
      x = x0 + (hh(i, 3) - 0.5) * 0.7 * u;
      mode = tau < DROP1 + 0.13 ? "fall" : "sit";
      tilt = mode === "fall" ? (hh(i, 4) - 0.5) * 50 * u : 0;
      if (mode === "sit") expr = i % 3 ? "dazed" : "shock";
    }
    const view = viewOf(cam, x, z, 0, -1);
    const blink = expr !== "whistle" ? lidAt(t, i, SWAPS[id]) : 0;
    const fo: FrontOpts = { phase: mode === "march" ? ph : 0, expr, mode, look, blink, lift: 60 * st, tilt };
    // side views: the stance foot keeps pace with the column (0.8 m steps at 2 steps/s), foreshortened by the view
    const so: SideOpts = { phase: mode === "march" ? ph : 0, expr, mode: mode === "march" ? "march" : "stand", blink, stomp: st, stride: view.fs };
    out.places.push(person(cam, who, x, y, z, mode === "fall" || mode === "sit" ? { side: false, mirror: false } : view, fo, so));
    if (mode === "march" || mode === "stand") blob(out, x, y, z);
    // whistled notes drift up from whistlers near the lens
    if (expr === "whistle" && (id === 6 || id === 1 || id === 13) && cam.pos.distanceTo(tmp.set(x, y, z)) < 16) {
      for (let n = 0; n < 4; n++) {
        const age = ((t - 21.9 + n * 0.42 + hh(i, 5)) % 1.68) / 1.68;
        const pop = Math.min(1, age * 7) * (age > 0.82 ? (1 - age) / 0.18 : 1);
        if (pop <= 0.02) continue;
        const kind = (n + i) % 2, side = 0.16 + 0.32 * age + 0.05 * Math.sin(age * 9 + n);
        out.fx.push({ key: `note${kind}`, cw: 220, ch: 260, draw: (p) => fxNote(p, kind), x: x + cam.right.x * side, y: y + 1.5 + 0.85 * age, z: z + cam.right.z * side - 0.1,
          w: 0.17 * pop, h: 0.2 * pop, rot: 0.3 * Math.sin(age * 6 + n) });
      }
    }
  }
};

const sitters = (cam: CamInfo, t: number, out: Stage, spots: [number, number, number][], exprs: (i: number) => Expr, stars: (i: number) => boolean, water: boolean) => {
  spots.forEach(([x, y, z], i) => {
    const bare = i % 3 === 1;
    const v = vOf(i + 3), who: Who = { i, o: bare ? BARE[v] : SOLDIER[v], okey: `${bare ? "b" : "s"}${v}` };
    const expr = exprs(i), bob = water ? 0.03 * Math.sin(t * 2.2 + i) : 0;
    out.places.push(person(cam, who, x, y + bob, z, { side: false, mirror: false }, { mode: "sit", expr, blink: lidAt(t, i), look: 0 }, {}));
    if (stars(i)) {
      const u = (t * 0.9 + hh(i)) % 1;
      out.fx.push({ key: `stars${q(u, 30)}`, cw: 420, ch: 210, draw: (p) => fxStars(p, q(u, 30)), x, y: y + bob + 1.3, z, w: 0.75, h: 0.375 });
    }
    if (water) {
      const u = ((t + hh(i, 7) * 2) % 2.2) / 2.2;
      out.fx.push({ key: `ring${q(u, 30)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, q(u, 30)), x, y: 0.03, z, w: 2.0, h: 2.0, flat: true });
      // darker water right where the body meets the surface (only the front arc shows below the card)
      out.fx.push({ key: `blob|contact|${WATERLINE}`, cw: 128, ch: 128, draw: (p) => fxContact(p, WATERLINE), x, y: 0.034 + bob * 0.3, z, w: 0.7, h: 0.5, flat: true });
      if (bare) out.fx.push({ key: "shako", cw: 200, ch: 200, draw: shakoAlone, x: x + 0.55 + 0.3 * hh(i, 8), y: 0.12 + 0.03 * Math.sin(t * 2 + i), z: z - 0.3, w: 0.42, h: 0.42, rot: -0.5 + hh(i, 6) });
    } else {
      out.fx.push({ key: "puddle", cw: 300, ch: 150, draw: puddle, x, y: D0 + 0.02, z: z - 0.05, w: 1.5, h: 0.75, flat: true });
      blob(out, x, y, z, 1.05, 0.8);
    }
  });
};
const WATERLINE = hexOf([0.3, 0.36, 0.52], 1);
/** flotsam in the near water of the river shots (9-10), so the bottom of the frame is not empty: hats, planks, a drum.
 *  World positions 2.5-5 m in front of both river cameras (z -27 / -25.4 looking +z); half under the surface, bobbing. */
const FLOAT: { kind: "shako" | "plank" | "drum"; x: number; z: number; s: number; r: number }[] = [
  // round-4 river cameras sit at z -24.6 / -24.2: the two nearest pieces were 0.7-1.5 m from the lens (cut-off blobs)
  { kind: "shako", x: -0.25, z: -22.5, s: 0.46, r: 0.6 }, // (drum removed: cut by the frame edge it read as a blob)
  { kind: "shako", x: 0.95, z: -24.6, s: 0.42, r: 0.25 }, // (near plank removed: cut by the frame edge)
];
const flotsam = (t: number, out: Stage) =>
  FLOAT.forEach((f, i) => {
    const bob = 0.03 * Math.sin(t * 1.9 + i * 1.7), r = f.r + 0.08 * Math.sin(t * 1.3 + i);
    const [cw, ch, draw, ar] = f.kind === "shako" ? [200, 200, shakoAlone, 1] as const : f.kind === "plank" ? [320, 110, fxPlank, 110 / 320] as const : [260, 240, fxDrum, 240 / 260] as const;
    const w = f.s, h = f.s * ar;
    out.fx.push({ key: f.kind, cw, ch, draw, x: f.x, y: 0.28 * h + bob, z: f.z, w, h, rot: r });
    out.fx.push({ key: `ring${q(((t * 0.45 + i * 0.3) % 1), 30)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, q(((t * 0.45 + i * 0.3) % 1), 30)), x: f.x, y: 0.03, z: f.z, w: 1.1 * f.s + 0.5, h: 1.1 * f.s + 0.5, flat: true });
  });
const shakoAlone = (p: Pen) => {
  p.poly([[42, 160], [158, 160], [166, 50], [34, 50]], "#3a3d47", 8);
  p.ell(100, 158, 60, 10, "#16171b", 7, 0, 180);
  p.ell(100, 96, 14, 12, "#c9ccd2", 6);
  p.ell(100, 36, 14, 14, "#2b7a4b", 6);
};
const puddle = (p: Pen) => { p.ell(150, 75, 140, 58, "#6f97c6", 0); p.ell(120, 62, 60, 16, "#a9c9ea", 0); };

/** the extras hold still and only cheer on cue: "pride of the whole town", "like a crowd of tourists" */
const CHEER: [number, number][] = [[8.01 - LEAD, 9.45], [65.96 - LEAD, 67.5]];
const townsfolkAt = (cam: CamInfo, t: number, out: Stage) => {
  const spots: [number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const bank = i < 13 ? -1 : 1, k = i % 13, sx = k % 2 ? 1 : -1;
    spots.push([sx * (5.2 + (k >> 1) * 1.7 + hh(i) * 0.6), bank * (31.6 + hh(i, 2) * 3.2)]);
  }
  const on = CHEER.some(([a, b]) => t >= a && t < b);
  spots.forEach(([x, z], i) => {
    const kid = i % 5 === 2, o = kid ? KID : FOLK[i % 6], hop = kid && on ? Math.max(0, Math.sin(t * 7 + i)) * 0.18 : 0;
    const who: Who = { i: i + 200, o, okey: kid ? "kid" : `f${i % 6}` };
    const expr: Expr = (["smile", "grin", "laugh", "smile_closed"] as Expr[])[i % 4];
    const fo: FrontOpts = { mode: "stand", expr, wave: i % 3 === 2 || !on ? undefined : q(Math.sin(t * 9 + i * 1.3), 30), blink: lidAt(t, i + 40) };
    out.places.push(person(cam, who, x, D0 + hop, z, { side: false, mirror: false }, fo, {}, kid ? 0.72 : 1));
    blob(out, x, D0, z, kid ? 0.72 : 1, hop > 0 ? 0.6 : 1);
  });
};

/** soldiers strolling out of step across the rebuilt bridge (shot 15): own pace kept (sound), poses on ones */
const tourists = (cam: CamInfo, t: number, out: Stage) => {
  const t0 = 62.08;
  for (let i = 0; i < 24; i++) {
    const sp = 0.55 + hh(i) * 0.5, z = -4 + (i / 24) * 28 + hh(i, 2) * 1.5 - sp * (t - t0), x = (hh(i, 3) - 0.5) * 4.0;
    const bare = i % 5 === 2, v = vOf(i), who: Who = { i, o: bare ? BARE[v] : SOLDIER[v], okey: `${bare ? "b" : "s"}${v}` };
    const prop = i % 7 === 3 ? "icecream" : bare ? "shako" : null;
    const lick = prop === "icecream" && (t * 0.7 + hh(i, 4)) % 1 < 0.45;
    const expr: Expr = lick ? "lick" : (["smile", "smile_closed", "grin", "smile"] as Expr[])[i % 4];
    const phase = q(((t - t0) * sp / 1.4 + hh(i, 5)) % 1, 120); // cadence sp/1.4 Hz unchanged = 0.7 m per step
    const look = Math.round(Math.sin(t * 0.8 + i * 1.7) * 1.2);
    const fo: FrontOpts = { mode: "stroll", phase, expr, look: Math.max(-1, Math.min(1, look)), prop, blink: lidAt(t, i) };
    const view = viewOf(cam, x, z, 0, -1);
    const so: SideOpts = { mode: "march", phase, expr, stomp: 0.55, stride: 0.875 * view.fs };
    out.places.push(person(cam, who, x, D0, z, view, fo, so));
    blob(out, x, D0, z);
  }
};

// officer hammering the new rule onto a sign at the bridge end (shot 14)
export const HITS = [59.79, 60.33, 61.69];
export const SIGN_AT: V3 = [2.25, D0, -30.9];
/** 0 = hammer up, 1 = struck. Reference action timing: 4 f wind-up, held ~7 f at the top, a 1-frame strike on the word */
const hammerK = (t: number) => {
  let k = 1;
  for (const th of HITS) {
    const n = (t - th) * FPS; // frames to contact
    if (n >= -11 && n < -7) k = Math.min(k, 1 - smooth((n + 11) / 4));
    else if (n >= -7 && n < 0) k = 0;
  }
  return k;
};
const officer = (cam: CamInfo, t: number, out: Stage) => {
  const fo: FrontOpts = { mode: "stand", expr: "stern", prop: ["hammer", q(hammerK(t), 30)], blink: lidAt(t, 99), facing: 1 };
  out.places.push(person(cam, { i: 99, o: OFFICER, okey: "off" }, 3.35, D0, -31.55, { side: false, mirror: false }, fo, {}));
  blob(out, 3.35, D0, -31.55, 1.1);
  for (const th of HITS) if (t >= th && t < th + 5 / FPS) {
    const u = (t - th) / (5 / FPS);
    out.fx.push({ key: `burst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x: 2.95, y: D0 + 1.55, z: -31.0, w: 0.9, h: 0.9 });
  }
};

// swing in the park (shot 12): pushes land at the back end of every swing, the arc grows
export const SWING_T = 1.55, PUSH0 = 48.79;
const pushes = [0, 1, 2, 3].map((k) => PUSH0 + k * SWING_T);
export const swingAmp = (t: number) => 6 + pushes.reduce((a, tp) => a + 11 * smooth((t - tp) / 0.3), 0);
export const swingAngle = (t: number) => -((swingAmp(t) * Math.PI) / 180) * Math.cos((2 * Math.PI * (t - PUSH0)) / SWING_T);
/** the swing kid's back (seat + ~.12 m, ~8 cm behind the rope) in world space when the swing is at angle th */
const kidBack = (th: number): [number, number] => {
  const lx = -0.083, ly = -2.174; // local to the swing card (pivot at the origin), card yawed by PI
  return [PARK[0] - (lx * Math.cos(th) - ly * Math.sin(th)), PARK[1] + 2.88 + lx * Math.sin(th) + ly * Math.cos(th)];
};
/** where the parent stands for push k: hands reach the kid's back at the back of the arc with the arms ~ straight */
const pushSpot = (k: number) => {
  const A = (swingAmp(pushes[k]) * Math.PI) / 180, [bx, by] = kidBack(-A);
  const cy = 975 - (by - D0) / SU, dy = cy - 515, dx = Math.sqrt(Math.max(120 * 120, 222 * 222 - dy * dy));
  return { px: bx + (53 + dx) * SU, hand: [300 + 53 + dx, cy] as [number, number] };
};
const park = (cam: CamInfo, t: number, out: Stage) => {
  const th = swingAngle(t), vel = Math.sin((2 * Math.PI * (t - PUSH0)) / SWING_T);
  const A = (swingAmp(t) * Math.PI) / 180, kick = q(0.35 + 0.55 * vel, 40);
  const expr: Expr = A < 0.35 ? "smile" : A < 0.6 ? "grin" : "laugh";
  const light = light2D(cam, true), lid = lidAt(t, 78);
  out.places.push({ key: `swing|${kick}|${expr}|${q(light)}|${lid}`, geo: "swing", x: PARK[0], y: PARK[1] + 2.88, z: PARK[2], yaw: Math.PI, roll: th,
    draw: (p) => swingKid(p, KID, kick, expr, light, lid), size: [490, 1610, 0.7] });
  const push = Math.max(0, ...pushes.map((tp) => 1 - Math.abs(t - tp + 0.05) / 0.32));
  // stand at this push's spot; step back to the next spot between pushes (the arc grows after every push)
  let k = 0;
  while (k < pushes.length - 1 && t > pushes[k] + 0.35) k++;
  const cur = pushSpot(k), prev = pushSpot(Math.max(0, k - 1));
  const step = k > 0 ? smooth((t - (pushes[k - 1] + 0.35)) / (SWING_T - 0.7)) : 1;
  const px = prev.px + (cur.px - prev.px) * step, pz = PARK[2] + 0.1;
  const so: SideOpts = { mode: "push", pose: q(push, 40), expr: push > 0.3 ? "grin" : "smile", blink: lidAt(t, 77), hand: cur.hand };
  out.places.push({ ...person(cam, { i: 77, o: PARENT, okey: "parent" }, px, D0, pz, { side: true, mirror: true }, {}, so), mirror: false, yaw: Math.PI });
  blob(out, px, D0, pz);
};


// ---------------- amostra "82% das famílias" ----------------
const VOCE: Outfit = { jacket: "#2f6fd0", pants: "#33384a", boots: "#4a3020", hat: "hair", hair: "#6b4026" };
const MAE: Outfit = { jacket: "#c0533c", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#3a2418", dress: "#c0533c" };
const rr = (x0: number, y0: number, x1: number, y1: number, r: number): [number, number][] => {
  const pts: [number, number][] = [];
  const c: [number, number, number, number][] = [[x1 - r, y0 + r, -90, 0], [x1 - r, y1 - r, 0, 90], [x0 + r, y1 - r, 90, 180], [x0 + r, y0 + r, 180, 270]];
  for (const [cx, cy, a0, a1] of c) for (let k = 0; k <= 6; k++) { const a = ((a0 + (a1 - a0) * k / 6) * Math.PI) / 180; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
};
const txt = (p: Pen, s: string, x: number, y: number, px: number, col: string) => { const g = p.g; g.font = `900 ${px}px Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y); };
/** nota de dinheiro (400 x 200) */
const fxNota = (p: Pen) => { p.poly(rr(10, 10, 390, 190, 18), "#7cc47a", 10); p.ell(200, 100, 50, 50, "#a8dca2", 7); txt(p, "R$", 200, 102, 46, "#2d6b3a"); p.poly(rr(34, 34, 90, 166, 10), "#5fae5e", 0); p.poly(rr(310, 34, 366, 166, 10), "#5fae5e", 0); };
/** geladeira (420 x 900) */
const fxGeladeira = (p: Pen) => {
  p.poly(rr(14, 14, 406, 886, 46), "#eef3f7", 14); p.stroke([[18, 330], [402, 330]], 12);
  p.poly(rr(330, 120, 352, 270, 10), "#9aa6b4", 8); p.poly(rr(330, 400, 352, 620, 10), "#9aa6b4", 8);
  p.poly(rr(40, 40, 120, 300, 30), "#ffffff", 0); txt(p, "NOVA!", 210, 760, 64, "#d8343b");
};
/** parcela "n/10" (260 x 170) */
const fxParcela = (p: Pen, n: number) => { p.poly(rr(10, 10, 250, 160, 22), n < 10 ? "#f4c224" : "#e2453c", 10); txt(p, `${n}/10`, 130, 88, 66, "#241726"); };
/** fatura (520 x 720) */
const fxFatura = (p: Pen) => {
  p.poly(rr(12, 12, 508, 708, 26), "#fbf8f0", 12); p.poly(rr(12, 12, 508, 150, 26), "#2f6fd0", 0); txt(p, "FATURA", 260, 84, 74, "#ffffff");
  for (let k = 0; k < 5; k++) p.poly(rr(60, 190 + k * 46, 460 - (k % 3) * 70, 212 + k * 46, 8), "#d5d9e0", 0);
  p.poly(rr(46, 430, 474, 520, 18), "#3fae5a", 8); txt(p, "MÍNIMO", 260, 478, 60, "#ffffff");
  p.poly(rr(46, 548, 474, 668, 18), "#d8343b", 8); txt(p, "ROTATIVO", 260, 592, 50, "#ffffff"); txt(p, "+400% a.a.", 260, 640, 40, "#ffe4a0");
};
const fxSuor = (p: Pen) => { p.poly([[60, 10], [100, 90], [96, 130], [60, 150], [24, 130], [20, 90]], "#9fd8ff", 8); };
const RUA_EU = 56;
const amostra = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const Z = 60, eu = (x: number, z: number, fo: FrontOpts, sc = 1) => { out.places.push(person(cam, { i: 500, o: VOCE, okey: "voce" }, x, D0, z, { side: false, mirror: false }, { blink: lidAt(t, 500), ...fo }, {}, sc)); blob(out, x, D0, z, sc); };
  const t0 = SHOTS[id - 1].a / FPS, u = t - t0;
  if (id === 16) { // o salário voa embora
    eu(0, Z, { mode: "stand", expr: "shock", wave: q(Math.sin(t * 6) * 0.6, 30) });
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7, r = 0.5 + 0.35 * (i % 3) + u * 0.7, h = D0 + 1.2 + (i % 4) * 0.3 + u * 0.6;
      out.fx.push({ key: "nota", cw: 400, ch: 200, draw: fxNota, x: Math.cos(a) * r, y: h, z: Z - 0.2 + Math.sin(a) * 0.4 * r, w: 0.42, h: 0.21, rot: q(Math.sin(a * 3 + u * 2) * 0.8, 30) });
    }
  }
  if (id === 17) { // a rua: 8 em cada 10 casas
    for (let i = 0; i < 22; i++) {
      const sx = i % 2 ? 1 : -1, z = 50 + (i >> 1) * 2.6 + hh(i, 3) * 0.8, x = sx * (3.3 + hh(i, 4) * 1.6);
      const kid = i % 6 === 4, o = kid ? KID : FOLK[i % 6];
      const expr: Expr = (["nervous", "neutral", "pained", "nervous", "dazed", "neutral"] as Expr[])[i % 6];
      out.places.push(person(cam, { i: i + 300, o, okey: kid ? "kid" : `f${i % 6}` }, x, D0, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, i + 300) }, {}, kid ? 0.72 : 1));
      blob(out, x, D0, z, kid ? 0.72 : 1);
    }
    eu(0.2, RUA_EU, { mode: "stand", expr: "nervous" });
  }
  if (id === 18) { // a geladeira em 10x
    eu(-0.62, Z, { mode: "stand", expr: "grin", wave: q(0.5 + 0.3 * Math.sin(t * 5), 30) });
    out.fx.push({ key: "geladeira", cw: 420, ch: 900, draw: fxGeladeira, x: 0.55, y: D0 + 0.98, z: Z + 0.15, w: 0.92, h: 1.96 });
    blob(out, 0.55, D0, Z + 0.15, 1.3);
    for (let n = 1; n <= 10; n++) {
      const k = Math.min(1, Math.max(0, (u - (n - 1) * 0.06) / 0.5)), e = 1 - (1 - k) ** 3;
      const tx = 1.05 - ((n - 1) % 2) * 0.3, ty = D0 + 0.5 + Math.floor((n - 1) / 2) * 0.22;
      out.fx.push({ key: `parc${n}`, cw: 260, ch: 170, draw: (p) => fxParcela(p, n), x: tx + 0.9 * (1 - e), y: ty + 0.8 * (1 - e), z: Z - 0.2, w: 0.27, h: 0.18, rot: q((1 - e) * 1.2, 30) });
    }
  }
  if (id === 19) { // a fatura e o rotativo
    eu(-0.25, Z, { mode: "stand", expr: "nervous", headTilt: -0.06 });
    out.fx.push({ key: "fatura", cw: 520, ch: 720, draw: fxFatura, x: 0.3, y: D0 + 1.3 + Math.sin(t * 9) * 0.01, z: Z - 0.4, w: 0.5, h: 0.69, rot: 0.08 });
    const s1 = (u * 0.8) % 1;
    out.fx.push({ key: "suor", cw: 120, ch: 160, draw: fxSuor, x: -0.5, y: D0 + 2.05 - s1 * 0.25, z: Z - 0.3, w: 0.09, h: 0.12 });
  }
  if (id === 20) { // a família na porta de casa
    const fam: [Outfit, string, number, number, Expr, number][] = [[MAE, "mae", -5.0, Z + 2.6, "pained", 1], [VOCE, "voce", -5.0, Z + 3.6, "dazed", 1], [KID, "kid", -4.8, Z + 4.4, "nervous", 0.72]];
    fam.forEach(([o, k, x, z, expr, sc], i) => { out.places.push(person(cam, { i: 600 + i, o, okey: k }, x, D0, z, { side: false, mirror: false }, { mode: "sit", expr, blink: lidAt(t, 600 + i) }, {}, sc)); blob(out, x, D0, z, sc); });
    for (let i = 0; i < 4; i++) out.fx.push({ key: "nota", cw: 400, ch: 200, draw: fxNota, x: -3.8 + i * 0.5, y: D0 + 0.02, z: Z + 2.2 + (i % 2) * 0.6, w: 0.36, h: 0.18, flat: true, rot: i * 0.9 });
  }
};

// ================= FILME "O Salário que Já Chega Gasto" =================
const JES: Outfit = { jacket: "#6fc7b9", pants: "#5aa99d", boots: "#f2f4f2", hat: "hair", hair: "#3b2416" };
const MARCOS: Outfit = { jacket: "#8d939c", pants: "#2f3442", boots: "#3a2a22", hat: "hair", hair: "#241812", moustache: "#241812" };
const BIA: Outfit = { jacket: "#eef1f6", pants: "#2f4f8f", boots: "#f4f1ea", hat: "hair", hair: "#4a2e1c", build: "kid" };
const k3 = (x: number, y: number, z: number) => [KX + x, D0 + y, KZ + z] as const;
const r3 = (x: number, y: number, z: number) => [x, D0 + y, RUA_F + z] as const;
const p3 = (x: number, y: number, z: number) => [PX + x, D0 + y, PZ + z] as const;
const card = (out: Stage, key: string, cw: number, ch: number, draw: (p: Pen) => void, pos: readonly [number, number, number], w: number, h: number, extra: Partial<FxPlace> = {}) =>
  out.fx.push({ key, cw, ch, draw, x: pos[0], y: pos[1], z: pos[2], w, h, ...extra });
/** aparece com uma pequena antecipação e assentamento (0 -> 1) */
const surge = (tf: number, t0: number, d = 0.35) => { const u = clamp01((tf - t0) / d); return u <= 0 ? 0 : u >= 1 ? 1 : 1 - (1 - u) ** 3 + Math.sin(Math.PI * u) * 0.12; };
const exprAt = (tf: number, lista: [number, Expr][]) => { let e = lista[0][1]; for (const [ts, x] of lista) if (tf >= ts - LEAD) e = x; return e; };
// --- desenhos dos adereços (canvas, traço do kit) ---
const fxCelular = (p: Pen, ruim: boolean) => {
  p.poly(rr(10, 10, 230, 430, 34), "#1d2230", 12); p.poly(rr(26, 40, 214, 400, 14), ruim ? "#fbe3e3" : "#eaf6ef", 0);
  if (!ruim) { p.poly(rr(38, 80, 202, 190, 14), "#ffffff", 6); txt(p, "Pix recebido", 120, 112, 22, "#2d6b3a"); txt(p, "SALÁRIO", 120, 148, 30, "#241726"); txt(p, "+ R$", 120, 176, 22, "#3fae5a"); }
  else { p.poly(rr(38, 80, 202, 230, 14), "#d8343b", 6); txt(p, "AVISO", 120, 112, 26, "#ffffff"); txt(p, "seu nome foi", 120, 150, 20, "#ffffff"); txt(p, "NEGATIVADO", 120, 184, 26, "#ffe4a0"); }
};
const MESES = ["OUTUBRO", "SETEMBRO", "AGOSTO", "JULHO", "JUNHO", "MAIO", "ABRIL", "MARÇO"];
const fxCalendario = (p: Pen, mes: string, marca: boolean) => {
  p.poly(rr(10, 30, 430, 560, 18), "#fbf8f0", 12); p.poly(rr(10, 30, 430, 150, 18), mes === "MARÇO" ? "#d8343b" : "#2f6fd0", 0);
  p.ell(140, 30, 14, 14, "#9aa3ae", 6); p.ell(300, 30, 14, 14, "#9aa3ae", 6); txt(p, mes, 220, 92, 62, "#ffffff");
  for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) p.poly(rr(34 + j * 56, 178 + i * 74, 78 + j * 56, 236 + i * 74, 6), "#e6e1d6", 0);
  if (marca) { p.g.strokeStyle = "#d8343b"; p.g.lineWidth = 12; p.g.beginPath(); p.g.ellipse(220, 360, 170, 140, -0.1, 0, Math.PI * 2); p.g.stroke(); }
};
const fxRelogio = (p: Pen, a: number) => { p.ell(150, 150, 135, 135, "#fbf8f0", 12); for (let k = 0; k < 12; k++) { const r = (k * Math.PI) / 6; p.stroke([[150 + Math.cos(r) * 105, 150 + Math.sin(r) * 105], [150 + Math.cos(r) * 120, 150 + Math.sin(r) * 120]], 8); }
  p.stroke([[150, 150], [150 + Math.cos(a - Math.PI / 2) * 95, 150 + Math.sin(a - Math.PI / 2) * 95]], 9); p.stroke([[150, 150], [150 + Math.cos(a / 12 - Math.PI / 2) * 60, 150 + Math.sin(a / 12 - Math.PI / 2) * 60]], 14); };
const fxEtiqueta = (p: Pen, t1: string, t2: string, cor: string) => { p.poly(rr(10, 10, 330, 190, 26), cor, 10); txt(p, t1, 170, 72, 52, "#241726"); txt(p, t2, 170, 140, 34, "#241726"); };
const fxIcone = (p: Pen, k: number) => {
  p.ell(110, 100, 96, 90, "#ffffff", 10); p.poly([[80, 180], [110, 230], [130, 182]], "#ffffff", 0);
  if (k === 0) { p.poly(rr(46, 64, 174, 140, 12), "#2f6fd0", 7); p.poly(rr(62, 84, 96, 108, 4), "#e6b04a", 0); }
  if (k === 1) { for (let j = 0; j < 3; j++) p.poly(rr(56 + j * 8, 52 + j * 8, 152 + j * 8, 142 + j * 8, 6), j === 2 ? "#ffffff" : "#ede3c8", 6); }
  if (k === 2) { p.poly(rr(44, 96, 176, 132, 12), "#e2453c", 7); p.poly(rr(70, 70, 150, 100, 10), "#e2453c", 7); p.ell(76, 134, 14, 14, "#241726", 0); p.ell(146, 134, 14, 14, "#241726", 0); }
  if (k === 3) { p.ell(110, 100, 60, 60, "#e2453c", 0); txt(p, "!", 110, 104, 90, "#ffffff"); }
};
const fxPrecoNota = (p: Pen) => { fxNota(p); p.stroke([[330, 30], [380, -10]], 6); };
const fxTag = (p: Pen) => { p.poly([[20, 60], [70, 14], [250, 14], [250, 106], [70, 106]], "#f4c224", 10); p.ell(62, 60, 12, 12, "#ffffff", 6); txt(p, "PREÇO", 160, 62, 40, "#241726"); };
const fxEnvelope = (p: Pen, ph: number, perna: boolean) => {
  if (perna) { const a = Math.sin(ph * Math.PI * 2) * 30; p.stroke([[120, 170], [120 + a, 250]], 9); p.stroke([[200, 170], [200 - a, 250]], 9); }
  p.poly(rr(20, 30, 300, 180, 12), "#f6efdc", 10); p.path([[20, 30], [160, 120], [300, 30]], false); p.g.strokeStyle = INK; p.g.lineWidth = 8; p.g.stroke(); txt(p, "+ aumento", 160, 150, 30, "#2d6b3a");
};
const fxBoletos = (p: Pen, ph: number) => {
  const a = Math.sin(ph * Math.PI * 2) * 40; p.stroke([[110, 210], [110 + a, 300]], 10); p.stroke([[210, 210], [210 - a, 300]], 10);
  for (let j = 0; j < 4; j++) p.poly(rr(30 + j * 6, 30 + j * 40, 290 + j * 6, 110 + j * 40, 8), j % 2 ? "#ffe1e1" : "#fff7e8", 8);
  txt(p, "PARCELAS", 165, 190, 34, "#d8343b");
};
const fxCaixa = (p: Pen) => { p.poly(rr(10, 40, 330, 200, 10), "#b98a5a", 10); p.poly(rr(10, 10, 330, 60, 8), "#a77746", 10); txt(p, "DÍVIDAS", 170, 128, 48, "#ffffff"); };
const fxFaturaR = (p: Pen) => { p.poly(rr(10, 10, 250, 330, 12), "#fbf8f0", 10); p.poly(rr(10, 10, 250, 70, 12), "#d8343b", 0); txt(p, "FATURA", 130, 42, 34, "#ffffff"); for (let k = 0; k < 4; k++) p.poly(rr(34, 100 + k * 40, 220 - (k % 2) * 50, 116 + k * 40, 4), "#d5d9e0", 0); txt(p, "VENCIDA", 130, 288, 32, "#d8343b"); };
const fxCarimbo = (p: Pen) => { p.g.strokeStyle = "#d8343b"; p.g.lineWidth = 16; p.g.strokeRect(20, 20, 600, 160); txt(p, "NEGATIVADO", 320, 104, 104, "#d8343b"); };
const fxContra = (p: Pen) => { p.poly(rr(10, 10, 330, 230, 14), "#ffffff", 10); txt(p, "CONTRACHEQUE", 170, 58, 34, "#2f6fd0"); txt(p, "AUMENTO", 170, 130, 50, "#3fae5a"); txt(p, "↑", 170, 190, 60, "#3fae5a"); };
const fxDezX = (p: Pen) => { p.poly(rr(10, 10, 300, 180, 24), "#f4c224", 10); txt(p, "10x", 155, 80, 78, "#241726"); txt(p, "no cartão", 155, 145, 32, "#241726"); };
const fxEmprest = (p: Pen) => { p.poly(rr(10, 10, 330, 180, 24), "#ffffff", 10); txt(p, "EMPRÉSTIMO", 170, 66, 40, "#2f6fd0"); txt(p, "1/12", 170, 130, 54, "#241726"); };

const filme = (id: number, t: number, cam: CamInfo, out: Stage) => {
  const tf = t - FILME0 / FPS; // segundos do filme
  const pessoa = (i: number, o: Outfit, okey: string, pos: readonly [number, number, number], fo: FrontOpts, sc = 1, sombra = true) => {
    out.places.push(person(cam, { i, o, okey }, pos[0], pos[1], pos[2], { side: false, mirror: false }, { blink: lidAt(t, i), ...fo }, {}, sc));
    if (sombra) blob(out, pos[0], D0, pos[2], sc);
  };
  const jes = (pos: readonly [number, number, number], fo: FrontOpts) => pessoa(700, JES, "jes", pos, fo);
  const cel = (ruim: boolean, pos: readonly [number, number, number]) => card(out, `cel${ruim ? 1 : 0}`, 240, 440, (p) => fxCelular(p, ruim), pos, 0.2, 0.37, { rot: -0.12 });
  if (id === 16 || id === 17) {
    const ruim = tf >= TW(1, "nome") - LEAD;
    const e = id === 16 ? exprAt(tf, [[0, "smile"], [TW(1, "maior"), "grin"], [TW(1, "nome"), "shock"], [TW(1, "devedores"), "nervous"]]) : "dazed";
    jes(k3(0.75, 0, 1.0), { mode: "stand", expr: e, headTilt: id === 17 ? -0.05 : 0 });
    cel(ruim, k3(0.5, 1.22, 0.72));
    if (ruim && tf < TW(1, "nome") + 0.25) { const u = (tf - TW(1, "nome") + LEAD) / 0.25; card(out, `burst${q(u, 30)}`, 500, 500, (p) => fxBurst(p, q(u, 30), "#ffd2d2"), k3(0.5, 1.25, 0.6), 0.6, 0.6); }
    if (id === 17) {
      pessoa(701, MARCOS, "marcos", k3(-1.7, 0, 1.7), { mode: "stand", expr: tf > TW(2, "única") ? "nervous" : "neutral", look: 1 });
      pessoa(702, BIA, "bia", k3(-0.9, 0, 2.0), { mode: "stand", expr: "neutral", look: 1 }, 0.72);
    }
  }
  if (id === 18 || id === 28) { // a rua: indo trabalhar (manhã) / voltando para casa (entardecer)
    const volta = id === 28, n = volta ? 16 : 26;
    for (let i = 0; i < n; i++) {
      const sp = (volta ? 0.35 : 0.6) + hh(i, 21) * 0.35, dir = volta ? -1 : 1;
      const z = -2.5 + (i / n) * 30 + hh(i, 22) * 2 + dir * sp * (tf - (volta ? TW(13, "e") : TW(3, "o"))), x = (i % 2 ? 1 : -1) * (1.2 + hh(i, 23) * 3.2);
      const kid = i % 7 === 3, o = kid ? KID : FOLK[i % 6], phase = q(((tf * sp) / 1.4 + hh(i, 24)) % 1, 120);
      const expr: Expr = volta ? (["dazed", "neutral", "pained", "neutral"] as Expr[])[i % 4] : (["neutral", "smile", "neutral", "smile_closed"] as Expr[])[i % 4];
      const view = viewOf(cam, x, RUA_F + z, 0, dir);
      const fo: FrontOpts = { mode: "stroll", phase, expr, blink: lidAt(t, i + 800) };
      const so: SideOpts = { mode: "march", phase, expr, stomp: 0.5, stride: 0.8 * view.fs };
      out.places.push({ ...person(cam, { i: i + 800, o, okey: kid ? "kid" : `f${i % 6}` }, x, D0, RUA_F + z, view, fo, so, kid ? 0.72 : 1) });
      blob(out, x, D0, RUA_F + z, kid ? 0.72 : 1);
      if (volta && i % 4 === 1) { const k = surge(tf, TW(13, "quase") + (i >> 2) * 0.18); if (k > 0) card(out, "ico3", 220, 240, (p) => fxIcone(p, 3), [x, D0 + 2.45, RUA_F + z], 0.42 * k, 0.46 * k); }
    }
  }
  if (id === 19) { // o calendário volta até março; o relógio gira ao contrário
    const u = clamp01((tf - TW(4, "volta")) / 1.6), m = MESES[Math.min(7, Math.floor(u * 7.999))];
    card(out, `cal${m}`, 440, 580, (p) => fxCalendario(p, m, false), k3(0.95, 1.62, 2.4), 0.56, 0.74);
    const a = q(-(Math.max(0, tf - TW(4, "volta"))) * 14, 12);
    card(out, `rel${a}`, 300, 300, (p) => fxRelogio(p, a), k3(0.2, 2.3, 2.4), 0.36, 0.36);
  }
  if (id === 20) { // março: a geladeira quebra
    const e = exprAt(tf, [[0, "neutral"], [TW(5, "quebra"), "shock"], [TW(5, "dez"), "nervous"], [TW(5, "carro"), "pained"], [TW(5, "cada"), "relief"], [TW(5, "cabe"), "smile"]]);
    jes(k3(1.1, 0, 1.0), { mode: "stand", expr: e });
    const tq = TW(5, "quebra");
    if (tf > tq - 0.05 && tf < tq + 0.5) { const u = (tf - tq + 0.05) / 0.55; card(out, `fa${q(u, 30)}`, 500, 500, (p) => fxBurst(p, q(u, 30), "#fff3b0"), k3(2.15, 1.75, 1.6), 0.8, 0.8); }
    if (tf > tq && tf < tq + 2.2) { const u = ((tf - tq) % 1.1) / 1.1; card(out, `pf${q(u, 30)}`, 300, 300, (p) => fxPuff(p, q(u, 30)), k3(2.1, 1.95 + u * 0.3, 1.7), 0.5, 0.5, { soft: true }); }
    const k1 = surge(tf, TW(5, "dez")), k2 = surge(tf, TW(5, "empréstimo"));
    if (k1 > 0) card(out, "dezx", 310, 190, fxDezX, k3(0.6, 1.8, 0.8), 0.42 * k1, 0.26 * k1, { rot: 0.08 });
    if (k2 > 0) card(out, "empr", 340, 190, fxEmprest, k3(0.62, 1.5, 0.75), 0.44 * k2, 0.25 * k2, { rot: -0.06 });
  }
  if (id === 21) { // oito em cada dez vizinhos com alguma conta a pagar
    for (let i = 0; i < 10; i++) {
      const z = -9 + i * 1.5, x = -4.2 + hh(i, 31) * 0.4, o = i % 5 === 2 ? KID : FOLK[(i + 2) % 6];
      pessoa(900 + i, o, i % 5 === 2 ? "kid" : `f${(i + 2) % 6}`, r3(x, 0, z), { mode: "stand", expr: (["neutral", "smile_closed", "neutral", "smile"] as Expr[])[i % 4], look: 1 }, i % 5 === 2 ? 0.72 : 1);
      if (i !== 3 && i !== 7) { const k = surge(tf, TW(6, "oito") + i * 0.14); if (k > 0) card(out, `ico${i % 3}`, 220, 240, (p) => fxIcone(p, i % 3), r3(x, (i % 5 === 2 ? 1.75 : 2.45), z), 0.46 * k, 0.5 * k); }
    }
  }
  if (id === 22) { // o preço do dinheiro
    jes(r3(0, 0, 0), { mode: "stand", expr: exprAt(tf, [[0, "neutral"], [TW(7, "problema"), "nervous"], [TW(7, "preço"), "stern"]]), look: -1 });
    const k = surge(tf, TW(7, "preço") - 0.1);
    if (k > 0) { card(out, "nota", 400, 200, fxNota, r3(0.48, 1.45, -0.5), 0.36 * k, 0.18 * k, { rot: 0.1 }); card(out, "tag", 270, 120, fxTag, r3(0.62, 1.28, -0.55), 0.24 * k, 0.11 * k, { rot: -0.3 }); }
  }
  if (id === 23) { // as colunas: ela pequena, olhando para cima
    const back = clamp01((tf - TW(8, "rotativo")) / 0.6);
    jes(p3(1.95, 0, -1.7 - back * 0.5), { mode: "stand", expr: exprAt(tf, [[0, "neutral"], [TW(8, "sessenta"), "nervous"], [TW(8, "quatrocentos"), "shock"]]), headTilt: -0.12 });
  }
  if (id === 24) { // setembro: o aumento
    jes(k3(0.75, 0, 1.0), { mode: "stand", expr: exprAt(tf, [[0, "smile"], [TW(9, "salário"), "grin"], [TW(9, "sobe"), "laugh"]]) });
    const k = surge(tf, TW(9, "salário") - 0.1);
    if (k > 0) card(out, "contra", 340, 240, fxContra, k3(0.42, 1.4, 0.7), 0.4 * k, 0.28 * k, { rot: -0.08 });
    const u = (tf * 0.9) % 1; card(out, `stars${q(u, 30)}`, 420, 210, (p) => fxStars(p, q(u, 30)), k3(0.75, 2.45, 0.95), 0.6, 0.3);
  }
  const mesa = () => { pessoa(700, JES, "jes", k3(-0.3, 0.45, 1.2), { mode: "sit", expr: "neutral" }, 1, false); };
  if (id === 25) { // dez notas, três vão para as dívidas
    out.places.pop; pessoa(700, JES, "jes", k3(-0.3, 0.45, 1.2), { mode: "sit", expr: exprAt(tf, [[0, "neutral"], [TW(10, "quase"), "nervous"], [TW(10, "dívidas"), "pained"]]) }, 1, false);
    card(out, "caixa", 340, 210, fxCaixa, k3(0.3, 0.92, 0.25), 0.34, 0.21);
    for (let i = 0; i < 10; i++) {
      const bx = -0.85 + (i % 5) * 0.26, bz = 0.2 + Math.floor(i / 5) * 0.2, vai = i >= 7;
      const u = vai ? clamp01((tf - TW(10, "quase") - (i - 7) * 0.3) / 0.5) : 0, e = 1 - (1 - u) ** 3;
      card(out, "nota", 400, 200, fxNota, k3(bx + (0.3 - bx) * e, 0.795 + Math.sin(Math.PI * u) * 0.12, bz + (0.25 - bz) * e), 0.24, 0.12, { flat: true, rot: 0.1 * i });
    }
  }
  if (id === 26) { // o aumento anda, a parcela corre
    const t0 = TW(11, "o"), ue = clamp01((tf - t0) / 2.6), ub = clamp01((tf - TW(11, "parcela") + 0.4) / 0.9);
    card(out, `env${q((tf * 1.5) % 1, 8)}`, 320, 260, (p) => fxEnvelope(p, q((tf * 1.5) % 1, 8), true), r3(1.4 - ue * 1.2, 0.5, 0.2), 0.66, 0.54);
    if (ub > 0) card(out, `bol${q((tf * 4) % 1, 8)}`, 330, 310, (p) => fxBoletos(p, q((tf * 4) % 1, 8)), r3(2.6 - ub * 4.4, 0.6, 0.5), 0.72, 0.68);
    if (ub > 0.3 && ub < 0.9) card(out, `pu${q(ub, 30)}`, 300, 300, (p) => fxPuff(p, q(ub, 30)), r3(2.6 - ub * 4.4 + 0.3, 0.12, 0.6), 0.5, 0.5, { soft: true });
    jes(r3(-0.9, 0, 1.6), { mode: "stand", expr: exprAt(tf, [[0, "neutral"], [TW(11, "antes"), "smile_closed"]]), look: 1 });
  }
  if (id === 27) { // a fatura não fecha, o nome vai para a lista
    pessoa(700, JES, "jes", k3(-0.3, 0.45, 1.2), { mode: "sit", expr: exprAt(tf, [[0, "nervous"], [TW(12, "outra"), "pained"], [TW(12, "lista"), "shock"]]) }, 1, false);
    const fs = [TW(12, "fatura"), TW(12, "outra")];
    fs.forEach((ts, i) => { const k = surge(tf, ts, 0.3); if (k > 0) card(out, "fatR", 260, 340, fxFaturaR, k3(-0.45 + i * 0.22, 0.795 + i * 0.005, 0.35 - i * 0.05), 0.26, 0.34, { flat: true, rot: -0.2 + i * 0.35 }); });
    const ks = clamp01((tf - TW(12, "lista") + 0.12) / 0.18);
    if (ks > 0) card(out, "carimbo", 640, 200, fxCarimbo, k3(-0.3, 1.2 + (1 - ks) * 0.6, 0.5), 0.72, 0.22, { rot: -0.12 });
  }
  if (id === 29) { // o fecho: ela, o Marcos e a Bia; o calendário volta a março
    pessoa(700, JES, "jes", k3(-0.3, 0.45, 1.2), { mode: "sit", expr: exprAt(tf, [[0, "dazed"], [TW(14, "março"), "pained"], [TW(14, "hoje"), "neutral"]]) }, 1, false);
    pessoa(701, MARCOS, "marcos", k3(-1.15, 0, 1.75), { mode: "stand", expr: "smile_closed", look: 1 });
    pessoa(702, BIA, "bia", k3(0.85, 0.45, 0.65), { mode: "sit", expr: "neutral", look: -1 }, 0.72, false);
    const mar = tf >= TW(14, "março") - LEAD;
    card(out, `calF${mar ? 1 : 0}`, 440, 580, (p) => fxCalendario(p, mar ? "MARÇO" : "OUTUBRO", mar), k3(0.95, 1.62, 2.4), 0.56, 0.74);
  }
  if (id === 19 || id === 16 || id === 17 || id === 20 || id === 24) {
    if (id !== 19) card(out, "calOUT", 440, 580, (p) => fxCalendario(p, id === 20 ? "MARÇO" : "OUTUBRO", false), k3(0.95, 1.62, 2.4), 0.56, 0.74);
  }
  if ([25, 27].includes(id)) card(out, "calOUT", 440, 580, (p) => fxCalendario(p, "OUTUBRO", false), k3(0.95, 1.62, 2.4), 0.56, 0.74);
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, b: BridgeState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  if (s.crowd === "march" || s.crowd === "fall") column(id, t, b, cam, out);
  if (s.towns) townsfolkAt(cam, t, out);
  if (s.crowd === "water") {
    const spots: [number, number, number][] = [];
    for (let i = 0; i < 40; i++) spots.push([FILES[i & 3] * 1.12 + (hh(i, 11) - 0.5) * 0.6, -0.6, -21.6 + (i >> 2) * 1.6 + (hh(i, 12) - 0.5) * 0.7]);
    const happy: Expr[] = ["relief", "relief_open", "smile", "relief"], hurt: Expr[] = ["pained", "dazed", "pained", "dazed"];
    sitters(cam, t, out, spots, (i) => (id === 9 ? happy : hurt)[i % 4], (i) => id === 10 && i % 4 === 1, true);
    flotsam(t, out);
  }
  if (s.crowd === "bank") {
    const spots: [number, number, number][] = [[-7.2, D0, -33.6], [-6.1, D0, -32.1], [-5.0, D0, -34.3], [-4.3, D0, -31.6], [-3.4, D0, -33.2],
      [-2.4, D0, -31.9], [-6.8, D0, -35.4], [-4.1, D0, -35.6], [-1.9, D0, -34.6]];
    const ex: Expr[] = ["dazed", "relief", "smile_closed", "pained"];
    sitters(cam, t, out, spots, (i) => ex[i % 4], (i) => i % 4 === 0, false);
    officer(cam, t, out);
  }
  if (s.crowd === "tourists") tourists(cam, t, out);
  if (s.crowd === "amostra") amostra(id, t, cam, out);
  if (s.crowd === "filme") filme(id, t, cam, out);
  if (id === 12) park(cam, t, out);
  return out;
};

// ---------------- one-off effects ----------------
export const snapFx = (tau: number, at: V3, out: Stage) => {
  if (tau >= SNAP && tau < SNAP + 0.45) {
    const u = (tau - SNAP) / 0.45;
    out.fx.push({ key: `bigburst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x: at[0], y: at[1] + 0.12, z: at[2] - 0.15, w: 1.5, h: 1.5 });
  }
};
export const splashFx = (tau: number, out: Stage) => {
  const u = (tau - DROP1) / 1.1;
  if (u < 0 || u >= 1) return;
  for (const [x, z, s] of [[-2.9, -24, 1], [2.9, -21, 0.9], [-2.9, -15, 0.85], [2.9, -9, 0.8], [0, -27.5, 1.2], [-2.9, -5, 0.6]] as const)
    out.fx.push({ key: `splash${q(u, 30)}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, q(u, 30)), x, y: 2.6 * s, z, w: 7 * s, h: 7 * s }); // base of the drawing on the water line
};
export const creakFx = (t: number, pts: V3[], out: Stage, size = 0.8) =>
  pts.forEach(([x, y, z], i) => {
    const u = q((t * 1.3 + i * 0.37) % 1, 30);
    out.fx.push({ key: `creak${u}`, cw: 300, ch: 300, draw: (p) => fxCreak(p, u), x, y, z, w: size, h: size, rot: i * 0.6 - 0.6 });
  });
export { FPS };
