// ---------- 3D figure: control points per keyframe, limbs solved with 2-bone IK ----------
const View3D = (() => {
  if (!window.THREE) return null;
  const T = THREE, V = (x, y, z) => new T.Vector3(x, y, z);
  const L_UA = 0.29, L_FA = 0.27, L_TH = 0.43, L_SH = 0.42;
  const nrm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };

  // ---- exercise definitions (metres, y up). lat = body's left→right axis, u = pelvis→neck ----
  const BAR_Y = 2.2;
  const hangBase = { lat:[1,0,0], toe:nrm([0,-0.7,1]), sh:-0.05 };
  const E = {};

  E.chin = { cam:{az:72, el:8, dist:3.5, ty:1.55}, bar:true, band:true,
    keys:[0,1.3,1.7,3.4],
    poses:[
      {...hangBase, P:[0,1.19,-0.02], N:[0,1.69,-0.02], LH:[-0.15,BAR_Y,0], RH:[0.15,BAR_Y,0], LF:[-0.06,0.52,-0.22], RF:[0.06,0.5,-0.26], poles:{LE:[0,-0.3,1], RE:[0,-0.3,1], LK:[0,0,1], RK:[0,0,1]}},
      {...hangBase, P:[0,1.66,-0.2], N:[0,2.15,-0.12], LH:[-0.15,BAR_Y,0], RH:[0.15,BAR_Y,0], LF:[-0.06,1.02,-0.42], RF:[0.06,1.0,-0.46], poles:{LE:[-0.15,-1,0.8], RE:[0.15,-1,0.8], LK:[0,0,1], RK:[0,0,1]}},
    ], seq:[0,1,1,0], muscles:{lats:'m1', ua:'m1', fa:'m2'}};

  const wideTop = {...hangBase, P:[0,1.64,-0.12], N:[0,2.14,-0.08], LH:[-0.32,BAR_Y,0], RH:[0.32,BAR_Y,0], LF:[-0.1,0.95,-0.2], RF:[0.1,0.95,-0.2], poles:{LE:[-1,-0.4,-0.3], RE:[1,-0.4,-0.3], LK:[0,0,1], RK:[0,0,1]}};
  const wideBot = {...hangBase, P:[0,1.2,0], N:[0,1.7,0], LH:[-0.32,BAR_Y,0], RH:[0.32,BAR_Y,0], LF:[-0.09,0.38,-0.06], RF:[0.09,0.38,-0.06], poles:{LE:[-1,-0.2,-0.3], RE:[1,-0.2,-0.3], LK:[0,0,1], RK:[0,0,1]}};
  E.neg = { cam:{az:215, el:10, dist:3.6, ty:1.4}, bar:true, chair:true,
    keys:[0,0.7,4.9,5.6,6.6], poses:[wideTop, wideBot], seq:[0,0,1,1,0], muscles:{lats:'m1', ua:'m2', fa:'m2', delt:'m2'}};

  E.pullup = { cam:{az:32, el:8, dist:3.6, ty:1.5}, bar:true, keys:[0,1.2,1.7,3.2,3.7], poses:[wideTop, wideBot], seq:[1,0,0,1,1], muscles:{lats:'m1', ua:'m2', fa:'m2'}};
  const midGrip = {LH:[-0.25,BAR_Y,0], RH:[0.25,BAR_Y,0]};
  const passive = {...hangBase, ...midGrip, P:[0,1.13,0], N:[0,1.63,0], sh:0.03, LF:[-0.09,0.32,-0.04], RF:[0.09,0.32,-0.04], poles:{LE:[-1,0,-0.2], RE:[1,0,-0.2], LK:[0,0,1], RK:[0,0,1]}};
  const active = {...passive, P:[0,1.22,0], N:[0,1.72,0], sh:-0.06, LF:[-0.09,0.41,-0.04], RF:[0.09,0.41,-0.04]};
  E.scap = { cam:{az:205, el:12, dist:3.2, ty:1.55}, bar:true, keys:[0,0.9,1.5,2.6], poses:[passive, active], seq:[0,1,1,0], muscles:{lats:'m1'}};

  const hangA = {...active, sh:-0.04, P:[-0.015,1.2,0.03]}, hangB = {...active, sh:-0.04, P:[0.015,1.2,-0.03]};
  E.hang = { cam:{az:200, el:10, dist:3.4, ty:1.45}, bar:true, keys:[0,2,4], poses:[hangA, hangB], seq:[0,1,0], muscles:{fa:'m1', lats:'m2'}};

  const rowBot = { lat:[0,0,1], toe:[-1,0,0], sh:-0.05, P:[0.25,0.92,0], N:[-0.26,0.98,0],
    LH:[-0.46,0.52,-0.2], RH:[-0.24,0.4,0.22], LF:[0.02,0.08,-0.2], RF:[0.36,0.08,0.24],
    poles:{LE:[0.3,0,-1], RE:[0.4,0,0.6], LK:[-1,0,0], RK:[-1,0,0]}, db:['R'], dbAxis:[1,0,0]};
  const rowTop = {...rowBot, RH:[0.02,0.82,0.22], poles:{...rowBot.poles, RE:[0.5,1,0.3]}};
  E.row = { cam:{az:28, el:18, dist:2.9, ty:0.65, tx:0}, bench:true, keys:[0,0.9,1.4,2.6], poses:[rowBot,rowTop], seq:[0,1,1,0], muscles:{lats:'m1', uaR:'m2', deltR:'m2'}};

  const pushPose = th => { const r = th*Math.PI/180, c = Math.cos(r), s = Math.sin(r), Fx = 0.81, Fy = 0.1;
    return { lat:[0,0,1], toe:nrm([-0.6,-1,0]), sh:-0.04, P:[Fx-0.85*c, Fy+0.85*s-0.06, 0], N:[Fx-1.36*c, Fy+1.36*s-0.06, 0],
      LH:[0,0.78,-0.24], RH:[0,0.78,0.24], LF:[Fx,Fy,-0.11], RF:[Fx,Fy,0.11],
      poles:{LE:[1,0.6,-1], RE:[1,0.6,1], LK:[1,1,0], RK:[1,1,0]} }; };
  E.push = { cam:{az:22, el:14, dist:3.0, ty:0.75, tx:0.25}, table:true, keys:[0,1.1,1.4,2.5], poses:[pushPose(67), pushPose(47)], seq:[0,1,1,0], muscles:{pecs:'m1', ua:'m2', delt:'m2', abs:'m2'}};

  const pressBot = { lat:[0,0,-1], toe:[1,0,0], sh:-0.04, P:[0.36,0.12,0], N:[-0.14,0.12,0],
    LH:[-0.08,0.36,0.36], RH:[-0.08,0.36,-0.36], LF:[0.76,0.07,0.15], RF:[0.76,0.07,-0.15],
    poles:{LE:[0.2,-1,0.6], RE:[0.2,-1,-0.6], LK:[0,1,0.2], RK:[0,1,-0.2]}, db:['L','R'], dbAxis:[0,0,1]};
  const pressTop = {...pressBot, LH:[-0.12,0.66,0.2], RH:[-0.12,0.66,-0.2]};
  E.press = { cam:{az:8, el:30, dist:2.7, ty:0.3, tx:0.2}, floorOnly:true, keys:[0,1,1.4,2.6], poses:[pressBot, pressTop], seq:[0,1,1,0], muscles:{pecs:'m1', ua:'m2', delt:'m2'}};

  const stand = (LH, RH) => ({ lat:[0,0,1], toe:[-1,0,0], sh:-0.05, P:[0,0.96,0], N:[0,1.46,0],
    LF:[0,0.06,-0.11], RF:[0,0.06,0.11], LH, RH, poles:{LE:[0,-1,0.2], RE:[0,-1,-0.2], LK:[-1,0,0], RK:[-1,0,0]} });
  E.circ = (() => { const R = 0.09, poses = [];
    for (let k = 0; k < 8; k++){ const a = k*Math.PI/4, dx = -Math.sin(a)*R, dy = Math.cos(a)*R; poses.push(stand([dx,1.41+dy,-0.71],[dx,1.41+dy,0.71])); }
    const keys = [0], seq = [0]; let t = 0; const add = i => { t += 0.15; keys.push(+t.toFixed(2)); seq.push(i); };
    for (let l = 0; l < 2; l++) for (let k = 1; k <= 8; k++) add(k % 8);
    for (let l = 0; l < 2; l++) for (let k = 7; k >= 0; k--) add(k);
    return { cam:{az:-55, el:8, dist:3.2, ty:0.95}, keys, poses, seq, muscles:{delt:'m1', lats:'m2'} }; })();
  E.pull = { cam:{az:135, el:12, dist:3.2, ty:1.0}, pullband:true, keys:[0,0.9,1.3,2.2,2.6],
    poses:[stand([-0.53,1.37,-0.2],[-0.53,1.37,0.2]), stand([-0.12,1.37,-0.69],[-0.12,1.37,0.69])], seq:[0,1,1,0,0], muscles:{lats:'m1', delt:'m2'} };

  // ---- renderer ----
  const canvas = document.createElement('canvas'); canvas.className = 'c3d';
  const renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;
  const camera = new T.PerspectiveCamera(32, 1, 0.1, 50);
  let scene, def, rig, mats, startT = 0, az = 0, el = 0, raf = 0, ro = null, bandMesh = null;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#999';
  const col = n => new T.Color(css(n)).convertSRGBToLinear();

  function makeMats(){
    const m = c => new T.MeshStandardMaterial({color:col(c), roughness:0.62, metalness:0.02});
    return { skin:m('--skin'), m1:m('--m1'), m2:m('--m2'), eq:new T.MeshStandardMaterial({color:col('--eq'), roughness:0.5, metalness:0.25}),
      db:new T.MeshStandardMaterial({color:col('--ink'), roughness:0.4, metalness:0.5}), band:new T.MeshStandardMaterial({color:col('--band'), roughness:0.7}) };
  }
  const SPH = new T.SphereGeometry(1, 28, 20), CYL = new T.CylinderGeometry(1, 1, 1, 24, 1, true);
  function capsule(r, mat){ const g = new T.Group();
    const c = new T.Mesh(CYL, mat), a = new T.Mesh(SPH, mat), b = new T.Mesh(SPH, mat);
    [c,a,b].forEach(x => { x.castShadow = true; g.add(x); }); a.scale.setScalar(r); b.scale.setScalar(r);
    g.set = (p, q) => { const d = q.clone().sub(p), len = d.length();
      c.position.copy(p).addScaledVector(d, 0.5); c.scale.set(r, Math.max(len, 1e-4), r);
      c.quaternion.setFromUnitVectors(V(0,1,0), d.normalize()); a.position.copy(p); b.position.copy(q); };
    g.mat = m => { c.material = a.material = b.material = m; };
    return g; }
  function ellip(rx, ry, rz, mat){ const e = new T.Mesh(SPH, mat); e.castShadow = true; e.matrixAutoUpdate = false;
    e.set = (c, lat, u, f) => { e.matrix.makeBasis(lat.clone().multiplyScalar(rx), u.clone().multiplyScalar(ry), f.clone().multiplyScalar(rz)); e.matrix.setPosition(c); };
    return e; }
  function box(w, h, d, x, y, z, mat){ const b = new T.Mesh(new T.BoxGeometry(w,h,d), mat); b.position.set(x,y,z); b.castShadow = b.receiveShadow = true; scene.add(b); return b; }
  function rod(a, b, r, mat){ const c = capsule(r, mat); c.set(a, b); scene.add(c); return c; }

  function buildScene(key){
    scene = new T.Scene(); def = E[key]; mats = makeMats(); bandMesh = null;
    scene.add(new T.HemisphereLight(0xffffff, 0x8a8f99, 0.75));
    const sun = new T.DirectionalLight(0xffffff, 0.85); sun.position.set(2.5, 5, 3.5); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, {left:-2.5, right:2.5, top:3, bottom:-1, near:0.5, far:12}); scene.add(sun);
    const fill = new T.DirectionalLight(0xffffff, 0.3); fill.position.set(-3, 2, -2); scene.add(fill);
    const ground = new T.Mesh(new T.CircleGeometry(2.2, 48), new T.ShadowMaterial({opacity:0.16}));
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
    const eq = mats.eq;
    if (def.bar){ rod(V(-0.62,BAR_Y,0), V(0.62,BAR_Y,0), 0.018, eq); rod(V(-0.62,BAR_Y,0), V(-0.62,BAR_Y,-0.18), 0.022, eq); rod(V(0.62,BAR_Y,0), V(0.62,BAR_Y,-0.18), 0.022, eq);
      box(0.08, 0.5, 0.04, -0.66, BAR_Y-0.05, -0.2, eq); box(0.08, 0.5, 0.04, 0.66, BAR_Y-0.05, -0.2, eq); }
    if (def.chair){ box(0.44,0.04,0.42, 0,0.46,-0.5, eq); [[-0.19,-0.69],[0.19,-0.69],[-0.19,-0.31],[0.19,-0.31]].forEach(([x,z]) => box(0.03,0.44,0.03, x,0.22,z, eq)); }
    if (def.bench){ box(0.5,0.04,0.44, -0.5,0.46,-0.18, eq); [[-0.72,-0.37],[-0.28,-0.37],[-0.72,0.01],[-0.28,0.01]].forEach(([x,z]) => box(0.03,0.44,0.03, x,0.22,z, eq)); }
    if (def.table){ box(0.8,0.04,0.9, -0.38,0.76,0, eq); [[-0.74,-0.4],[-0.04,-0.4],[-0.74,0.4],[-0.04,0.4]].forEach(([x,z]) => box(0.04,0.74,0.04, x,0.37,z, eq)); }
    if (def.treadmill){ box(1.5,0.07,0.6, 0.1,0.035,0, eq); rod(V(-0.6,0.07,-0.28), V(-0.72,1.15,-0.28), 0.02, eq); rod(V(-0.6,0.07,0.28), V(-0.72,1.15,0.28), 0.02, eq);
      box(0.12,0.22,0.6, -0.74,1.2,0, eq); rod(V(-0.68,1.05,-0.28), V(-0.35,1.0,-0.3), 0.016, eq); rod(V(-0.68,1.05,0.28), V(-0.35,1.0,0.3), 0.016, eq); }

    const mc = def.muscles || {}, mat = k => mats[mc[k]] || mats.skin;
    rig = {
      chest: ellip(0.165,0.19,0.105, mats.skin), abd: ellip(0.135,0.15,0.095, mats.skin), pelvis: ellip(0.155,0.1,0.105, mats.skin),
      pecs: mc.pecs ? ellip(0.15,0.095,0.095, mat('pecs')) : null, lats: mc.lats ? ellip(0.162,0.17,0.093, mat('lats')) : null,
      abs: mc.abs ? ellip(0.1,0.13,0.088, mat('abs')) : null,
      head: ellip(0.094,0.115,0.104, mats.skin), neck: capsule(0.045, mats.skin),
      uaL: capsule(0.046, mat(mc.uaL ? 'uaL' : 'ua')), uaR: capsule(0.046, mat(mc.uaR ? 'uaR' : 'ua')),
      faL: capsule(0.037, mat('fa')), faR: capsule(0.037, mat('fa')),
      dL: new T.Mesh(SPH, mat(mc.deltL ? 'deltL' : 'delt')), dR: new T.Mesh(SPH, mat(mc.deltR ? 'deltR' : 'delt')),
      hL: new T.Mesh(SPH, mats.skin), hR: new T.Mesh(SPH, mats.skin),
      thL: capsule(0.068, mat('thigh')), thR: capsule(0.068, mat('thigh')), shL: capsule(0.05, mat('shin')), shR: capsule(0.05, mat('shin')),
      ftL: capsule(0.038, mats.skin), ftR: capsule(0.038, mats.skin), dbs:{}
    };
    [rig.dL, rig.dR].forEach(d => { d.scale.setScalar(0.062); d.castShadow = true; });
    [rig.hL, rig.hR].forEach(d => { d.scale.set(0.045,0.05,0.04); d.castShadow = true; });
    Object.values(rig).forEach(o => { if (o && o.isObject3D) scene.add(o); });
    if (def.pullband){ rig.pband = capsule(0.012, mats.band); scene.add(rig.pband); }
    const dbList = new Set(def.poses.flatMap(p => p.db || []));
    dbList.forEach(s => { const g = new T.Group(); const h = new T.Mesh(new T.CylinderGeometry(0.016,0.016,0.16,12), mats.db);
      const p1 = new T.Mesh(new T.CylinderGeometry(0.055,0.055,0.05,20), mats.db), p2 = p1.clone();
      p1.position.y = 0.08; p2.position.y = -0.08; [h,p1,p2].forEach(m => { m.castShadow = true; g.add(m); }); scene.add(g); rig.dbs[s] = g; });
    const c = def.cam; az = c.az*Math.PI/180; el = c.el*Math.PI/180; startT = performance.now();
  }

  const lerpA = (a, b, t) => a.map((v, i) => v + (b[i] - v)*t);
  function mix(a, b, t){ const o = {}; for (const k in a){ const va = a[k], vb = b[k];
      if (k === 'poles'){ o.poles = {}; for (const j in va) o.poles[j] = lerpA(va[j], vb[j], t); }
      else if (Array.isArray(va) && typeof va[0] === 'number') o[k] = lerpA(va, vb, t);
      else if (typeof va === 'number') o[k] = va + (vb - va)*t; else o[k] = va; }
    return o; }
  function ik(A, Tg, l1, l2, pole){ const d0 = Tg.clone().sub(A); let d = d0.length(); const axis = d0.normalize();
    d = Math.min(Math.max(d, Math.abs(l1-l2) + 1e-3), (l1+l2)*0.9995);
    const a = (l1*l1 - l2*l2 + d*d)/(2*d), h = Math.sqrt(Math.max(l1*l1 - a*a, 0));
    const p = V(...pole); const perp = p.sub(axis.clone().multiplyScalar(p.dot(axis))).normalize();
    const J = A.clone().addScaledVector(axis, a).addScaledVector(perp, h);
    const End = A.clone().addScaledVector(axis, d); return [J, End]; }

  function pose(t){ const ks = def.keys, total = ks[ks.length-1]; t = t % total;
    let i = 0; while (i < ks.length - 2 && t > ks[i+1]) i++;
    const f = (t - ks[i])/(ks[i+1] - ks[i]), e = f*f*f*(f*(f*6 - 15) + 10);
    return mix(def.poses[def.seq[i]], def.poses[def.seq[i+1]], Math.min(Math.max(e,0),1)); }

  function apply(p){
    const P = V(...p.P), N = V(...p.N), u = N.clone().sub(P).normalize();
    let lat = V(...p.lat); lat.sub(u.clone().multiplyScalar(lat.dot(u))).normalize();
    const f = lat.clone().cross(u).normalize();
    const S = s => N.clone().addScaledVector(lat, 0.18*s).addScaledVector(u, p.sh);
    const LS = S(-1), RS = S(1), Hp = s => P.clone().addScaledVector(lat, 0.09*s).addScaledVector(u, -0.04);
    rig.chest.set(N.clone().addScaledVector(u, -0.17), lat, u, f);
    rig.abd.set(P.clone().addScaledVector(u, 0.2), lat, u, f);
    rig.pelvis.set(P.clone().addScaledVector(u, 0.0), lat, u, f);
    if (rig.pecs) rig.pecs.set(N.clone().addScaledVector(u, -0.15).addScaledVector(f, 0.03), lat, u, f);
    if (rig.lats) rig.lats.set(N.clone().addScaledVector(u, -0.21).addScaledVector(f, -0.026), lat, u, f);
    if (rig.abs) rig.abs.set(P.clone().addScaledVector(u, 0.2).addScaledVector(f, 0.022), lat, u, f);
    const neckTop = N.clone().addScaledVector(u, 0.07); rig.neck.set(N.clone().addScaledVector(u, -0.03), neckTop);
    rig.head.set(N.clone().addScaledVector(u, 0.17).addScaledVector(f, 0.015), lat, u, f);
    rig.dL.position.copy(LS); rig.dR.position.copy(RS);
    [['L', LS, 'LH', 'LE', rig.uaL, rig.faL, rig.hL], ['R', RS, 'RH', 'RE', rig.uaR, rig.faR, rig.hR]].forEach(([s, Sh, hk, ek, ua, fa, hand]) => {
      const [E2, W] = ik(Sh, V(...p[hk]), L_UA, L_FA, p.poles[ek]); ua.set(Sh, E2); fa.set(E2, W);
      const dir = W.clone().sub(E2).normalize(); hand.position.copy(W).addScaledVector(dir, 0.035); hand.quaternion.setFromUnitVectors(V(0,1,0), dir);
      if (rig.dbs[s]){ rig.dbs[s].position.copy(W).addScaledVector(dir, 0.04); rig.dbs[s].quaternion.setFromUnitVectors(V(0,1,0), V(...(p.dbAxis||[0,0,1])).normalize()); } });
    if (rig.pband) rig.pband.set(rig.hL.position, rig.hR.position);
    const toe = V(...p.toe).normalize();
    [['L', -1, 'LF', 'LK', rig.thL, rig.shL, rig.ftL], ['R', 1, 'RF', 'RK', rig.thR, rig.shR, rig.ftR]].forEach(([s, sg, fk, kk, th, sh, ft]) => {
      const H = Hp(sg), [K, A] = ik(H, V(...p[fk]), L_TH, L_SH, p.poles[kk]); th.set(H, K); sh.set(K, A); ft.set(A, A.clone().addScaledVector(toe, 0.15));
      if (s === 'L') rig._knee = K; });
    if (def.band){ if (bandMesh){ scene.remove(bandMesh); bandMesh.geometry.dispose(); }
      const K = rig._knee, top = BAR_Y;
      const pts = [V(-0.05,top,0), V(-0.05,(top+K.y)/2, (K.z)/2), V(K.x-0.04, K.y-0.07, K.z+0.02), V(K.x+0.05, K.y-0.07, K.z+0.02), V(0.03,(top+K.y)/2,(K.z)/2), V(0.03,top,0)];
      bandMesh = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, 0.011, 8, false), mats.band); scene.add(bandMesh); }
  }

  function frame(now){
    raf = requestAnimationFrame(frame);
    const wrap = canvas.parentElement; if (!wrap || document.hidden) return;
    const t = reduced() ? def.keys[1]*0.999 : (now - startT)/1000;
    apply(pose(t));
    const c = def.cam, tgt = V(c.tx||0, c.ty, c.tz||0);
    camera.position.set(tgt.x + c.dist*Math.sin(az)*Math.cos(el), tgt.y + c.dist*Math.sin(el), tgt.z + c.dist*Math.cos(az)*Math.cos(el));
    camera.lookAt(tgt); renderer.render(scene, camera);
  }
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){ const w = canvas.parentElement; if (!w) return; const r = w.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return; renderer.setSize(r.width, r.height, false); camera.aspect = r.width/r.height;
    camera.fov = camera.aspect < 0.9 ? 40 : 30; camera.updateProjectionMatrix(); }

  // drag to rotate
  let drag = null, lastTap = 0, tween = 0;
  function easeHome(){ if (!def) return; cancelAnimationFrame(tween);
    const a0 = az, e0 = el, a1 = def.cam.az*Math.PI/180, e1 = def.cam.el*Math.PI/180, t0 = performance.now();
    let da = ((a1 - a0) % (2*Math.PI) + 3*Math.PI) % (2*Math.PI) - Math.PI;
    (function step(now){ const f = Math.min(1, (now - t0)/350), k = 1 - Math.pow(1 - f, 3);
      az = a0 + da*k; el = e0 + (e1 - e0)*k; if (f < 1) tween = requestAnimationFrame(step); })(t0); }
  canvas.addEventListener('pointerdown', e => { cancelAnimationFrame(tween); drag = {x:e.clientX, y:e.clientY, az, el, t:performance.now(), moved:false}; try{ canvas.setPointerCapture(e.pointerId); }catch(_){} });
  canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 8) drag.moved = true;
    az = drag.az - dx*0.01; el = Math.min(1.2, Math.max(-0.15, drag.el + dy*0.008)); });
  canvas.addEventListener('pointerup', () => { if (!drag) return; const now = performance.now();
    if (!drag.moved && now - drag.t < 300){ if (now - lastTap < 400){ lastTap = 0; easeHome(); } else lastTap = now; } else lastTap = 0;
    drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });

  let current = null;
  return {
    mount(wrap, key){ wrap.appendChild(canvas); if (ro) ro.disconnect(); ro = new ResizeObserver(resize); ro.observe(wrap); resize();
      if (key !== current){ current = key; buildScene(key); } else if (wrap.closest('.decor')) this.resetView(); if (!raf) raf = requestAnimationFrame(frame); },
    resetView(){ if (def){ az = def.cam.az*Math.PI/180; el = def.cam.el*Math.PI/180; } },
    rebuild(){ if (current) buildScene(current); },
    stop(){ cancelAnimationFrame(raf); raf = 0; }
  };
})();
