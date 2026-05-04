import Foundation
#if canImport(UIKit)
import UIKit
#endif

/// Lightweight wrapper around UIImpactFeedbackGenerator for the two
/// transitions we care about: entering / exiting a best or avoid window.
///
/// Widget extensions cannot produce haptics (WidgetKit runs a separate
/// process without UIKit's haptic hardware access), so these APIs are
/// intended for the main app only. They compile in both targets but
/// no-op when UIKit is unavailable.
///
/// Respects the `hapticsEnabled` @AppStorage flag (default true). When
/// the flag is off, both calls return immediately without vibrating.
public enum Haptics {

    /// Shared-UserDefaults-backed toggle. Stored in `.standard` (app only);
    /// widget never reads this. Matches the `@AppStorage("hapticsEnabled")`
    /// binding used by SettingsView.
    private static let enabledKey = "hapticsEnabled"

    public static var isEnabled: Bool {
        // UserDefaults returns false for missing keys. We want default-true,
        // so we treat "key absent" as enabled.
        if UserDefaults.standard.object(forKey: enabledKey) == nil { return true }
        return UserDefaults.standard.bool(forKey: enabledKey)
    }

    /// Fire when "now" crosses into a best-or-avoid window.
    public static func windowEntered() {
        fire()
        Telemetry.bump(.hapticsFired)
    }

    /// Fire when "now" crosses out of a best-or-avoid window.
    public static func windowExited() {
        fire()
        Telemetry.bump(.hapticsFired)
    }

    private static func fire() {
        guard isEnabled else { return }
        #if canImport(UIKit) && !os(watchOS)
        DispatchQueue.main.async {
            let gen = UIImpactFeedbackGenerator(style: .medium)
            gen.prepare()
            gen.impactOccurred()
        }
        #endif
    }
}
