import SwiftUI

struct BirthTimeStep: View {
    @Binding var draft: OnboardingDraft
    let onBack: () -> Void
    let onNext: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 32) {
            BackButton(action: onBack)

            VStack(alignment: .leading, spacing: 8) {
                Text("What time were you born?")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(.white)

                Text("Check your birth certificate if you're unsure.")
                    .font(.system(size: 16))
                    .foregroundStyle(.white.opacity(0.5))
            }

            // "I don't know" toggle
            HStack {
                Text("I don't know my birth time")
                    .font(.system(size: 15))
                    .foregroundStyle(.white.opacity(0.7))
                Spacer()
                Toggle("", isOn: Binding(
                    get: { !draft.birthTimeKnown },
                    set: { draft.birthTimeKnown = !$0 }
                ))
                .tint(.white.opacity(0.6))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            if draft.birthTimeKnown {
                DatePicker(
                    "",
                    selection: $draft.birthTime,
                    displayedComponents: .hourAndMinute
                )
                .datePickerStyle(.wheel)
                .labelsHidden()
                .colorScheme(.dark)
                .frame(maxWidth: .infinity)
                .background(Color.white.opacity(0.05))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .transition(.opacity.combined(with: .move(edge: .bottom)))
            } else {
                Text("We'll use 12:00pm as a default. You can update this later.")
                    .font(.system(size: 14))
                    .foregroundStyle(.white.opacity(0.4))
                    .padding(.vertical, 8)
                    .transition(.opacity)
            }

            PrimaryButton(label: "Continue", enabled: true, action: onNext)
        }
        .padding(.horizontal, 32)
        .animation(.easeInOut(duration: 0.2), value: draft.birthTimeKnown)
    }
}
