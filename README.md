# studio-template

Curated front-end and mobile templates for StepFun Studio workspace gallery and agent init flows.

## Sites

| ID | Scene | Notes |
| --- | --- | --- |
| `space-dash` | Games | Three.js NEON DASH (provided demo) |
| `aurora-launch` | Marketing | Apple-inspired launch page |
| `prism-studio` | Tools | Google Material–inspired dashboard |
| `atelier` | Sites | Editorial portfolio |
| `stepfun-3d` | Creative | 3D digital pavilion |
| `step-studio` | Sites | Brand & digital design studio ([demo notes](./sites/step-studio/README.md)) |

Paths: `sites/<id>/` with `index.html` entry.

## Mobile apps

- `pocket-planet` — original Pocket Planet Explorer: camera field notes, optional tilt rover controls, coordinate-inspired exploration, and native haptic feedback. Path: `apps/pocket-planet/`.
- Read [the mobile README](./apps/pocket-planet/README.md) first: pinned pnpm install, Android JDK/SDK bootstrap (explicit license review), validation, and signed-debug APK build. Primary artifact: `apps/pocket-planet/artifacts/pocket-planet.apk`; this is an Android app template, not a website publishing flow.
- New mobile catalog entries use Git ref `main` until a release tag includes their files. The existing `v1` tag does not contain this template.
- Browser preview is a local, accessible fallback demo, not proof of native device support. APKs cannot install on iOS; iOS requires its own signing/distribution setup.

## License

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
