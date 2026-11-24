---
description: Safely verifies no secrets are staged, commits, pushes to main, and shares the GitHub Actions Play & Approve status.
mode: subagent
---
Run `git status` to ensure zero `.env` or `.key` files are staged, then run `git add -A && git commit -m "feat(video): update 3-part video" && git push origin main`. Report the GitHub Actions URL cleanly.
