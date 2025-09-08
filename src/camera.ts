export type Camera2D = { x: number; y: number; s: number }; // center (x,y), scale s = px per world unit

export function createCamera(): Camera2D {
  return { x: 0, y: 0, s: 180 };
}
export function resetCamera(cam: Camera2D) {
  cam.x = 0; cam.y = 0; cam.s = 180;
}
export function worldToScreen(cam: Camera2D, p: {x:number;y:number}, cw: number, ch: number) {
  return { X: (p.x - cam.x) * cam.s + cw / 2, Y: (p.y - cam.y) * cam.s + ch / 2 };
}
export function screenToWorld(cam: Camera2D, X: number, Y: number, cw: number, ch: number) {
  return { x: (X - cw / 2) / cam.s + cam.x, y: (Y - ch / 2) / cam.s + cam.y };
}
export function zoomAt(cam: Camera2D, mx: number, my: number, canvasRect: DOMRect, factor: number) {
  const cw = canvasRect.width, ch = canvasRect.height;
  const before = screenToWorld(cam, mx, my, cw, ch);
  cam.s = Math.max(20, Math.min(5000, cam.s * factor));
  const after = screenToWorld(cam, mx, my, cw, ch);
  cam.x += before.x - after.x; cam.y += before.y - after.y;
}