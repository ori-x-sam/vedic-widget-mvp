import XCTest
import CoreLocation
@testable import VedicCore

/// Integration tests for PanchangaCalculator.
/// These require the Swiss Ephemeris to load — if ephemeris files aren't bundled
/// in the test target, `calculate(...)` will throw. Tests guard against that so
/// a missing ephemeris doesn't mask logic failures elsewhere.
final class PanchangaCalculatorTests: XCTestCase {

    // Mumbai
    private let mumbai = CLLocationCoordinate2D(latitude: 19.0760, longitude: 72.8777)
    private let ist = TimeZone(identifier: "Asia/Kolkata")!

    /// Build a Date at 12:00 local time on the given Y-M-D in the given zone.
    private func date(_ y: Int, _ m: Int, _ d: Int, zone: TimeZone) -> Date {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = zone
        return cal.date(from: DateComponents(
            timeZone: zone, year: y, month: m, day: d, hour: 12, minute: 0
        ))!
    }

    // MARK: - Smoke test: Mumbai, Jan 1 2024

    func testMumbaiJanuary2024ReturnsValidPanchang() throws {
        let calc = PanchangaCalculator()
        let d = date(2024, 1, 1, zone: ist)

        let result: PanchangaData
        do {
            result = try calc.calculate(for: d, coordinate: mumbai, timezone: ist)
        } catch {
            throw XCTSkip("Swiss Ephemeris unavailable in test env: \(error)")
        }

        XCTAssertLessThan(result.sunrise, result.sunset, "sunrise must precede sunset")
        XCTAssertGreaterThanOrEqual(result.tithi, 1)
        XCTAssertLessThanOrEqual(result.tithi, 30)
        XCTAssertGreaterThanOrEqual(result.nakshatra, 1)
        XCTAssertLessThanOrEqual(result.nakshatra, 27)

        // Rahu kalam is always a slice of sunrise→sunset (one of 8 parts)
        let dayLength = result.sunset.timeIntervalSince(result.sunrise)
        let expectedPart = dayLength / 8.0
        XCTAssertEqual(result.rahuKalam.duration, expectedPart, accuracy: 0.5)
        XCTAssertGreaterThanOrEqual(result.rahuKalam.start, result.sunrise)
        XCTAssertLessThanOrEqual(result.rahuKalam.end, result.sunset.addingTimeInterval(1))
    }

    // MARK: - Abhijit muhurta = solar noon ± 24 min

    func testAbhijitMuhurtaIs48MinutesCenteredOnNoon() throws {
        let calc = PanchangaCalculator()
        let d = date(2024, 6, 21, zone: ist)  // summer solstice

        let result: PanchangaData
        do {
            result = try calc.calculate(for: d, coordinate: mumbai, timezone: ist)
        } catch {
            throw XCTSkip("Swiss Ephemeris unavailable: \(error)")
        }

        let noon = result.sunrise.addingTimeInterval(
            result.sunset.timeIntervalSince(result.sunrise) / 2.0
        )
        let center = result.abhijitMuhurta.start.addingTimeInterval(result.abhijitMuhurta.duration / 2)

        XCTAssertEqual(center.timeIntervalSince(noon), 0, accuracy: 1.0, "abhijit window must center on solar noon")
        XCTAssertEqual(result.abhijitMuhurta.duration, 48 * 60, accuracy: 1.0, "abhijit duration must be 48 min")
    }

    // MARK: - Rahu kalam weekday table

    /// The rahu kalam slice index for each weekday (0=Sun..6=Sat), 1-based part of 8.
    /// Matches the private table inside PanchangaCalculator.
    private let expectedPartByWeekday: [Int] = [8, 2, 7, 5, 6, 4, 3]

    func testRahuKalamAlignsWithWeekdayTable() throws {
        let calc = PanchangaCalculator()

        // Seven consecutive days spanning all weekdays.
        // 2024-01-07 is a Sunday in IST.
        for offset in 0..<7 {
            let d = date(2024, 1, 7 + offset, zone: ist)

            let result: PanchangaData
            do {
                result = try calc.calculate(for: d, coordinate: mumbai, timezone: ist)
            } catch {
                throw XCTSkip("Swiss Ephemeris unavailable: \(error)")
            }

            var cal = Calendar(identifier: .gregorian)
            cal.timeZone = ist
            let weekday = cal.component(.weekday, from: d) - 1
            let expectedPartIndex = expectedPartByWeekday[weekday] - 1

            let partLength = result.sunset.timeIntervalSince(result.sunrise) / 8.0
            let expectedStart = result.sunrise.addingTimeInterval(Double(expectedPartIndex) * partLength)

            XCTAssertEqual(
                result.rahuKalam.start.timeIntervalSince1970,
                expectedStart.timeIntervalSince1970,
                accuracy: 1.0,
                "rahu kalam start wrong for weekday \(weekday)"
            )
        }
    }

    // MARK: - ScrubCopy classification

    func testScrubCopyClassifiesAvoidAndBestWindowsByPriority() {
        // Build guidance with an avoid window 09:00–10:30 and best window 12:00–12:48 in UTC.
        let base = Date(timeIntervalSince1970: 1_714_000_000)
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        let startOfDay = cal.startOfDay(for: base)

        let avoidStart = startOfDay.addingTimeInterval(9 * 3600)
        let avoid = DateInterval(start: avoidStart, duration: 90 * 60)
        let bestStart = startOfDay.addingTimeInterval(12 * 3600)
        let best = DateInterval(start: bestStart, duration: 48 * 60)

        let g = DailyGuidance(
            headline: "test",
            color: "Yellow",
            food: "Rice",
            avoidWindow: avoid,
            strongestWindow: best,
            detailedText: "test detail long enough to pass length checks for the scrubber.",
            nakshatraIndex: 1,
            tithiIndex: 1
        )

        let utc = TimeZone(identifier: "UTC")!

        // 9:30 UTC → minute 570 → avoid
        XCTAssertEqual(ScrubCopy.headline(for: 570, guidance: g, timezone: utc), "Hold off. Don't commit right now.")
        // 12:20 UTC → minute 740 → best
        XCTAssertEqual(ScrubCopy.headline(for: 740, guidance: g, timezone: utc), "Push now. This is your window.")
        // 3:00 UTC → minute 180 → night
        XCTAssertEqual(ScrubCopy.headline(for: 180, guidance: g, timezone: utc), "Rest. Nothing worth doing yet.")
        // 8:00 UTC → minute 480 → morning (outside avoid/best)
        XCTAssertEqual(ScrubCopy.headline(for: 480, guidance: g, timezone: utc), "Steady start. Ease into the day.")
        // 18:00 UTC → minute 1080 → evening
        XCTAssertEqual(ScrubCopy.headline(for: 1080, guidance: g, timezone: utc), "Wind down. Close loops, don't open them.")
        // 22:00 UTC → minute 1320 → lateNight
        XCTAssertEqual(ScrubCopy.headline(for: 1320, guidance: g, timezone: utc), "Rest. The day is done.")
    }
}
