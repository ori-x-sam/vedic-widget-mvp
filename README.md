# Vedic Widget

An iOS widget-first Vedic astrology app. The widget *is* the product — the
app screen exists to configure and elaborate what the widget shows.

- **Platform:** iOS 17+ (WidgetKit, SwiftUI, SwiftData)
- **Language:** Swift 5.9+
- **Backend:** none. All calculations run on-device via Swiss Ephemeris.
- **Paywall:** none in v1.

---

## Repo layout

```
VedicWidget/
├─ Package.swift              # SwiftPM manifest (CLI + tests)
├─ project.yml                # xcodegen spec for the iOS project
├─ VedicCore/                 # Framework shared by app + widget
│  ├─ Ephemeris/              # Swiss Ephemeris C sources + Swift bridge
│  ├─ Interpretation/         # GuidanceEngine, NakshatraContent, TithiContent, ScrubCopy
│  ├─ Models/                 # PanchangaData, DailyGuidance, SharedProfile, AppGroup
│  └─ UI/                     # ArcShape, WidgetColor
├─ VedicWidget/               # Main iOS app (onboarding, Today view, Settings)
├─ VedicWidgetExtension/      # WidgetKit extension (small / medium / large)
├─ Tests/                     # VedicCoreTests (XCTest)
├─ CLI/                       # macOS CLI for ephemeris verification
└─ preview/                   # HTML/JS design preview (iteration sandbox)
```

---

## Build

### 1. Install xcodegen

```bash
brew install xcodegen
```

### 2. Generate the Xcode project

```bash
cd VedicWidget
xcodegen generate
open VedicWidget.xcodeproj
```

The generated project contains three targets:

- **VedicCore** — framework (Swift + vendored Swiss Ephemeris C)
- **VedicWidget** — main iOS app
- **VedicWidgetExtension** — widget extension
- **VedicCoreTests** — unit tests

### 3. Configure signing

In Xcode, pick a Development Team for each target. Then:

- Both **VedicWidget** and **VedicWidgetExtension** must have the
  **App Groups** capability enabled.
- The App Group identifier is `group.com.yourteam.vedicwidget`. Change it
  in three places if you fork:
  1. `VedicCore/Models/AppGroup.swift`
  2. `VedicWidget/VedicWidget.entitlements`
  3. `VedicWidgetExtension/VedicWidgetExtension.entitlements`
- Bundle identifiers (`com.yourteam.*`) in `project.yml` should match your
  Apple Developer team prefix. Edit `project.yml` and re-run
  `xcodegen generate`.

### 4. Run

Pick the **VedicWidget** scheme, choose an iOS 17 simulator, and ⌘R.
After onboarding, long-press the home screen to add the widget.

---

## Architecture

### Why a framework for shared code?

The widget extension cannot directly read SwiftData from the app's sandbox.
The app writes a `SharedProfile` snapshot to App Group `UserDefaults` at
onboarding time (and on profile edits); the widget reads it inside its
`TimelineProvider`.

### Static widget, interactive app

iOS 17 widgets only support `Button` / `Toggle` via `AppIntent` — no
continuous gestures. So:

- The **widget** renders a non-interactive `StaticTimeArc` that auto-refreshes
  each hour as the `TimelineProvider` hands off new entries.
- The **Today view** (opened when the widget is tapped) contains the
  draggable `InteractiveArc` scrubber.

Both share the same quadratic-bezier arc geometry via `ArcShape` in
`VedicCore/UI/` — the HTML preview uses the same control points
(P0=6,42 · P1=150,-14 · P2=294,42 in a 300×54 coord space) so design
iterations transfer without re-measuring.

### Copy rules

- **No Sanskrit in user-facing copy.** All strings read direct, Co-Star
  style — never poetic.
- **Headlines ≤ 60 chars.** Enforced by `GuidanceEngineTests`.
- Nakshatra/tithi are internal identifiers. The user sees interpreted
  guidance, never names.

---

## Tests

```bash
swift test                   # SwiftPM (requires Xcode toolchain)
# or via Xcode: ⌘U with VedicWidget scheme
```

`VedicCoreTests` covers:

- `GuidanceEngineTests` — 27 × 30 matrix; no Sanskrit leaks, headline
  length, non-empty detail.
- `PanchangaCalculatorTests` — Swiss-Ephemeris integration (skips if
  ephemeris files aren't available), rahu-kalam weekday table alignment,
  abhijit muhurta = solar noon ± 24 min, ScrubCopy classification.

---

## Design iteration

`preview/index.html` is the fast-feedback sandbox. Open it in a browser
and edit CSS/JS to iterate on widget layouts before porting to Swift.
Widget geometry matches Swift 1:1 via the shared arc control points.

---

## Ship checklist

- [ ] Replace `com.yourteam` prefix throughout (`project.yml`,
      entitlements, `AppGroup.swift`).
- [ ] App icon set (1024 master + home-screen / settings / spotlight).
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) — app is zero-network, so
      this is mostly empty, but the manifest itself is required.
- [ ] TestFlight build, internal + external testers.
- [ ] App Store Connect record, screenshots (5.5" and 6.7"), description.
- [ ] Widget screenshots specifically — small, medium, large.

---

## Credits

Built with the [Swiss Ephemeris](https://www.astro.com/swisseph/) (AGPL-3.0
or commercial license — see `VedicCore/Ephemeris/swisseph/LICENSE`).
All calculations on-device. Zero backend.
