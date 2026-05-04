import Foundation

/// Takes computed panchang data and produces human-readable daily guidance.
/// In v1 the UserProfile is accepted but not used (we use panchang only).
public final class GuidanceEngine {

    public static let shared = GuidanceEngine()

    public init() {}

    // MARK: - Public API

    public func guidance(from panchang: PanchangaData) -> DailyGuidance {
        let nakshatraEntry = NakshatraContent.entry(for: panchang.nakshatra)
        let tithiModifier  = TithiContent.modifier(for: panchang.tithi)

        // Headline: nakshatra headline + tithi modifier on a new line
        let headline = buildHeadline(nakshatraEntry: nakshatraEntry, tithiModifier: tithiModifier)

        // Detailed text: nakshatra detail + time window sentences
        let detailedText = buildDetail(
            nakshatraEntry: nakshatraEntry,
            panchang: panchang
        )

        return DailyGuidance(
            headline: headline,
            color: nakshatraEntry.color,
            food: nakshatraEntry.food,
            avoidWindow: panchang.rahuKalam,
            strongestWindow: panchang.abhijitMuhurta,
            detailedText: detailedText,
            nakshatraIndex: panchang.nakshatra,
            tithiIndex: panchang.tithi
        )
    }

    // MARK: - Builders

    private func buildHeadline(nakshatraEntry: NakshatraEntry, tithiModifier: String) -> String {
        // If both sentences fit in 60 chars, combine; otherwise use nakshatra headline alone.
        let combined = "\(nakshatraEntry.headline) \(tithiModifier)"
        if combined.count <= 60 {
            return combined
        }
        return nakshatraEntry.headline
    }

    private func buildDetail(nakshatraEntry: NakshatraEntry, panchang: PanchangaData) -> String {
        let avoidLine     = TimeWindowContent.avoidLine(for: panchang.rahuKalam)
        let strongestLine = TimeWindowContent.strongestWindowLine(for: panchang.abhijitMuhurta)
        return "\(nakshatraEntry.detailedText) \(avoidLine) \(strongestLine)"
    }
}
