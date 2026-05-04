import Foundation

/// Local-only, on-device usage counters. Zero network, nothing leaves the
/// device. Backed by the App Group UserDefaults so the widget extension can
/// bump `.widgetTapsTotal` from its `widgetURL` handler and the app can
/// read it in the debug screen.
///
/// All counters are monotonically non-decreasing until reset from the
/// TelemetryDebugView's "Reset" button.
public enum Telemetry {

    public enum Counter: String, CaseIterable {
        case widgetTapsTotal   = "telemetry.widgetTapsTotal"
        case todayOpens        = "telemetry.todayOpens"
        case scrubSessions     = "telemetry.scrubSessions"
        case explainersOpened  = "telemetry.explainersOpened"
        case tomorrowToggles   = "telemetry.tomorrowToggles"
        case hapticsFired      = "telemetry.hapticsFired"

        /// Human label for the debug screen.
        public var displayName: String {
            switch self {
            case .widgetTapsTotal:  return "Widget taps"
            case .todayOpens:       return "Today opens"
            case .scrubSessions:    return "Scrub sessions"
            case .explainersOpened: return "Explainers opened"
            case .tomorrowToggles:  return "Tomorrow toggles"
            case .hapticsFired:     return "Haptics fired"
            }
        }
    }

    /// Shared UserDefaults (App Group). Falls back to `.standard` when the
    /// entitlement is unavailable (matches SharedProfileStore's behavior).
    private static var defaults: UserDefaults {
        UserDefaults(suiteName: AppGroup.identifier) ?? .standard
    }

    /// Increment a counter by 1. Safe to call from any thread; UserDefaults
    /// is thread-safe for basic set/get.
    public static func bump(_ counter: Counter) {
        let current = defaults.integer(forKey: counter.rawValue)
        defaults.set(current + 1, forKey: counter.rawValue)
    }

    public static func value(_ counter: Counter) -> Int {
        defaults.integer(forKey: counter.rawValue)
    }

    public static func resetAll() {
        for c in Counter.allCases {
            defaults.removeObject(forKey: c.rawValue)
        }
    }

    public static func snapshot() -> [(Counter, Int)] {
        Counter.allCases.map { ($0, value($0)) }
    }
}

// TODO: Wire `Telemetry.bump(.explainersOpened)` at every explainer-popover
// onAppear once those popovers exist in Swift. Today's TodayView / widgets
// don't surface an explainer yet — only the web preview mocks one — so
// there's no call site to attach to.

