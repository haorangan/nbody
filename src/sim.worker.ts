/// <reference lib="webworker" />
import { add, mul, v } from "./physics";
import type { Body2D, Params, WorkerIn, FrameMsg } from "./types";

let P: Params = { G: 1, eps: 0.01, dt: 0.001, method: "leapfrog" };
let B: Body2D[] = [];
let playing = true;
let t = 0;

let buf = new Float32Array(0);

function ensureBuf(n: number) {
  if (buf.length !== n * 2) buf = new Float32Array(n * 2);
}

function accels(): { x: number; y: number }[] {
  const n = B.length, a = new Array(n) as {x:number;y:number}[];
  const eps2 = P.eps * P.eps;
  for (let i=0;i<n;++i){
    let ax=0, ay=0;
    const bi = B[i];
    for (let j=0;j<n;++j){
      if (i===j) continue;
      const bj = B[j];
      const rx = bj.pos.x - bi.pos.x, ry = bj.pos.y - bi.pos.y;
      const r2 = rx*rx + ry*ry + eps2;
      const invr3 = 1.0 / (Math.sqrt(r2) * r2);
      const s = P.G * bj.mass * invr3;
      ax += s * rx; ay += s * ry;
    }
    a[i] = { x: ax, y: ay };
  }
  return a;
}

function step_leapfrog(dt: number) {
  const a1 = accels();
  for (let i=0;i<B.length;++i){
    B[i].vel.x += a1[i].x * 0.5*dt;
    B[i].vel.y += a1[i].y * 0.5*dt;
    B[i].pos.x += B[i].vel.x * dt;
    B[i].pos.y += B[i].vel.y * dt;
  }
  const a2 = accels();
  for (let i=0;i<B.length;++i){
    B[i].vel.x += a2[i].x * 0.5*dt;
    B[i].vel.y += a2[i].y * 0.5*dt;
  }
  t += dt;
}

function accelsFor(pos: {x:number;y:number}[]): {x:number;y:number}[] {
  const n = B.length, a = new Array(n) as {x:number;y:number}[];
  const eps2 = P.eps * P.eps;
  for (let i=0;i<n;++i){
    let ax=0, ay=0;
    for (let j=0;j<n;++j){ if (i===j) continue;
      const rx = pos[j].x - pos[i].x, ry = pos[j].y - pos[i].y;
      const r2 = rx*rx + ry*ry + eps2;
      const invr3 = 1.0 / (Math.sqrt(r2) * r2);
      const s = P.G * B[j].mass * invr3;
      ax += s*rx; ay += s*ry;
    }
    a[i] = { x: ax, y: ay };
  }
  return a;
}

function step_rk4(dt: number) {
  const n=B.length;
  const x0=B.map(b=>({x:b.pos.x,y:b.pos.y}));
  const v0=B.map(b=>({x:b.vel.x,y:b.vel.y}));
  const a1 = accels();

  const x2 = x0.map((x,i)=>({x:x.x + v0[i].x*0.5*dt, y:x.y + v0[i].y*0.5*dt}));
  const v2 = v0.map((vv,i)=>({x:vv.x + a1[i].x*0.5*dt, y:vv.y + a1[i].y*0.5*dt}));
  const a2 = accelsFor(x2);

  const x3 = x0.map((x,i)=>({
    x: x.x + (v0[i].x + a1[i].x*0.5*dt)*0.5*dt,
    y: x.y + (v0[i].y + a1[i].y*0.5*dt)*0.5*dt
  }));
  const v3 = v0.map((vv,i)=>({x:vv.x + a2[i].x*0.5*dt, y:vv.y + a2[i].y*0.5*dt}));
  const a3 = accelsFor(x3);

  const x4 = x0.map((x,i)=>({x:x.x + (v0[i].x + a2[i].x*dt)*dt, y:x.y + (v0[i].y + a2[i].y*dt)*dt}));
  const v4 = v0.map((vv,i)=>({x:vv.x + a3[i].x*dt, y:vv.y + a3[i].y*dt}));
  const a4 = accelsFor(x4);

  for (let i=0;i<n;++i){
    const vdot = v(
      (a1[i].x + 2*a2[i].x + 2*a3[i].x + a4[i].x)/6,
      (a1[i].y + 2*a2[i].y + 2*a3[i].y + a4[i].y)/6
    );
    const vavg = v(
      (v0[i].x + 2*(v0[i].x+0.5*dt*a1[i].x) + 2*(v0[i].x+0.5*dt*a2[i].x) + (v0[i].x+dt*a3[i].x))/6,
      (v0[i].y + 2*(v0[i].y+0.5*dt*a1[i].y) + 2*(v0[i].y+0.5*dt*a2[i].y) + (v0[i].y+dt*a3[i].y))/6
    );
    B[i].pos.x += vavg.x * dt;
    B[i].pos.y += vavg.y * dt;
    B[i].vel.x += vdot.x;
    B[i].vel.y += vdot.y;
  }
  t += dt;
}

function energies() {
  let K=0, U=0;
  for (const b of B) K += 0.5*b.mass*(b.vel.x*b.vel.x + b.vel.y*b.vel.y);
  for (let i=0;i<B.length;++i){
    for (let j=i+1;j<B.length;++j){
      const rx=B[j].pos.x-B[i].pos.x, ry=B[j].pos.y-B[i].pos.y;
      const d=Math.sqrt(rx*rx+ry*ry + P.eps*P.eps);
      U += -P.G * B[i].mass * B[j].mass / d;
    }
  }
  return { t, K, U, E: K+U };
}

function sendFrame() {
  ensureBuf(B.length);
  for (let i=0;i<B.length;++i){
    const o=i*2; buf[o]=B[i].pos.x; buf[o+1]=B[i].pos.y;
  }
  const copy = buf.slice();
  (postMessage as any)({ type: "frame", positions: copy, energies: energies() });
}

function tick(){
  if (playing){
    (P.method==="leapfrog" ? step_leapfrog : step_rk4)(P.dt);
    sendFrame();
  }
  setTimeout(tick, 0);
}
tick();

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  const m = e.data;
  if (m.type === "init"){ B = m.bodies; P = m.params; t = 0; sendFrame(); }
  else if (m.type === "updateParams"){ P = { ...P, ...m.params }; }
  else if (m.type === "replaceBodies"){ B = m.bodies; t = 0; sendFrame(); }
  else if (m.type === "play"){ playing = m.playing; }
  else if (m.type === "step"){ const k=m.steps??1; for (let i=0;i<k;i++) (P.method==="leapfrog"?step_leapfrog:step_rk4)(P.dt); sendFrame(); }
};