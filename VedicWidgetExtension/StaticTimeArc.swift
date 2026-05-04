import SwiftUI
import VedicCore

/// Non-interactive time-of-day arc shown on the medium + large widgets.
///
/// Widgets on iOS 17 can't do continuous drag — only Button/Toggle via
/// AppIntent. So the widget shows a *static* visual of "where in the day
/// we are", which auto-refreshes each hour as TimelineProvider hands off
/// new entries. The interactive scrubber lives on TodayView inside the app.
struct StaticTimeArc: View {
    let now: Date
    let avoidWindow: DateInterval
    let bestWindow: DateInterval
    let timezone: TimeZone

    private var minutesIntoDay: Double {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timezone
        let startOfDay = cal.startOfDay(for: now)
        return now.timeIntervalSince(startOfDay) / 60.0
    }

    private var tAtNow: CGFloat {
        CGFloat(max(0, min(1439, minutesIntoDay)) / 1440.0)
    }

    private func t(for date: Date) -> CGFloat {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timezone
        let startOfDay = cal.startOfDay(for: date)
        let minutes = date.timeIntervalSince(startOfDay) / 60.0
        return CGFloat(max(0, min(1440, minutes)) / 1440.0)
    }

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height

            ZStack(alignment: .topLeading) {
                // Base arc
                ArcShape(start: 0, end: 1)
                    .stroke(Color.white.opacity(0.12), style: .init(lineWidth: 1.5, lineCap: .round))

                // Avoid segment
                ArcShape(start: t(for: avoidWindow.start), end: t(for: avoidWindow.end))
                    .stroke(Color(red: 1.0, green: 0.42, blue: 0.35),
                            style: .init(lineWidth: 2.2, lineCap: .round))
                    .opacity(0.9)

                // Best segment
                ArcShape(start: t(for: bestWindow.start), end: t(for: bestWindow.end))
                    .stroke(Color(red: 0.29, green: 0.87, blue: 0.50),
                            style: .init(lineWidth: 2.2, lineCap: .round))
                    .opacity(0.9)

                // Current-hour icon
                let iconPoint = ArcShape.point(on: tAtNow, in: CGSize(width: w, height: h))
                let iconSize: CGFloat = 16
                Circle()
                    .fill(iconGradient)
                    .frame(width: iconSize, height: iconSize)
                    .overlay(Circle().stroke(Color.white.opacity(0.16), lineWidth: 3))
                    .shadow(color: .black.opacity(0.35), radius: 2, y: 1)
                    .position(x: iconPoint.x, y: iconPoint.y)

                // "Now · h:mm a" label above icon
                Text(nowLabel)
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.9))
                    .position(x: iconPoint.x, y: max(8, iconPoint.y - 14))

                // End labels
                Text("12a")
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.35))
                    .position(x: 10, y: h - 4)
                Text("12p")
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.35))
                    .position(x: w - 12, y: h - 4)
            }
        }
    }

    private var nowLabel: String {
        let f = DateFormatter()
        f.timeZone = timezone
        f.dateFormat = "h:mm a"
        f.amSymbol = "am"; f.pmSymbol = "pm"
        return "Now · " + f.string(from: now)
    }

    /// Icon tone per time-of-day.
    private var iconGradient: RadialGradient {
        let minute = minutesIntoDay
        let hour = minute / 60.0
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
            startRadius: 0.5,
            endRadius: 10
        )
    }
}

// ArcShape lives in VedicCore/UI/ArcShape.swift (shared with app target)
