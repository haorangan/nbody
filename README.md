# N-Body 2D (React + Canvas + Web Worker)

Tiny, fast **2D n-body gravity** demo. Physics runs in a **Web Worker**; rendering is **Canvas 2D**.  
Default integrator: **Leapfrog (symplectic)** with a **toggle to RK4**.

> **Live demo:** _(add your GitHub Pages link here)_

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

<img width="1512" height="858" alt="Screenshot 2025-09-07 at 8 39 40 PM" src="https://github.com/user-attachments/assets/213293f9-ad24-4382-8f11-cdc1f83af3b2" />
