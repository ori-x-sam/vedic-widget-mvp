import SwiftUI

struct BirthDateStep: View {
    @Binding var draft: OnboardingDraft
    let onBack: () -> Void
    let onNext: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 32) {
            BackButton(action: onBack)

            VStack(alignment: .leading, spacing: 8) {
                Text("When were you born?")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(.white)

                Text("Date only — we'll ask for time next.")
                    .font(.system(size: 16))
                    .foregroundStyle(.white.opacity(0.5))
            }

            DatePicker(
                "",
                selection: $draft.birthDate,
                in: ...Date(),
                displayedComponents: .date
            )
            .datePickerStyle(.wheel)
            .labelsHidden()
            .colorScheme(.dark)
            .frame(maxWidth: .infinity)
            .background(Color.white.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            PrimaryButton(label: "Continue", enabled: true, action: onNext)
        }
        .padding(.horizontal, 32)
    }
}
