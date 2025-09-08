export type Vec2 = { x: number; y: number };
export type Body2D = { pos: Vec2; vel: Vec2; mass: number; color: string };
export type Method = "leapfrog" | "rk4";

export type Params = {
  G: number;
  eps: number;
  dt: number;
  method: Method;
};

export type FrameMsg = {
  type: "frame";
  positions: Float32Array;   // [x0,y0, x1,y1, ...]
  energies: { t: number; K: number; U: number; E: number };
};

export type WorkerIn =
  | { type: "init"; bodies: Body2D[]; params: Params }
  | { type: "updateParams"; params: Partial<Params> }
  | { type: "replaceBodies"; bodies: Body2D[] }
  | { type: "play"; playing: boolean }
  | { type: "step"; steps?: number };