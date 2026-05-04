// CLI target — Phase 1 verification tool.
// Usage:
//   swift run VedicCLI [latitude] [longitude] [YYYY-MM-DD]
// Example:
//   swift run VedicCLI 28.6139 77.2090 2025-04-18   (New Delhi)
//   swift run VedicCLI 37.7749 -122.4194 2025-04-18 (San Francisco)

import Foundation
import CoreLocation
import VedicCore

func parseDate(_ string: String) -> Date? {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = TimeZone(identifier: "UTC")
    return formatter.date(from: string)
}

// --- Parse arguments ---
let args = CommandLine.arguments
var lat: Double  = 28.6139      // Default: New Delhi
var lon: Double  = 77.2090
var dateArg      = "2025-04-18"
var tz           = TimeZone(identifier: "Asia/Kolkata")!

if args.count >= 4 {
    lat     = Double(args[1]) ?? lat
    lon     = Double(args[2]) ?? lon
    dateArg = args[3]
}
if args.count >= 5, let tzOverride = TimeZone(identifier: args[4]) {
    tz = tzOverride
}

guard let date = parseDate(dateArg) else {
    print("Error: invalid date '\(dateArg)'. Use YYYY-MM-DD.")
    exit(1)
}

// --- Run calculation ---
let calculator = PanchangaCalculator()
let engine     = GuidanceEngine()
let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lon)

do {
    let panchang = try calculator.calculate(for: date, coordinate: coordinate, timezone: tz)
    let guidance = engine.guidance(from: panchang)

    print("=== Vedic Daily Guidance ===")
    print("Date      : \(dateArg)")
    print("Location  : \(lat), \(lon)")
    print("Tithi     : \(panchang.tithi)")
    print("Nakshatra : \(panchang.nakshatra)")
    print("Sunrise   : \(panchang.sunrise)")
    print("Sunset    : \(panchang.sunset)")
    print("")
    print("Headline  : \(guidance.headline)")
    print("Color     : \(guidance.color)")
    print("Food      : \(guidance.food)")
    print("Avoid     : \(TimeWindowContent.avoidLine(for: guidance.avoidWindow))")
    print("Best time : \(TimeWindowContent.strongestWindowLine(for: guidance.strongestWindow))")
    print("")
    print("Detail    : \(guidance.detailedText)")
    print("")

    // Output as JSON too
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    encoder.dateEncodingStrategy = .iso8601
    if let json = try? encoder.encode(guidance),
       let jsonString = String(data: json, encoding: .utf8) {
        print("--- JSON ---")
        print(jsonString)
    }

} catch {
    print("Error: \(error.localizedDescription)")
    exit(1)
}
