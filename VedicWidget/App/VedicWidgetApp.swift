import SwiftUI
import SwiftData
import VedicCore

@main
struct VedicWidgetApp: App {

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(for: UserProfile.self)
    }
}

// MARK: - Root router

struct RootView: View {
    @Query private var profiles: [UserProfile]

    var body: some View {
        Group {
            if profiles.isEmpty {
                OnboardingFlow()
            } else {
                MainTabView(profile: profiles[0])
            }
        }
        // Widget tap → `vedicwidget://widgetTap`. We bump telemetry here
        // (widgets can't write AppGroup defaults from within WidgetKit's
        // tap gesture — they can only set `widgetURL` which opens the host
        // app). Scheme must match the widget's widgetURL.
        .onOpenURL { url in
            if url.scheme == "vedicwidget", url.host == "widgetTap" {
                Telemetry.bump(.widgetTapsTotal)
            }
        }
    }
}

// MARK: - Main tab / nav

struct MainTabView: View {
    let profile: UserProfile

    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            TodayView(profile: profile)
                .navigationTitle("")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showSettings = true
                        } label: {
                            Image(systemName: "gearshape")
                        }
                    }
                }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(profile: profile)
        }
    }
}
