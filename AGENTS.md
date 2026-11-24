# YUNA Video Studio — OpenCode Director Rules
- NEVER run `npm install` or `remotion render` locally on the phone.
- NEVER write secrets, `.env`, or API keys into tracked files.
- Always break 3-minute videos into `Part1` (60s), `Part2` (60s), and `Part3` (60s) inside `src/Root.tsx` & `src/parts/`.
- Never use CSS `transition` or `@keyframes`; use Remotion `useCurrentFrame()`, `spring()`, `interpolate()`.
- After editing, commit and push to `main` so GitHub Actions renders all 3 chunks + merges `final_3min.mp4` cleanly.
