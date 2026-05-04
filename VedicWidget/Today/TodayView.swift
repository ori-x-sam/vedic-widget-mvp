import SwiftUI
import CoreLocation
import VedicCore

/// The main app screen — what the user lands on when they tap the widget.
/// Shows today's guidance + the draggable time-of-day scrubber
/// (which the widget itself can't have, per iOS 17 widget constraints).
struct TodayView: View {
    let profile: UserProfile

    @State private var guidance: DailyGuidance?
    @State private var loadError: String?
    @State private var selectedTab: TodayTab = .today

    /// Scrubber position. Minutes since midnight in the profile's timezone.
    /// Starts at "now" on appear.
    @State private var scrubMinutes: Double = 0

    /// Foreground-only monitor that fires a haptic when "now" crosses into
    /// or out of the best/avoid window. Widgets can't vibrate, so this
    /// lives on the app side.
    @StateObject private var windowMonitor = WindowTransitionMonitor()

    enum TodayTab: String, CaseIterable { case today = "Today", tomorrow = "Tomorrow" }

    /// Timezone for daily windows. Reads from the shared profile so we pick up
    /// current-location timezone when CoreLocation has delivered one; falls
    /// back to birth timezone otherwise.
    private var timezone: TimeZone {
        if let snap = SharedProfileStore.read(appGroup: AppGroup.identifier) {
            return snap.todayTimeZone
        }
        return TimeZone(identifier: profile.birthTimezone) ?? .current
    }

    /// Coordinate for daily windows — current location when available, birth
    /// otherwise. No user toggle; graceful degradation only.
    private var coordinate: CLLocationCoordinate2D {
        if let snap = SharedProfileStore.read(appGroup: AppGroup.identifier) {
            return snap.todayCoordinate
        }
        return CLLocationCoordinate2D(latitude: profile.birthLatitude, longitude: profile.birthLongitude)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header

                tabToggle

                if let g = guidance {
                    GuidanceContent(
                        guidance: g,
                        timezone: timezone,
                        scrubMinutes: $scrubMinutes
                    )
                } else if let err = loadError {
                    VStack(spacing: 10) {
                        Text("Couldn't load today's guidance")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                        Text(err)
                            .font(.system(size: 13))
                            .foregroundStyle(.white.opacity(0.5))
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 40)
                } else {
                    ProgressView().tint(.white)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, 40)
                }
            }
            .padding(.horizontal, 24)
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .background(Color.black.ignoresSafeArea())
        .onAppear {
            Telemetry.bump(.todayOpens)
            // Ask for "when in use" location at first Today open; provider
            // handles already-granted / already-denied cases gracefully.
            CurrentLocationProvider.shared.requestIfNeeded()
            windowMonitor.start()
            loadGuidance()
        }
        .onDisappear { windowMonitor.stop() }
        .onChange(of: selectedTab) { _, newValue in
            // Only the tomorrow toggle bump fires here — the initial view
            // starts on .today and doesn't count.
            if newValue == .tomorrow { Telemetry.bump(.tomorrowToggles) }
            loadGuidance()
        }
    }

    private var header: some View {
        HStack {
            Text(dateHeading)
                .font(.system(size: 13, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.5))
                .tracking(0.8)
            Spacer()
        }
    }

    private var tabToggle: some View {
        HStack(spacing: 0) {
            ForEach(TodayTab.allCases, id: \.self) { tab in
                Button {
                    selectedTab = tab
                } label: {
                    Text(tab.rawValue)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(tab == selectedTab ? .white : .white.opacity(0.5))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(
                            tab == selectedTab
                                ? Color.white.opacity(0.12)
                                : Color.clear
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(3)
        .background(Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private var dateHeading: String {
        let f = DateFormatter()
        f.timeZone = timezone
        f.dateFormat = "EEEE · MMM d"
        return f.string(from: selectedTab == .tomorrow
                        ? Date().addingTimeInterval(86400)
                        : Date())
    }

    private func loadGuidance() {
        loadError = nil
        guidance = nil
        let targetDate = selectedTab == .tomorrow
            ? Date().addingTimeInterval(86400)
            : Date()

        Task.detached(priority: .userInitiated) {
            do {
                let calc = PanchangaCalculator()
                let panchang = try calc.calculate(
                    for: targetDate,
                    coordinate: coordinate,
                    timezone: timezone
                )
                let g = GuidanceEngine.shared.guidance(from: panchang)
                await MainActor.run {
                    self.guidance = g
                    self.scrubMinutes = minutesIntoDay(Date(), in: timezone)
                    // Re-prime the transition monitor with the freshly-loaded
                    // windows so haptics track the correct intervals.
                    if selectedTab == .today {
                        windowMonitor.updateWindows(best: g.strongestWindow, avoid: g.avoidWindow)
                    }
                }
            } catch {
                await MainActor.run {
                    self.loadError = error.localizedDescription
                }
            }
        }
    }
}

// MARK: - Minutes helper

private func minutesIntoDay(_ date: Date, in tz: TimeZone) -> Double {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = tz
    let start = cal.startOfDay(for: date)
    return date.timeIntervalSince(start) / 60.0
}

// MARK: - Guidance body

private struct GuidanceContent: View {
    let guidance: DailyGuidance
    let timezone: TimeZone
    @Binding var scrubMinutes: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            HeadlineBlock(
                guidance: guidance,
                timezone: timezone,
                scrubMinutes: scrubMinutes
            )

            AttributesRow(guidance: guidance)

            WindowsSection(guidance: guidance, timezone: timezone)

            Text(detailText)
                .font(.system(size: 15))
                .foregroundStyle(.white.opacity(0.75))
                .lineSpacing(5)

            ScrubberSection(
                guidance: guidance,
                timezone: timezone,
                minutes: $scrubMinutes
            )
            .padding(.top, 4)
        }
    }

    private var detailText: String {
        // When the user is near "now", show the full engine-generated detail.
        // When scrubbing into a time window, surface a shorter context line.
        let now = minutesIntoDay(Date(), in: timezone)
        if abs(scrubMinutes - now) < 5 {
            return guidance.detailedText
        }
        return ScrubCopy.detail(for: Int(scrubMinutes), guidance: guidance, timezone: timezone)
    }
}

// MARK: - Headline block (updates with scrub)

private struct HeadlineBlock: View {
    let guidance: DailyGuidance
    let timezone: TimeZone
    let scrubMinutes: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(headline)
                .font(.system(size: 32, weight: .semibold))
                .foregroundStyle(.white)
                .lineSpacing(2)
                .minimumScaleFactor(0.9)
            Text(modifier)
                .font(.system(size: 16))
                .foregroundStyle(.white.opacity(0.55))
                .lineSpacing(3)
        }
    }

    private var headline: String {
        let now = minutesIntoDay(Date(), in: timezone)
        if abs(scrubMinutes - now) < 5 { return guidance.headline }
        return ScrubCopy.headline(for: Int(scrubMinutes), guidance: guidance, timezone: timezone)
    }

    private var modifier: String {
        let now = minutesIntoDay(Date(), in: timezone)
        if abs(scrubMinutes - now) < 5 { return "Lighter day — mental work over physical grind." }
        return ScrubCopy.modifier(for: Int(scrubMinutes))
    }
}

// MARK: - Attributes row

private struct AttributesRow: View {
    let guidance: DailyGuidance

    var body: some View {
        HStack(spacing: 28) {
            AttributePill(label: "WEAR", value: guidance.color, swatch: WidgetColor.from(guidance.color))
            AttributePill(label: "EAT",  value: guidance.food,  swatch: nil)
            Spacer()
        }
        .padding(.top, 10)
        .padding(.bottom, 2)
        .overlay(alignment: .top) {
            Rectangle().fill(Color.white.opacity(0.08)).frame(height: 1)
        }
    }
}

private struct AttributePill: View {
    let label: String
    let value: String
    let swatch: Color?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.4))
                .tracking(1.0)
            HStack(spacing: 8) {
                if let swatch {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(swatch)
                        .frame(width: 12, height: 12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 3)
                                .stroke(Color.white.opacity(0.18), lineWidth: 1)
                        )
                }
                Text(value)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(.white)
            }
        }
    }
}

// MARK: - Windows section

private struct WindowsSection: View {
    let guidance: DailyGuidance
    let timezone: TimeZone

    var body: some View {
        VStack(spacing: 10) {
            WindowCard(
                accent: Color(red: 1.0, green: 0.42, blue: 0.35),
                title: "Hold off on decisions",
                subtitle: "Avoid commitments, sign-offs, launches during this window.",
                range: format(guidance.avoidWindow)
            )
            WindowCard(
                accent: Color(red: 0.29, green: 0.87, blue: 0.50),
                title: "Push for what matters",
                subtitle: "Start the thing, send the ask, ship it.",
                range: format(guidance.strongestWindow)
            )
        }
    }

    private func format(_ i: DateInterval) -> String {
        let f = DateFormatter()
        f.timeZone = timezone
        f.dateFormat = "h:mm a"
        f.amSymbol = "am"; f.pmSymbol = "pm"
        return "\(f.string(from: i.start)) – \(f.string(from: i.end))"
    }
}

private struct WindowCard: View {
    let accent: Color
    let title: String
    let subtitle: String
    let range: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Circle().fill(accent).frame(width: 8, height: 8).padding(.top, 6)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(accent.opacity(0.95))
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(.white.opacity(0.55))
                    .lineSpacing(2)
            }
            Spacer(minLength: 8)
            Text(range)
                .font(.system(size: 13, design: .monospaced))
                .foregroundStyle(.white.opacity(0.85))
                .padding(.top, 2)
        }
        .padding(14)
        .background(Color.white.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(accent.opacity(0.25), lineWidth: 0)
        )
        .overlay(alignment: .leading) {
            Rectangle().fill(accent).frame(width: 3)
                .clipShape(RoundedRectangle(cornerRadius: 1.5))
                .padding(.vertical, 4)
        }
    }
}

// MARK: - Scrubber

private struct ScrubberSection: View {
    let guidance: DailyGuidance
    let timezone: TimeZone
    @Binding var minutes: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("SEE THE DAY")
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.6))
                    .tracking(1.0)
                Spacer()
                Text("Drag to scrub")
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.35))
            }

            InteractiveArc(
                minutes: $minutes,
                avoidWindow: guidance.avoidWindow,
                bestWindow: guidance.strongestWindow,
                timezone: timezone
            )
            .frame(height: 66)
        }
        .padding(14)
        .background(Color.white.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
        )
    }
}

private struct InteractiveArc: View {
    @Binding var minutes: Double
    let avoidWindow: DateInterval
    let bestWindow: DateInterval
    let timezone: TimeZone

    private var t: CGFloat {
        CGFloat(max(0, min(1439, minutes)) / 1440.0)
    }

    private func tFor(_ date: Date) -> CGFloat {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timezone
        let start = cal.startOfDay(for: date)
        return CGFloat(max(0, min(1440, date.timeIntervalSince(start) / 60.0)) / 1440.0)
    }

    var body: some View {
        GeometryReader { geo in
            let size = geo.size

            ZStack(alignment: .topLeading) {
                // Base
                ArcShape(start: 0, end: 1)
                    .stroke(Color.white.opacity(0.12),
                            style: .init(lineWidth: 1.5, lineCap: .round))

                // Avoid
                ArcShape(start: tFor(avoidWindow.start), end: tFor(avoidWindow.end))
                    .stroke(Color(red: 1.0, green: 0.42, blue: 0.35),
                            style: .init(lineWidth: 2.2, lineCap: .round))
                    .opacity(0.9)

                // Best
                ArcShape(start: tFor(bestWindow.start), end: tFor(bestWindow.end))
                    .stroke(Color(red: 0.29, green: 0.87, blue: 0.50),
                            style: .init(lineWidth: 2.2, lineCap: .round))
                    .opacity(0.9)

                // Icon
                let p = ArcShape.point(on: t, in: size)
                Circle()
                    .fill(iconGradient)
                    .frame(width: 24, height: 24)
                    .overlay(Circle().stroke(Color.white.opacity(0.18), lineWidth: 4))
                    .shadow(color: .black.opacity(0.4), radius: 4, y: 2)
                    .position(x: p.x, y: p.y)

                // Time label above icon
                Text(timeLabel)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundStyle(.white)
                    .position(x: p.x, y: max(12, p.y - 22))

                // End labels
                Text("12a")
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.35))
                    .position(x: 12, y: size.height - 4)
                Text("12p")
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.35))
                    .position(x: size.width / 2, y: size.height - 4)
                Text("12a")
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.35))
                    .position(x: size.width - 12, y: size.height - 4)
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { g in
                        let raw = max(0, min(size.width, g.location.x))
                        let nt = raw / size.width
                        minutes = Double(nt) * 1440.0
                    }
                    .onEnded { _ in
                        // One bump per drag session (press-down through lift-up),
                        // not per pixel of movement.
                        Telemetry.bump(.scrubSessions)
                    }
            )
        }
    }

    private var timeLabel: String {
        let m = Int(minutes)
        let h24 = m / 60
        let mm  = m % 60
        let ampm = h24 < 12 ? "am" : "pm"
        var h12 = h24 % 12; if h12 == 0 { h12 = 12 }
        return String(format: "%d:%02d %@", h12, mm, ampm)
    }

    private var iconGradient: RadialGradient {
        let hour = Double(Int(minutes)) / 60.0
        let (a, b): (Color, Color)
        if hour < 5 {
            a = Color(red: 0.89, green: 0.91, blue: 0.96)
            b = Color(red: 0.54, green: 0.58, blue: 0.71)
        } else if hour < 7 {
            a = .white
            b = Color(red: 1.0, green: 0.57, blue: 0.44)
        } else if hour < 17 {
            a = .white
            b = Color(red: 0.98, green: 0.77, blue: 0.35)
        } else if hour < 19 {
            a = .white
            b = Color(red: 1.0, green: 0.48, blue: 0.31)
        } else {
            a = Color(red: 0.89, green: 0.91, blue: 0.96)
            b = Color(red: 0.54, green: 0.58, blue: 0.71)
        }
        return RadialGradient(
            gradient: Gradient(colors: [a, b]),
            center: UnitPoint(x: 0.35, y: 0.35),
            startRadius: 0.5, endRadius: 16
        )
    }
}
