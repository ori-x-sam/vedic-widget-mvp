import XCTest
import CoreLocation
@testable import VedicCore

/// GuidanceEngine tests — no ephemeris required.
/// We construct PanchangaData synthetically and feed all 27 × 30 combos through
/// the engine, asserting the invariants the product depends on:
///   • no Sanskrit tokens leak into any user-facing string
///   • headline length stays ≤ 60 chars (widget small-family constraint)
///   • detailedText is non-empty and has no Sanskrit
final class GuidanceEngineTests: XCTestCase {

    /// Terms that must never appear in user-facing copy. Lowercased, substring match.
    /// Sourced from the NakshatraID + TithiContent comment tables; anything that
    /// looks like a transliterated Sanskrit name belongs here.
    private static let forbiddenTerms: [String] = [
        // Nakshatra names
        "ashwini", "bharani", "krittika", "rohini", "mrigashira", "ardra",
        "punarvasu", "pushya", "ashlesha", "magha", "phalguni", "hasta",
        "chitra", "swati", "vishakha", "anuradha", "jyeshtha", "mula",
        "ashadha", "shravana", "dhanishtha", "shatabhisha", "bhadrapada",
        "revati",
        // Tithi names
        "pratipada", "dvitiya", "tritiya", "chaturthi", "panchami", "shashthi",
        "saptami", "ashtami", "navami", "dashami", "ekadashi", "dvadashi",
        "trayodashi", "chaturdashi", "purnima", "amavasya",
        // Technical terms
        "tithi", "nakshatra", "rahu kalam", "rahu kaal", "abhijit", "muhurta",
        "muhurat", "panchang",
    ]

    // MARK: - Fixture builder

    private func fixture(nakshatra: Int, tithi: Int) -> PanchangaData {
        let now = Date(timeIntervalSince1970: 1_714_000_000)  // deterministic
        let sunrise = now
        let sunset  = now.addingTimeInterval(12 * 3600)
        let noon    = now.addingTimeInterval(6 * 3600)
        return PanchangaData(
            date: now,
            location: CLLocationCoordinate2D(latitude: 19.0760, longitude: 72.8777),
            sunrise: sunrise,
            sunset: sunset,
            tithi: tithi,
            nakshatra: nakshatra,
            rahuKalam:      DateInterval(start: sunrise.addingTimeInterval(3 * 3600), duration: 90 * 60),
            abhijitMuhurta: DateInterval(start: noon.addingTimeInterval(-24 * 60),    duration: 48 * 60),
            moonLongitude: 0,
            sunLongitude:  0
        )
    }

    // MARK: - Headline length

    func testHeadlineUnder60CharsForAllCombinations() {
        let engine = GuidanceEngine.shared
        for n in 1...27 {
            for t in 1...30 {
                let g = engine.guidance(from: fixture(nakshatra: n, tithi: t))
                XCTAssertLessThanOrEqual(
                    g.headline.count, 60,
                    "headline too long for nakshatra=\(n) tithi=\(t): \(g.headline)"
                )
                XCTAssertFalse(g.headline.isEmpty, "empty headline n=\(n) t=\(t)")
            }
        }
    }

    // MARK: - No Sanskrit leaks

    func testNoSanskritTokensInAnyUserFacingOutput() {
        let engine = GuidanceEngine.shared
        for n in 1...27 {
            for t in 1...30 {
                let g = engine.guidance(from: fixture(nakshatra: n, tithi: t))
                assertNoForbidden(g.headline,     label: "headline n=\(n) t=\(t)")
                assertNoForbidden(g.detailedText, label: "detail  n=\(n) t=\(t)")
                assertNoForbidden(g.food,         label: "food    n=\(n) t=\(t)")
                assertNoForbidden(g.color,        label: "color   n=\(n) t=\(t)")
            }
        }
    }

    // MARK: - Detail text non-empty

    func testDetailedTextIsSubstantial() {
        let engine = GuidanceEngine.shared
        for n in 1...27 {
            let g = engine.guidance(from: fixture(nakshatra: n, tithi: 1))
            XCTAssertGreaterThan(
                g.detailedText.count, 40,
                "detailedText suspiciously short for nakshatra=\(n): \(g.detailedText)"
            )
        }
    }

    // MARK: - Helper

    private func assertNoForbidden(
        _ text: String,
        label: String,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let hay = text.lowercased()
        for term in Self.forbiddenTerms where hay.contains(term) {
            XCTFail("\(label) contains forbidden term \"\(term)\": \(text)", file: file, line: line)
        }
    }
}
