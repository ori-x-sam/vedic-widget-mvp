import SwiftUI

struct NameStep: View {
    @Binding var draft: OnboardingDraft
    let onNext: () -> Void

    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 32) {
            VStack(alignment: .leading, spacing: 12) {
                Text("What should we call you?")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(.white)

                Text("Just your first name is fine.")
                    .font(.system(size: 16))
                    .foregroundStyle(.white.opacity(0.5))
            }

            TextField("", text: $draft.name, prompt: Text("Your name").foregroundStyle(.white.opacity(0.3)))
                .font(.system(size: 22, weight: .medium))
                .foregroundStyle(.white)
                .padding(.vertical, 14)
                .padding(.horizontal, 16)
                .background(Color.white.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .focused($focused)
                .submitLabel(.next)
                .onSubmit { if canContinue { onNext() } }

            PrimaryButton(label: "Continue", enabled: canContinue, action: onNext)
        }
        .padding(.horizontal, 32)
        .onAppear { focused = true }
    }

    private var canContinue: Bool {
        !draft.name.trimmingCharacters(in: .whitespaces).isEmpty
    }
}
