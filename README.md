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

## Gallery preview assets

Starting with `step-studio`, **every new template and every gallery-material refresh must include both a static cover and a recorded preview video**. Existing templates are grandfathered until their next gallery-material refresh; do not fabricate recordings for them.

Use the same fixed filenames for website and mobile templates; no extra manifest or configurable filename is required:

```text
sites/<id>/preview/cover.png
sites/<id>/preview/video.mp4
apps/<id>/preview/cover.png
apps/<id>/preview/video.mp4
```

| File relative to the template directory | Required format | Studio usage |
| --- | --- | --- |
| `preview/cover.png` | A real PNG image, stored separately from the video | Default gallery cover, loading poster, and playback-failure fallback |
| `preview/video.mp4` | MP4 containing H.264 video, no audio track, with the `moov` atom before `mdat` (faststart) | Muted, looping, inline playback on gallery hover/focus, in the selected composer preview, and in the detail preview |

### Material requirements

- Check both files into this repository alongside the template. A desktop path, external link, GIF, or Git LFS pointer is not a replacement for either file.
- Record the actual template at the revision being submitted. The cover must show the same template and presentation as the video; it may be extracted from a representative video frame but must remain a separate image file. Do not include secrets, personal data, or unrelated desktop content.
- Preserve the template's aspect ratio instead of stretching the material. A 1280-pixel-wide capture at 30 fps is recommended for desktop sites; portrait captures are allowed for mobile templates. Recommended limits: 5–30 seconds and at most 10 MiB for video, at most 1 MiB for the cover.
- When a template's appearance or demonstrated behavior changes, update both assets in the same change. Keep the fixed filenames and describe the refreshed recording in the template README.
- Preview assets are gallery material, not runtime dependencies. Website code must not depend on them; publishing the website still only requires its entry point and runtime assets. A browser recording of a mobile template is not proof that its native APK works.

### Submission and Studio integration checklist

- [ ] Both `preview/cover.png` and `preview/video.mp4` exist and can be decoded; verify video playback and seeking in a browser, not just the extension.
- [ ] The video has no audio, supports faststart, and can loop; the separate cover matches its content and aspect ratio.
- [ ] Material matches the submitted template version; rights/credits and the template README are up to date.
- [ ] Use this repository as the source of truth. For Studio's current static-asset deployment, copy `preview/cover.png` to `public/workspace-templates/covers/<id>.png` and `preview/video.mp4` to `public/workspace-templates/videos/<id>.mp4` in the Studio app, preserving the bytes.
- [ ] Set the Studio catalog's `cover` to `/workspace-templates/covers/<id>.png` and `previewVideo` to `/workspace-templates/videos/<id>.mp4`. Do not use `coverHover`/GIF for a new recorded preview.
- [ ] After the template change is merged, pin the Studio catalog to a commit or release tag that includes the template and both preview files; do not reuse a release tag that predates them. This repository does not automatically sync assets or publish the Studio catalog.
- [ ] Verify idle cover, hover/focus playback, selected-composer playback, and static-cover fallback when video loading fails.

Reference implementation: [Step Studio preview notes](./sites/step-studio/README.md#studio-模板预览素材).

## License

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
