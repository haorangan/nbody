import type { Body2D, Vec2 } from "./types";

export const v = (x=0, y=0): Vec2 => ({ x, y });
export const add = (a:Vec2,b:Vec2)=> v(a.x+b.x, a.y+b.y);
export const sub = (a:Vec2,b:Vec2)=> v(a.x-b.x, a.y-b.y);
export const mul = (a:Vec2,s:number)=> v(a.x*s, a.y*s);
export const n2  = (a:Vec2)=> a.x*a.x + a.y*a.y;

export function randomBodies2D(n: number): Body2D[] {
  const out: Body2D[] = [];
  for (let i=0;i<n;++i){
    const r = Math.sqrt(Math.random()) * 1.2;
    const th = Math.random()*Math.PI*2;
    const pos = v(r*Math.cos(th), r*Math.sin(th));
    const vel = v((Math.random()-0.5)*0.25, (Math.random()-0.5)*0.25);
    const mass = 1.0/n;
    const hue = (i/n*360)|0;
    const color = `hsl(${hue} 70% 60%)`;
    out.push({ pos, vel, mass, color });
  }
  // zero net momentum
  let px=0, py=0, M=0;
  for (const b of out){ px += b.vel.x*b.mass; py += b.vel.y*b.mass; M += b.mass; }
  const vx=px/M, vy=py/M;
  for (const b of out){ b.vel.x -= vx; b.vel.y -= vy; }
  return out;
}