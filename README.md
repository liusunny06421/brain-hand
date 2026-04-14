# Brain Hand

Control a 3D brain with your hands. No mouse, no keyboard — just a webcam and gestures.

## What it does

Point your webcam at your hands and use natural gestures to explore an interactive 3D model of the human brain:

- **Pinch and drag** — Rotate the brain in any direction
- **Two-hand pinch** — Zoom in and out
- **Spread both hands apart** — Split the hemispheres open
- **Hold an open palm still** — Reset the view

The brain is rendered from a real neuroscience template (fsaverage5 from FreeSurfer) with cascade wave activations that ripple across the cortex surface.

## How to run it

You'll need [Node.js](https://nodejs.org/) installed (version 18 or newer).

1. Clone this repo and open it:
   ```
   git clone https://github.com/liusunny06421/brain-hand.git
   cd brain-hand
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the app:
   ```
   npm run dev
   ```

4. Open **http://localhost:5173** in Chrome

5. Allow camera access when prompted

6. Hold up your hands and start exploring!

## Gesture guide

| Gesture | What it does |
|---------|-------------|
| Pinch thumb + index, drag hand | Rotate the brain |
| Both hands pinch, move apart/together | Zoom in / out |
| Open both hands wide, spread apart | Explode hemispheres |
| Open palm, hold still for 1 second | Reset to default view |

## How it works

- **Hand tracking** runs in your browser using Google's MediaPipe — nothing is sent to a server
- **Brain model** is the fsaverage5 cortical surface from FreeSurfer (Harvard/MIT), a standard template used in neuroscience research
- **3D rendering** uses Three.js with React Three Fiber
- **Neural activations** are simulated cascade waves that ripple across the brain surface

## Browser support

Works best in **Chrome** or **Edge** on desktop. Requires a webcam. Mobile is not supported yet.

## License

Brain mesh data: fsaverage5 from [FreeSurfer](https://surfer.nmr.mgh.harvard.edu/) (Harvard/MIT), freely available for research and educational use.
