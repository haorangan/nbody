import { useEffect, useRef } from "react";
import { Camera2D, createCamera, resetCamera, worldToScreen, zoomAt } from "./camera";

export function Canvas2D({
  onReady
}: {
  onReady: (api: { paint: (pos: Float32Array) => void; setHUD: (s: string) => void; resetCamera: () => void }) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  const camRef = useRef<Camera2D>(createCamera());
  const lastPos = useRef<Float32Array | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const hud = hudRef.current!;
    const ctx = canvas.getContext("2d")!;

    const cam = camRef.current;

    function paint(positions: Float32Array) {
      lastPos.current = positions;
      const w = wrap.clientWidth, h = wrap.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const n = positions.length / 2;
      const r = Math.max(2, 4 + cam.s * 0.01);
      for (let i = 0; i < n; ++i) {
        const x = positions[i * 2], y = positions[i * 2 + 1];
        const { X, Y } = worldToScreen(cam, { x, y }, w, h);
        ctx.beginPath();
        ctx.fillStyle = "#66ccff";
        ctx.arc(X, Y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function repaint() {
      // draw last frame or a tiny test pattern so you see something
      const fallback = new Float32Array([-1,-1, 1,-1, 1,1, -1,1, 0,0]);
      paint(lastPos.current || fallback);
    }

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pw = Math.max(1, Math.floor(w * dpr));
      const ph = Math.max(1, Math.floor(h * dpr));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      repaint(); // redraw after size changes
    };

    // initial size + listener
    resize();
    window.addEventListener("resize", resize);

    // --------- interactions ---------
    // pan
    let dragging = false;
    let last = { x: 0, y: 0 };
    canvas.addEventListener("mousedown", (e) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
    });
    window.addEventListener("mouseup", () => {
      dragging = false;
      canvas.style.cursor = "grab";
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      cam.x -= dx / cam.s;
      cam.y -= dy / cam.s;
      last = { x: e.clientX, y: e.clientY };
      repaint();
    });

    // zoom
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const factor = Math.pow(1.1, -Math.sign(e.deltaY));
        zoomAt(cam, mx, my, rect, factor);
        repaint();
      },
      { passive: false }
    );

    // double-click reset
    canvas.addEventListener("dblclick", () => {
      resetCamera(cam);
      repaint();
    });

    function setHUD(s: string) { hud.textContent = s; }

    onReady({
      paint,
      setHUD,
      resetCamera: () => { resetCamera(cam); repaint(); }
    });

    // draw once while waiting for first worker frame
    repaint();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [onReady]);

  return (
    <div ref={wrapRef} className="canvasWrap">
      <canvas ref={canvasRef} id="c" />
      <div ref={hudRef} className="hud" />
    </div>
  );
}