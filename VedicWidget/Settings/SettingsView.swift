import SwiftUI
import SwiftData
import VedicCore

/// Intentionally sparse. No account, no cloud sync, no paywall in v1.
/// Everything that matters is the profile; everything else is "coming soon".
struct SettingsView: View {
    let profile: UserProfile

    @Environment(\.dismiss) private var dismiss

    /// Default-true. Read by `Haptics.isEnabled`; when off, both
    /// `Haptics.windowEntered/Exited` no-op.
    @AppStorage("hapticsEnabled") private var hapticsEnabled = true

    /// Hidden debug unlock: long-press the Version row 5 times.
    @State private var versionLongPresses = 0
    @State private var debugUnlocked = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        profileSection
                        hapticsSection
                        notificationsSection
                        aboutSection
                        credits
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .toolbarBackground(Color.black, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }

    // MARK: - Sections

    private var profileSection: some View {
        SettingsGroup(label: "Profile") {
            NavigationLink {
                EditFieldView(title: "Name", value: profile.name) { newValue in
                    profile.name = newValue
                    syncShared()
                }
            } label: {
                SettingsRow(label: "Name", value: profile.name)
            }
            SettingsDivider()
            SettingsRow(label: "Birth date", value: formattedDate(profile.birthDate))
            SettingsDivider()
            SettingsRow(
                label: "Birth time",
                value: profile.birthTimeKnown ? formattedTime(profile.birthTime) : "Not set"
            )
            SettingsDivider()
            SettingsRow(
                label: "Birth location",
                value: locationString()
            )
        }
    }

    private var hapticsSection: some View {
        SettingsGroup(label: "Feedback") {
            VStack(alignment: .leading, spacing: 4) {
                Toggle(isOn: $hapticsEnabled) {
                    Text("Haptic nudges")
                        .font(.system(size: 15))
                        .foregroundStyle(.white)
                }
                .tint(.white)
                Text("Gentle tap when a best or avoid window begins or ends.")
                    .font(.system(size: 12))
                    .foregroundStyle(.white.opacity(0.5))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
    }

    private var notificationsSection: some View {
        SettingsGroup(label: "Notifications") {
            SettingsRow(
                label: "Daily reminders",
                value: "Coming soon",
                disabled: true
            )
        }
    }

    private var aboutSection: some View {
        SettingsGroup(label: "About") {
            SettingsRow(label: "Version", value: appVersion)
                .onLongPressGesture(minimumDuration: 0.4) {
                    versionLongPresses += 1
                    if versionLongPresses >= 5 {
                        debugUnlocked = true
                    }
                }
            SettingsDivider()
            SettingsRow(label: "Ephemeris data", value: "Swiss Ephemeris")
            SettingsDivider()
            SettingsRow(label: "Credits", value: "")
            if debugUnlocked {
                SettingsDivider()
                NavigationLink {
                    TelemetryDebugView()
                } label: {
                    SettingsRow(label: "Debug", value: "")
                }
            }
        }
    }

    private var credits: some View {
        VStack(spacing: 4) {
            Text("Built with Swiss Ephemeris.")
            Text("All calculations on-device. Zero backend.")
        }
        .font(.system(size: 12))
        .foregroundStyle(.white.opacity(0.3))
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
        .padding(.top, 20)
    }

    // MARK: - Helpers

    private func syncShared() {
        let snap = SharedProfile(
            name: profile.name,
            birthDate: profile.birthDate,
            birthTime: profile.birthTime,
            birthTimeKnown: profile.birthTimeKnown,
            birthLatitude: profile.birthLatitude,
            birthLongitude: profile.birthLongitude,
            birthTimezone: profile.birthTimezone
        )
        SharedProfileStore.write(snap, appGroup: AppGroup.identifier)
    }

    private func formattedDate(_ d: Date) -> String {
        let f = DateFormatter(); f.dateFormat = "d MMM yyyy"; return f.string(from: d)
    }

    private func formattedTime(_ d: Date) -> String {
        let f = DateFormatter(); f.dateFormat = "h:mm a"; return f.string(from: d)
    }

    private func locationString() -> String {
        // In v1 we stored lat/lon + timezone but not the place label.
        // Show timezone city as an approximation.
        let tz = profile.birthTimezone
        if let last = tz.split(separator: "/").last { return String(last).replacingOccurrences(of: "_", with: " ") }
        return tz
    }

    private var appVersion: String {
        let info = Bundle.main.infoDictionary
        let v = info?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        return v
    }
}

// MARK: - Building blocks

private struct SettingsGroup<Content: View>: View {
    let label: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label.uppercased())
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.4))
                .tracking(1.0)
                .padding(.horizontal, 4)
            VStack(spacing: 0) { content }
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }
}

private struct SettingsRow: View {
    let label: String
    let value: String
    var disabled: Bool = false

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 15))
                .foregroundStyle(disabled ? .white.opacity(0.35) : .white)
            Spacer()
            if !value.isEmpty {
                Text(value)
                    .font(.system(size: 15))
                    .foregroundStyle(disabled ? .white.opacity(0.25) : .white.opacity(0.5))
                    .italic(disabled)
            }
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white.opacity(disabled ? 0.15 : 0.3))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .contentShape(Rectangle())
    }
}

private struct SettingsDivider: View {
    var body: some View {
        Rectangle()
            .fill(Color.white.opacity(0.06))
            .frame(height: 1)
            .padding(.leading, 16)
    }
}

// MARK: - Simple name-edit view

private struct EditFieldView: View {
    let title: String
    let value: String
    let onSave: (String) -> Void

    @State private var draft: String
    @Environment(\.dismiss) private var dismiss

    init(title: String, value: String, onSave: @escaping (String) -> Void) {
        self.title = title
        self.value = value
        self.onSave = onSave
        _draft = State(initialValue: value)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 20) {
                TextField("", text: $draft)
                    .textFieldStyle(.plain)
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(.white)
                    .padding(14)
                    .background(Color.white.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Save") {
                    onSave(draft.trimmingCharacters(in: .whitespaces))
                    dismiss()
                }
                .foregroundStyle(.white)
            }
        }
    }
}
