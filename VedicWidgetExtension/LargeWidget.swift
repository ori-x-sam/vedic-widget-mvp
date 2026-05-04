import SwiftUI
import WidgetKit
import VedicCore

/// Large widget (4×4). Everything the medium has, plus detail paragraph
/// and the two clarified time windows.
struct LargeWidgetView: View {
    let entry: VedicTimelineEntry

    private var timezone: TimeZone {
        SharedProfileStore.read(appGroup: AppGroup.identifier)?.timeZone ?? .current
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(entry.guidance.headline)
                .font(.system(size: 19, weight: .semibold))
                .foregroundStyle(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.9)

            Text(entry.guidance.detailedText)
                .font(.system(size: 12.5))
                .foregroundStyle(.white.opacity(0.72))
                .lineLimit(4)
                .minimumScaleFactor(0.95)
                .lineSpacing(1.5)

            Divider().background(Color.white.opacity(0.08))

            HStack(spacing: 24) {
                AttrStack(label: "WEAR", value: entry.guidance.color, swatchColor: WidgetColor.from(entry.guidance.color))
                AttrStack(label: "EAT",  value: entry.guidance.food,  swatchColor: nil)
            }

            Divider().background(Color.white.opacity(0.08))

            VStack(alignment: .leading, spacing: 8) {
                WindowRow(
                    accent: Color(red: 1.0, green: 0.42, blue: 0.35),
                    title: "Hold off on decisions",
                    sub:   "Skip commitments, sign-offs, launches.",
                    range: format(entry.guidance.avoidWindow, tz: timezone)
                )
                WindowRow(
                    accent: Color(red: 0.29, green: 0.87, blue: 0.50),
                    title: "Push for what matters",
                    sub:   "Start the thing, send the ask, ship it.",
                    range: format(entry.guidance.strongestWindow, tz: timezone)
                )
            }

            Spacer(minLength: 0)

            StaticTimeArc(
                now: entry.date,
                avoidWindow: entry.guidance.avoidWindow,
                bestWindow: entry.guidance.strongestWindow,
                timezone: timezone
            )
            .frame(height: 50)
        }
    }

    private func format(_ interval: DateInterval, tz: TimeZone) -> String {
        let f = DateFormatter()
        f.timeZone = tz
        f.dateFormat = "h:mm a"
        f.amSymbol = "am"; f.pmSymbol = "pm"
        return "\(f.string(from: interval.start)) – \(f.string(from: interval.end))"
    }
}

private struct AttrStack: View {
    let label: String
    let value: String
    let swatchColor: Color?

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(.system(size: 9, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.4))
                .tracking(0.8)
            HStack(spacing: 6) {
                if let swatchColor {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(swatchColor)
                        .frame(width: 11, height: 11)
                        .overlay(
                            RoundedRectangle(cornerRadius: 2)
                                .stroke(Color.white.opacity(0.18), lineWidth: 1)
                        )
                }
                Text(value)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white)
            }
        }
    }
}

private struct WindowRow: View {
    let accent: Color
    let title: String
    let sub: String
    let range: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Circle().fill(accent).frame(width: 7, height: 7).padding(.top, 5)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundStyle(accent.opacity(0.95))
                    .tracking(0.5)
                Text(sub)
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.6))
            }
            Spacer(minLength: 4)
            Text(range)
                .font(.system(size: 11, design: .monospaced))
                .foregroundStyle(.white.opacity(0.85))
                .lineLimit(1)
                .fixedSize(horizontal: true, vertical: false)
        }
    }
}
