import Foundation
import CSwissEphemeris

// MARK: - Constants (mirrors sweph.h / swephexp.h)
// We define them here in Swift so we never import the private sweph.h.

private let SE_GREG_CAL:   Int32 = 1
private let SEFLG_SWIEPH:  Int32 = 2
private let SEFLG_SPEED:   Int32 = 256
private let SE_CALC_RISE:  Int32 = 1
private let SE_CALC_SET:   Int32 = 2
private let SE_OK:         Int32 = 0
private let SE_ERR:        Int32 = -1

// MARK: - Planet IDs (SE_SUN=0, SE_MOON=1 from swephexp.h)

public enum SEPlanet: Int32 {
    case sun     = 0
    case moon    = 1
    case mercury = 2
    case venus   = 3
    case mars    = 4
    case jupiter = 5
    case saturn  = 6
}

// MARK: - Julian Day conversion

public enum JulianDay {
    /// Gregorian calendar date + UT decimal hours → Julian Day Number
    public static func from(year: Int, month: Int, day: Int, hour: Double) -> Double {
        swe_julday(Int32(year), Int32(month), Int32(day), hour, SE_GREG_CAL)
    }

    /// Convert a Swift `Date` (any timezone) to Julian Day in UT.
    public static func from(date: Date) -> Double {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        let c = cal.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
        let hour = Double(c.hour ?? 0)
                 + Double(c.minute ?? 0) / 60.0
                 + Double(c.second ?? 0) / 3600.0
        return swe_julday(
            Int32(c.year ?? 2000), Int32(c.month ?? 1), Int32(c.day ?? 1),
            hour, SE_GREG_CAL
        )
    }
}

// MARK: - Error

public enum EphemerisError: Error, LocalizedError {
    case calculationFailed(String)

    public var errorDescription: String? {
        if case .calculationFailed(let msg) = self { return "Ephemeris error: \(msg)" }
        return nil
    }
}

// MARK: - Bridge

public final class SwissEphemerisBridge {

    public static let shared = SwissEphemerisBridge()

    private init() {
        // Default path — the app overrides via setEphePath(_:) at launch.
        let path = Bundle.main.resourcePath ?? "."
        swe_set_ephe_path(path)
    }

    public func setEphePath(_ path: String) {
        swe_set_ephe_path(path)
    }

    // MARK: Planetary longitude

    /// Geocentric ecliptic longitude (°) for a planet at a Julian Day (UT).
    public func longitude(of planet: SEPlanet, jd: Double) throws -> Double {
        var xx  = [Double](repeating: 0, count: 6)
        var err = [CChar](repeating: 0, count: 256)
        let rc  = swe_calc_ut(jd, planet.rawValue, SEFLG_SWIEPH | SEFLG_SPEED, &xx, &err)
        if rc == SE_ERR {
            throw EphemerisError.calculationFailed(String(cString: err))
        }
        return xx[0]  // ecliptic longitude
    }

    // MARK: Sunrise / Sunset

    public func sunrise(jd: Double, lat: Double, lon: Double) -> Double? {
        riseTransUT(jd: jd, lat: lat, lon: lon, rsmi: SE_CALC_RISE)
    }

    public func sunset(jd: Double, lat: Double, lon: Double) -> Double? {
        riseTransUT(jd: jd, lat: lat, lon: lon, rsmi: SE_CALC_SET)
    }

    private func riseTransUT(jd: Double, lat: Double, lon: Double, rsmi: Int32) -> Double? {
        // geopos: [longitude, latitude, altitude_metres]
        var geopos: [Double] = [lon, lat, 0.0]
        var tret: Double     = 0.0
        var err  = [CChar](repeating: 0, count: 256)

        let rc = swe_rise_trans(
            jd - 0.5,               // start search half-day before
            SEPlanet.sun.rawValue,
            nil,                    // star name (nil = planet)
            SEFLG_SWIEPH,
            rsmi,
            &geopos,
            1013.25,                // atmospheric pressure (mbar)
            15.0,                   // atmospheric temp (°C)
            &tret,
            &err
        )
        return rc == SE_OK ? tret : nil
    }
}
