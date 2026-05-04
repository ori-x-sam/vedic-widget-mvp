import SwiftUI
import WidgetKit
import VedicCore

/// Small widget (2×2). Headline + status dot + color swatch.
/// No time arc — too cramped. Tap → deep-links to Today.
struct SmallWidgetView: View {
    let entry: VedicTimelineEntry

    private var headlineLines: [String] {
        // Two-line display: split on the first period if present.
        let h = entry.guidance.headline
        if let dot = h.firstIndex(of: ".") {
            let lead  = String(h[..<h.index(after: dot)])
            let trail = String(h[h.index(after: dot)...])
                .trimmingCharacters(in: .whitespaces)
            return trail.isEmpty ? [lead] : [lead, trail]
        }
        return [h]
    }

    private var statusLabel: String {
        entry.isInAvoidWindow ? "HOLD OFF" : "GOOD TO ACT"
    }

    private var statusColor: Color {
        entry.isInAvoidWindow
            ? Color(red: 1.0, green: 0.42, blue: 0.35)
            : Color(red: 0.29, green: 0.87, blue: 0.50)
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 1) {
                    ForEach(headlineLines, id: \.self) { line in
                        Text(line)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                            .minimumScaleFactor(0.85)
                    }
                }

                HStack(spacing: 6) {
                    Circle().fill(statusColor).frame(width: 7, height: 7)
                    Text(statusLabel)
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundStyle(.white.opacity(0.7))
                        .tracking(0.6)
                }

                HStack(spacing: 6) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(WidgetColor.from(entry.guidance.color))
                        .frame(width: 11, height: 11)
                        .overlay(
                            RoundedRectangle(cornerRadius: 2)
                                .stroke(Color.white.opacity(0.18), lineWidth: 1)
                        )
                    Text(entry.guidance.color.uppercased())
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundStyle(.white.opacity(0.7))
                        .tracking(0.6)
                }

                Spacer(minLength: 0)

                Text("VEDIC")
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.35))
                    .tracking(0.8)
            }
        }
    }
}
