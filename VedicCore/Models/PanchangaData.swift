import Foundation
import CoreLocation

/// All panchang values computed for a specific date and location.
public struct PanchangaData: Sendable {
    public let date: Date
    public let location: CLLocationCoordinate2D

    // Core panchang elements
    public let sunrise: Date
    public let sunset: Date
    public let tithi: Int           // 1–30
    public let nakshatra: Int       // 1–27
    public let rahuKalam: DateInterval
    public let abhijitMuhurta: DateInterval

    // Raw lunar position (degrees), useful for downstream calcs
    public let moonLongitude: Double
    public let sunLongitude: Double

    public init(
        date: Date,
        location: CLLocationCoordinate2D,
        sunrise: Date,
        sunset: Date,
        tithi: Int,
        nakshatra: Int,
        rahuKalam: DateInterval,
        abhijitMuhurta: DateInterval,
        moonLongitude: Double,
        sunLongitude: Double
    ) {
        self.date = date
        self.location = location
        self.sunrise = sunrise
        self.sunset = sunset
        self.tithi = tithi
        self.nakshatra = nakshatra
        self.rahuKalam = rahuKalam
        self.abhijitMuhurta = abhijitMuhurta
        self.moonLongitude = moonLongitude
        self.sunLongitude = sunLongitude
    }
}

// CLLocationCoordinate2D is a C struct — make it Sendable explicitly.
extension CLLocationCoordinate2D: @retroactive Sendable {}
