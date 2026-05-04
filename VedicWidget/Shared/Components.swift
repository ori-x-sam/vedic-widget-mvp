import SwiftUI

// MARK: - Primary CTA button

struct PrimaryButton: View {
    let label: String
    let enabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(enabled ? .black : .white.opacity(0.3))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(enabled ? Color.white : Color.white.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .disabled(!enabled)
    }
}

// MARK: - Back button

struct BackButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: "chevron.left")
                    .fontWeight(.medium)
                Text("Back")
                    .fontWeight(.medium)
            }
            .font(.system(size: 15))
            .foregroundStyle(.white.opacity(0.6))
        }
    }
}

// MARK: - Window pill (avoid / best window)

struct TimePillView: View {
    let interval: DateInterval
    let isAvoid: Bool

    private var label: String {
        isAvoid ? "Avoid" : "Best window"
    }

    private var color: Color {
        isAvoid ? .red : .green
    }

    private static let fmt: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        f.amSymbol = "am"; f.pmSymbol = "pm"
        return f
    }()

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(color)
                .frame(width: 7, height: 7)
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(color)
            Text("\(Self.fmt.string(from: interval.start))–\(Self.fmt.string(from: interval.end))")
                .font(.system(size: 12))
                .foregroundStyle(.white.opacity(0.55))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(color.opacity(0.12))
        .clipShape(Capsule())
    }
}

// MARK: - Colour/food badge

struct AttributeBadge: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(.white.opacity(0.4))
            Text(label + ":")
                .font(.system(size: 13))
                .foregroundStyle(.white.opacity(0.4))
            Text(value)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.85))
        }
    }
}
