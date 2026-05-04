import Foundation
import CoreLocation

// MARK: - Rahu Kalam table
// Standard 8-part division of the day. Index = weekday (0=Sun … 6=Sat).
// Each value is the 1-based ordinal of the 8th-part that is rahu kalam.
// Day-parts run sunrise → sunset divided into 8 equal segments.
// Sunday=8, Monday=2, Tuesday=7, Wednesday=5, Thursday=6, Friday=4, Saturday=3

private let rahuKalamPart: [Int] = [8, 2, 7, 5, 6, 4, 3]
// Index 0 = Sunday. Matches Calendar.component(.weekday) - 1.

public final class PanchangaCalculator {

    private let bridge: SwissEphemerisBridge

    public init(bridge: SwissEphemerisBridge = .shared) {
        self.bridge = bridge
    }

    // MARK: - Public API

    /// Compute full panchang for a given date and geographic location.
    /// - Parameters:
    ///   - date: Any moment within the target calendar date (local time used for weekday).
    ///   - coordinate: Observer's geographic coordinates.
    ///   - timezone: Observer's timezone (used to determine local weekday).
    public func calculate(
        for date: Date,
        coordinate: CLLocationCoordinate2D,
        timezone: TimeZone = .current
    ) throws -> PanchangaData {

        let jd = JulianDay.from(date: date)

        // --- Sunrise / Sunset ---
        guard
            let sunriseJD = bridge.sunrise(jd: jd, lat: coordinate.latitude, lon: coordinate.longitude),
            let sunsetJD  = bridge.sunset(jd: jd,  lat: coordinate.latitude, lon: coordinate.longitude)
        else {
            throw PanchangaError.sunriseNotFound
        }

        let sunrise = julianToDate(sunriseJD)
        let sunset  = julianToDate(sunsetJD)

        // Use sunrise moment for tithi/nakshatra (traditional: take values at sunrise)
        let jdSunrise = JulianDay.from(date: sunrise)

        let moonLon = try bridge.longitude(of: .moon, jd: jdSunrise)
        let sunLon  = try bridge.longitude(of: .sun,  jd: jdSunrise)

        // --- Tithi ---
        // Each tithi = 12° of moon–sun longitude difference
        let diff = positiveAngle(moonLon - sunLon)
        let tithi = Int(diff / 12.0) + 1   // 1–30

        // --- Nakshatra ---
        // Each nakshatra = 360/27 ≈ 13.333° of moon longitude
        let nakshatraSpan = 360.0 / 27.0
        let nakshatra = Int(moonLon / nakshatraSpan) + 1  // 1–27

        // --- Rahu Kalam ---
        let rahuKalam = computeRahuKalam(
            sunrise: sunrise,
            sunset:  sunset,
            date:    date,
            timezone: timezone
        )

        // --- Abhijit Muhurta ---
        // Traditional: middle 48 min of the day (solar noon ± 24 min)
        let abhijit = computeAbhijitMuhurta(sunrise: sunrise, sunset: sunset)

        return PanchangaData(
            date: date,
            location: coordinate,
            sunrise: sunrise,
            sunset: sunset,
            tithi: max(1, min(30, tithi)),
            nakshatra: max(1, min(27, nakshatra)),
            rahuKalam: rahuKalam,
            abhijitMuhurta: abhijit,
            moonLongitude: moonLon,
            sunLongitude: sunLon
        )
    }

    // MARK: - Rahu Kalam

    private func computeRahuKalam(
        sunrise: Date,
        sunset: Date,
        date: Date,
        timezone: TimeZone
    ) -> DateInterval {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timezone

        // weekday: 1=Sun … 7=Sat → index 0–6
        let weekday = cal.component(.weekday, from: date) - 1

        let dayLength = sunset.timeIntervalSince(sunrise)
        let partLength = dayLength / 8.0
        let partIndex = rahuKalamPart[weekday] - 1   // 0-based

        let start = sunrise.addingTimeInterval(Double(partIndex) * partLength)
        return DateInterval(start: start, duration: partLength)
    }

    // MARK: - Abhijit Muhurta

    private func computeAbhijitMuhurta(sunrise: Date, sunset: Date) -> DateInterval {
        let noon = sunrise.addingTimeInterval(sunset.timeIntervalSince(sunrise) / 2.0)
        let halfDuration: TimeInterval = 24 * 60   // 24 minutes
        return DateInterval(start: noon.addingTimeInterval(-halfDuration), duration: halfDuration * 2)
    }

    // MARK: - Helpers

    private func julianToDate(_ jd: Double) -> Date {
        // JD 2440587.5 = 1970-01-01 00:00:00 UTC
        let unixEpochJD = 2440587.5
        let secondsFromEpoch = (jd - unixEpochJD) * 86400.0
        return Date(timeIntervalSince1970: secondsFromEpoch)
    }

    private func positiveAngle(_ degrees: Double) -> Double {
        let mod = degrees.truncatingRemainder(dividingBy: 360.0)
        return mod < 0 ? mod + 360.0 : mod
    }
}

public enum PanchangaError: Error, LocalizedError {
    case sunriseNotFound

    public var errorDescription: String? {
        switch self {
        case .sunriseNotFound:
            return "Could not compute sunrise for the given date and location."
        }
    }
}
