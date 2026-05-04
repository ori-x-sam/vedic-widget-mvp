import Foundation
import CoreLocation

/// A Codable snapshot of the user's profile, written by the app and read by
/// the widget extension through the shared App Group container.
///
/// Why a separate type: SwiftData's `@Model` classes live in the app target,
/// and the widget can't depend on the app. A plain Codable struct in VedicCore
/// is the smallest possible bridge.
///
/// Two locations are tracked here, not one:
///   - `birth*`: the immutable natal location. Used for natal calculations
///     (e.g. moon nakshatra at birth).
///   - `current*`: the user's *current* location, refreshed via CoreLocation.
///     Used for today's daily windows (rahu kalam, abhijit, sunrise/sunset).
///     These are nil until we've successfully acquired a location. Callers
///     fall back to birth location when nil — that's a graceful degradation,
///     not a toggle. There is no user-facing setting to choose.
public struct SharedProfile: Codable, Sendable {
    public let name: String
    public let birthDate: Date
    public let birthTime: Date
    public let birthTimeKnown: Bool
    public let birthLatitude: Double
    public let birthLongitude: Double
    public let birthTimezone: String

    // Current location. Nil until CoreLocation has delivered a fix (or the
    // user has denied permission). When nil, daily-window callers degrade to
    // birth location. TODO: surface a subtle "using birth location" hint in
    // the Today header when this is nil so the user knows why the windows
    // might not match their current city.
    public let currentLatitude: Double?
    public let currentLongitude: Double?
    public let currentTimezone: String?

    public init(
        name: String,
        birthDate: Date,
        birthTime: Date,
        birthTimeKnown: Bool,
        birthLatitude: Double,
        birthLongitude: Double,
        birthTimezone: String,
        currentLatitude: Double? = nil,
        currentLongitude: Double? = nil,
        currentTimezone: String? = nil
    ) {
        self.name             = name
        self.birthDate        = birthDate
        self.birthTime        = birthTime
        self.birthTimeKnown   = birthTimeKnown
        self.birthLatitude    = birthLatitude
        self.birthLongitude   = birthLongitude
        self.birthTimezone    = birthTimezone
        self.currentLatitude  = currentLatitude
        self.currentLongitude = currentLongitude
        self.currentTimezone  = currentTimezone
    }

    // MARK: - Birth (natal) location — for natal computations only

    /// Natal coordinate. Use this for anything anchored to birth (e.g. natal
    /// moon nakshatra). DO NOT use for daily windows.
    public var birthCoordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: birthLatitude, longitude: birthLongitude)
    }

    public var birthTimeZone: TimeZone {
        TimeZone(identifier: birthTimezone) ?? .current
    }

    // MARK: - Effective "today" location — birth fallback when current is nil

    /// Coordinate for *today's* daily windows. Prefers current location; falls
    /// back to birth if we don't have a fix yet (graceful degradation, no toggle).
    public var todayCoordinate: CLLocationCoordinate2D {
        if let lat = currentLatitude, let lon = currentLongitude {
            return CLLocationCoordinate2D(latitude: lat, longitude: lon)
        }
        return birthCoordinate
    }

    public var todayTimeZone: TimeZone {
        if let tz = currentTimezone, let z = TimeZone(identifier: tz) {
            return z
        }
        return birthTimeZone
    }

    /// True when we are falling back to birth location because current is nil.
    /// UI can use this to show a subtle "using birth location" hint.
    public var isUsingBirthLocationFallback: Bool {
        currentLatitude == nil || currentLongitude == nil
    }

    // MARK: - Legacy shims (do not use in new code)

    /// Deprecated: ambiguous. Prefer `birthCoordinate` or `todayCoordinate`.
    @available(*, deprecated, message: "Use birthCoordinate or todayCoordinate explicitly.")
    public var coordinate: CLLocationCoordinate2D { birthCoordinate }

    /// Deprecated: ambiguous. Prefer `birthTimeZone` or `todayTimeZone`.
    @available(*, deprecated, message: "Use birthTimeZone or todayTimeZone explicitly.")
    public var timeZone: TimeZone { birthTimeZone }
}

/// Reads/writes `SharedProfile` from the App Group's shared UserDefaults.
///
/// Both the app target and the widget extension must enable the same
/// App Group entitlement (see `AppGroup.identifier`). Once set up, the app
/// calls `.write(...)` whenever onboarding finishes or the profile changes,
/// and the widget calls `.read()` inside its TimelineProvider.
public enum SharedProfileStore {
    private static let key = "sharedProfile.v1"

    /// Lazily construct the shared UserDefaults. Falls back to `.standard`
    /// if the App Group suite can't be opened (e.g. running without the
    /// entitlement during development) so previews still work.
    public static func defaults(appGroup: String) -> UserDefaults {
        UserDefaults(suiteName: appGroup) ?? .standard
    }

    public static func write(_ profile: SharedProfile, appGroup: String) {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard let data = try? encoder.encode(profile) else { return }
        defaults(appGroup: appGroup).set(data, forKey: key)
    }

    public static func read(appGroup: String) -> SharedProfile? {
        guard let data = defaults(appGroup: appGroup).data(forKey: key) else { return nil }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try? decoder.decode(SharedProfile.self, from: data)
    }

    /// Convenience: update just the current-location fields without touching
    /// birth data. Called from the app after a CoreLocation fix.
    public static func updateCurrentLocation(
        latitude: Double?,
        longitude: Double?,
        timezone: String?,
        appGroup: String
    ) {
        guard let existing = read(appGroup: appGroup) else { return }
        let updated = SharedProfile(
            name: existing.name,
            birthDate: existing.birthDate,
            birthTime: existing.birthTime,
            birthTimeKnown: existing.birthTimeKnown,
            birthLatitude: existing.birthLatitude,
            birthLongitude: existing.birthLongitude,
            birthTimezone: existing.birthTimezone,
            currentLatitude: latitude,
            currentLongitude: longitude,
            currentTimezone: timezone
        )
        write(updated, appGroup: appGroup)
    }

    public static func clear(appGroup: String) {
        defaults(appGroup: appGroup).removeObject(forKey: key)
    }
}
