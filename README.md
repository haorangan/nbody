<img width="1512" height="858" alt="Screenshot 2025-09-07 at 8 39 40 PM" src="https://github.com/user-attachments/assets/213293f9-ad24-4382-8f11-cdc1f83af3b2" />

# N-Body 2D (React + Canvas + Web Worker)

Tiny, fast **2D n-body gravity** demo. Physics runs in a **Web Worker**; rendering is **Canvas 2D**.  
Default integrator: **Leapfrog (symplectic)** with a **toggle to RK4**.

---

## Features
- 2D gravitational n-body with softening \( \varepsilon \) (O(N²))
- **Leapfrog** (stable long-run) + **RK4** (4th-order) toggle
- Worker-based physics → smooth UI
- Camera: **pan** (drag / WASD), **zoom** (wheel / + / −), **Reset view** (double-click), **Fit to data**
- Energy HUD: K, U, **E = K+U**

---

## Quick Start
```bash
git clone https://github.com/<you>/nbody-2d-web.git
cd nbody-2d-web
npm install
npm run dev      # open the printed localhost URL
```

## Usage

Click Reseed → Play.

- Pan: drag or W/A/S/D (hold Shift for larger steps)
- Zoom: mouse wheel or + / −
- Reset view: double-click canvas
- Fit to data: button in sidebar

## Controls

Bodies (N): 200–800 is a good start

dt: time step (e.g. 0.001)

G: gravity (1.0 → 2.0)

ε: softening (0.01)

Method: Leapfrog / RK4

Steps/frame: advance multiple physics steps per animation frame
