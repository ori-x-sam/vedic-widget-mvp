import SwiftUI
import WidgetKit
import VedicCore

/// Medium widget (4×2). Headline + wear/eat + static hour arc at bottom.
struct MediumWidgetView: View {
    let entry: VedicTimelineEntry

    private var timezone: TimeZone {
        SharedProfileStore.read(appGroup: AppGroup.identifier)?.timeZone ?? .current
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(entry.guidance.headline)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.9)

            HStack(spacing: 20) {
                WearLine(color: entry.guidance.color)
                Text("Eat: ")
                    .font(.system(size: 12))
                    .foregroundStyle(.white.opacity(0.6))
                + Text(entry.guidance.food)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white)
            }

            StaticTimeArc(
                now: entry.date,
                avoidWindow: entry.guidance.avoidWindow,
                bestWindow: entry.guidance.strongestWindow,
                timezone: timezone
            )
            .frame(height: 46)
        }
    }
}

struct WearLine: View {
    let color: String

    var body: some View {
        HStack(spacing: 5) {
            Text("Wear: ")
                .font(.system(size: 12))
                .foregroundStyle(.white.opacity(0.6))
            RoundedRectangle(cornerRadius: 2)
                .fill(WidgetColor.from(color))
                .frame(width: 9, height: 9)
                .overlay(
                    RoundedRectangle(cornerRadius: 2)
                        .stroke(Color.white.opacity(0.18), lineWidth: 1)
                )
            Text(color)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white)
        }
    }
}
