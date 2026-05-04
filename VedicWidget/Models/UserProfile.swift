import Foundation
import SwiftData

@Model
final class UserProfile {
    var name: String
    var birthDate: Date
    var birthTime: Date
    var birthTimeKnown: Bool
    var birthLatitude: Double
    var birthLongitude: Double
    var birthTimezone: String       // IANA identifier, e.g. "Asia/Kolkata"
    var createdAt: Date

    init(
        name: String,
        birthDate: Date,
        birthTime: Date,
        birthTimeKnown: Bool,
        birthLatitude: Double,
        birthLongitude: Double,
        birthTimezone: String
    ) {
        self.name            = name
        self.birthDate       = birthDate
        self.birthTime       = birthTime
        self.birthTimeKnown  = birthTimeKnown
        self.birthLatitude   = birthLatitude
        self.birthLongitude  = birthLongitude
        self.birthTimezone   = birthTimezone
        self.createdAt       = Date()
    }
}

// App Group identifier now lives in VedicCore/Models/AppGroup.swift so
// the widget extension can access it without duplicating the string.
