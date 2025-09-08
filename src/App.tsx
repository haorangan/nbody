import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { Canvas2D } from "./Canvas2D";
import type { Body2D, Method, Params, WorkerIn, FrameMsg } from "./types";
import { randomBodies2D } from "./physics";

export default function App() {
  const [count, setCount] = useState(300);
  const [dt, setDt] = useState(0.001);
  const [G, setG] = useState(1.0);
  const [eps, setEps] = useState(0.01);
  const [method, setMethod] = useState<Method>("leapfrog");
  const [playing, setPlaying] = useState(true);
  const [stepsPerFrame, setSPF] = useState(1);

  const worker = useMemo(
    () => new Worker(new URL("./sim.worker.ts", import.meta.url), { type: "module" }),
    []
  );

  const painterRef = useRef<(pos: Float32Array) => void>(() => {});
  const setHudRef = useRef<(s: string) => void>(() => {});
  const canvasAPI = useRef<{ resetCamera: () => void } | null>(null);
  const lastFrame = useRef<Float32Array | null>(null);

  const onCanvasReady = useCallback((api: { paint: (p: Float32Array) => void; setHUD: (s: string) => void; resetCamera: () => void }) => {
    painterRef.current = api.paint;
    setHudRef.current = api.setHUD;
    canvasAPI.current = { resetCamera: api.resetCamera };
    if (lastFrame.current) api.paint(lastFrame.current);
  }, []);

  // worker frames
  useEffect(() => {
    const onMsg = (e: MessageEvent<FrameMsg>) => {
      if (e.data?.type === "frame") {
        const p = e.data.positions;
        const arr = p instanceof ArrayBuffer ? new Float32Array(p) : new Float32Array(p.buffer || p);
        console.log("frame", arr.length, arr[0], arr[1]);
        lastFrame.current = arr;
        painterRef.current(arr);
        const { t, K, U, E } = e.data.energies;
        setHudRef.current(`t=${t.toFixed(3)}   K=${K.toFixed(4)}   U=${U.toFixed(4)}   E=${E.toFixed(4)}`);
      }
    };
    worker.addEventListener("message", onMsg);
    return () => worker.removeEventListener("message", onMsg);
  }, [worker]);

  // boot
  useEffect(() => {
    const bodies: Body2D[] = randomBodies2D(count);
    const params: Params = { G, eps, dt, method };
    worker.postMessage({ type: "init", bodies, params } satisfies WorkerIn);
    worker.postMessage({ type: "play", playing } satisfies WorkerIn);
  }, []); // eslint-disable-line

  // parameter updates
  useEffect(() => { worker.postMessage({ type: "updateParams", params: { dt } } satisfies WorkerIn); }, [dt, worker]);
  useEffect(() => { worker.postMessage({ type: "updateParams", params: { G } } satisfies WorkerIn); }, [G, worker]);
  useEffect(() => { worker.postMessage({ type: "updateParams", params: { eps } } satisfies WorkerIn); }, [eps, worker]);
  useEffect(() => { worker.postMessage({ type: "updateParams", params: { method } } satisfies WorkerIn); }, [method, worker]);
  useEffect(() => { worker.postMessage({ type: "play", playing } satisfies WorkerIn); }, [playing, worker]);

  // simple “speed” control: just ask worker to step extra each paint
  useEffect(() => {
    const id = setInterval(() => {
      if (!playing) return;
      if (stepsPerFrame > 1) worker.postMessage({ type: "step", steps: stepsPerFrame - 1 } satisfies WorkerIn);
    }, 16); // ~60Hz
    return () => clearInterval(id);
  }, [stepsPerFrame, playing, worker]);

  const reseed = () => {
    const bodies = randomBodies2D(count);
    worker.postMessage({ type: "replaceBodies", bodies } satisfies WorkerIn);
    canvasAPI.current?.resetCamera();
  };

  return (
    <div className="app">
      <div className="panel">
        <h3>N-Body 2D (Canvas + Worker)</h3>

        <div className="row">
          <button onClick={() => setPlaying(p => !p)}>{playing ? "Pause" : "Play"}</button>
          <button className="secondary" onClick={() => worker.postMessage({ type: "step", steps: 1 } satisfies WorkerIn)}>
            Step
          </button>
          <button className="secondary" onClick={reseed}>Reseed</button>
          <button className="secondary" onClick={() => canvasAPI.current?.resetCamera()}>Reset View</button>
        </div>

        <div className="col">
          <div>
            <label>Bodies (N)</label>
            <input type="number" min={1} step={1} value={count} onChange={(e)=>setCount(Math.max(1, Number(e.target.value)))} />
          </div>
          <div>
            <label>Apply N</label>
            <button className="secondary" onClick={()=>{ setPlaying(false); const b = randomBodies2D(count); worker.postMessage({type:"replaceBodies", bodies:b} satisfies WorkerIn); }}>
              Apply
            </button>
          </div>
          <div>
            <label>dt</label>
            <input type="number" step="0.0001" value={dt} onChange={(e)=>setDt(Number(e.target.value))}/>
          </div>
          <div>
            <label>G</label>
            <input type="number" step="0.001" value={G} onChange={(e)=>setG(Number(e.target.value))}/>
          </div>
          <div>
            <label>ε (softening)</label>
            <input type="number" step="0.0001" value={eps} onChange={(e)=>setEps(Number(e.target.value))}/>
          </div>
          <div>
            <label>Method</label>
            <select value={method} onChange={(e)=>setMethod(e.target.value as any)}>
              <option value="leapfrog">Leapfrog (symplectic)</option>
              <option value="rk4">RK4 (4th order)</option>
            </select>
          </div>
          <div>
            <label>Speed (steps/frame)</label>
            <input type="number" min={1} step={1} value={stepsPerFrame} onChange={(e)=>setSPF(Math.max(1, Number(e.target.value)))}/>
          </div>
        </div>

        <div className="sep"></div>
        <p className="small">
          Drag = pan · Wheel/Pinch = zoom · Double-click canvas = reset view
        </p>
        <p className="small">
          Leapfrog keeps energy bounded on long runs; RK4 is smoother short-term but slowly drifts.
        </p>
      </div>

      <Canvas2D onReady={onCanvasReady}/>
    </div>
  );
}