import SwiftUI
import SwiftData
import WidgetKit
import VedicCore

// MARK: - Onboarding coordinator

struct OnboardingFlow: View {

    @Environment(\.modelContext) private var modelContext

    // Persisted step so we can resume after an app kill
    @AppStorage("onboardingStep") private var currentStep: Int = 0

    // Collected values (held in memory until final commit)
    @State private var draft = OnboardingDraft()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                OnboardingProgress(step: currentStep, total: 5)
                    .padding(.top, 16)
                    .padding(.horizontal, 24)

                Spacer(minLength: 0)

                switch currentStep {
                case 0:
                    NameStep(draft: $draft) {
                        advance()
                    }
                case 1:
                    BirthDateStep(draft: $draft, onBack: back) {
                        advance()
                    }
                case 2:
                    BirthTimeStep(draft: $draft, onBack: back) {
                        advance()
                    }
                case 3:
                    BirthLocationStep(draft: $draft, onBack: back) {
                        advance()
                    }
                default:
                    AddWidgetStep(onBack: back) {
                        commit()
                    }
                }

                Spacer(minLength: 0)
            }
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Navigation

    private func advance() {
        withAnimation(.easeInOut(duration: 0.25)) {
            currentStep = min(currentStep + 1, 4)
        }
    }

    private func back() {
        withAnimation(.easeInOut(duration: 0.25)) {
            currentStep = max(currentStep - 1, 0)
        }
    }

    private func commit() {
        let profile = UserProfile(
            name:            draft.name,
            birthDate:       draft.birthDate,
            birthTime:       draft.birthTime,
            birthTimeKnown:  draft.birthTimeKnown,
            birthLatitude:   draft.birthLatitude,
            birthLongitude:  draft.birthLongitude,
            birthTimezone:   draft.birthTimezone
        )
        modelContext.insert(profile)

        // Mirror to shared App Group storage so the widget extension can read it.
        let snap = SharedProfile(
            name:            draft.name,
            birthDate:       draft.birthDate,
            birthTime:       draft.birthTime,
            birthTimeKnown:  draft.birthTimeKnown,
            birthLatitude:   draft.birthLatitude,
            birthLongitude:  draft.birthLongitude,
            birthTimezone:   draft.birthTimezone
        )
        SharedProfileStore.write(snap, appGroup: AppGroup.identifier)

        // Kick the widget so it refreshes with real data immediately.
        WidgetCenter.shared.reloadAllTimelines()

        currentStep = 0  // reset so re-run of onboarding starts fresh
    }
}

// MARK: - Progress indicator

struct OnboardingProgress: View {
    let step: Int
    let total: Int

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<total, id: \.self) { i in
                RoundedRectangle(cornerRadius: 2)
                    .fill(i <= step ? Color.white : Color.white.opacity(0.25))
                    .frame(height: 3)
            }
        }
    }
}

// MARK: - Draft model (in-memory until committed)

struct OnboardingDraft {
    var name: String = ""
    var birthDate: Date = Calendar.current.date(
        byAdding: .year, value: -30, to: Date()
    ) ?? Date()
    var birthTime: Date = {
        var c = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        c.hour = 12; c.minute = 0
        return Calendar.current.date(from: c) ?? Date()
    }()
    var birthTimeKnown: Bool = true
    var birthLatitude: Double  = 0
    var birthLongitude: Double = 0
    var birthTimezone: String  = TimeZone.current.identifier
}
