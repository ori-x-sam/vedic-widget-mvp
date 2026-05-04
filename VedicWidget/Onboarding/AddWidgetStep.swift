import SwiftUI

struct AddWidgetStep: View {
    let onBack: () -> Void
    let onDone: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 32) {
            BackButton(action: onBack)

            VStack(alignment: .leading, spacing: 12) {
                Text("One last step.")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(.white)

                Text("Add the widget to your Home Screen to get your guidance at a glance.")
                    .font(.system(size: 16))
                    .foregroundStyle(.white.opacity(0.6))
                    .lineSpacing(4)
            }

            // How-to instructions
            VStack(spacing: 0) {
                InstructionRow(number: "1", text: "Long-press any empty area on your Home Screen until icons jiggle.")
                Divider().background(Color.white.opacity(0.1))
                InstructionRow(number: "2", text: "Tap the + button in the top-left corner.")
                Divider().background(Color.white.opacity(0.1))
                InstructionRow(number: "3", text: "Search for \"Vedic\" and select this app.")
                Divider().background(Color.white.opacity(0.1))
                InstructionRow(number: "4", text: "Choose your preferred size and tap Add Widget.")
            }
            .background(Color.white.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            Text("You can always add the widget later from the Widget Gallery.")
                .font(.system(size: 13))
                .foregroundStyle(.white.opacity(0.35))

            Spacer(minLength: 0)

            PrimaryButton(label: "Go to Today", enabled: true, action: onDone)
        }
        .padding(.horizontal, 32)
    }
}

private struct InstructionRow: View {
    let number: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Text(number)
                .font(.system(size: 14, weight: .bold, design: .monospaced))
                .foregroundStyle(.white.opacity(0.5))
                .frame(width: 20)
            Text(text)
                .font(.system(size: 14))
                .foregroundStyle(.white.opacity(0.75))
                .lineSpacing(3)
            Spacer()
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
    }
}
