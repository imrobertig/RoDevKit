# RoDevKit

**An open-source toolkit for Roblox developers to model game economies and understand progression pacing.**

RoDevKit is a lightweight, browser-based economy simulator. It helps you test upgrade costs, income growth, and estimated time-to-purchase before tuning an incremental or simulator game.

## Features

- Editable starting cash, income rate, upgrade cost, cost multiplier, and income multiplier
- Estimated progression time and total upgrade cost
- Progression curve chart
- Upgrade-by-upgrade breakdown
- Rule-of-thumb balance checks
- CSV export for the modeled upgrade path
- Responsive dark interface
- No account, server, build step, or external dependency required

## Run locally

1. Download or clone this repository.
2. Open `index.html` in your browser.

That's it. The app uses plain HTML, CSS, and JavaScript.

## GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch** and choose your default branch and `/ (root)`.
4. Save. GitHub will provide the published site URL when deployment finishes.

## How the model works

For each upgrade, the simulator estimates the wait as:

`max(0, (upgrade cost - current cash) / current income per second)`

After each purchase, the income rate is multiplied by the configured income multiplier. Upgrade costs grow by the configured cost multiplier. This is a deliberately simple model: it assumes players earn continuously, buy upgrades in order, and do not spend cash on anything else.

## Limitations

- The simulator does not predict real retention or player behavior.
- It models one linear upgrade path, not branching trees, offline income, rebirths, or multiple currencies.
- Results are only as useful as the assumptions entered.

## Roadmap

- [ ] Multiple upgrade paths
- [ ] Rebirth / prestige modeling
- [ ] Upgrade tree editor
- [ ] Save and load scenarios
- [ ] Automated balance comparison between scenarios

## Contributing

Issues and pull requests are welcome. Keep the tool dependency-light and explain any changes to the economy model with examples.

## License

MIT — see [`LICENSE`](LICENSE).
