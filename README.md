[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/RIYAN112233/makefun-stealth-entry/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/RIYAN112233/makefun-stealth-entry/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

# Nightglass — a stealth game

A top-down stealth game built for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759). Slip through a quiet museum at night: learn the sentries' patrols, stay out of their amber vision cones, use crates and plants as cover, and reach the glowing exit unseen. Get spotted and the alarm meter climbs — break line of sight to let it fall again.

- Two levels: **The Gallery** and **The Vault Wing** (faster patrols, longer cones)
- Detection meter that rises in a cone and decays when hidden — recovery is possible
- WASD / arrow keys to move, R to restart, S to save a screenshot, Enter for the next level
- Vanilla JavaScript + canvas, no libraries, no network — open `game/index.html` from any static server and play

## Play

```sh
node serve.ts
# open http://localhost:8080
```

Staged demo scenes: `game/index.html?scene=1..4`.
