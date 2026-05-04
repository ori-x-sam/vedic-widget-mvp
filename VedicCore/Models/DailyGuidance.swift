import Foundation

/// The fully-interpreted output for a single day, ready for display in the widget and app.
public struct DailyGuidance: Codable, Sendable {
    /// One-line summary ≤ 60 chars. Plain English, actionable.
    public let headline: String

    /// Single color word (e.g. "Yellow", "Blue").
    public let color: String

    /// 1–3 word food suggestion (e.g. "Rice", "Fresh fruit").
    public let food: String

    /// Rahu kalam — the avoid window for the day.
    public let avoidWindow: DateInterval

    /// Abhijit muhurta — the strongest window for the day.
    public let strongestWindow: DateInterval

    /// 2–3 sentence elaboration for the large widget / Today view.
    public let detailedText: String

    /// Which nakshatra (1–27) drove this guidance.
    public let nakshatraIndex: Int

    /// Which tithi (1–30) drove this guidance.
    public let tithiIndex: Int

    public init(
        headline: String,
        color: String,
        food: String,
        avoidWindow: DateInterval,
        strongestWindow: DateInterval,
        detailedText: String,
        nakshatraIndex: Int,
        tithiIndex: Int
    ) {
        self.headline = headline
        self.color = color
        self.food = food
        self.avoidWindow = avoidWindow
        self.strongestWindow = strongestWindow
        self.detailedText = detailedText
        self.nakshatraIndex = nakshatraIndex
        self.tithiIndex = tithiIndex
    }
}

// DateInterval Codable conformance (not in stdlib for all platforms)
extension DateInterval: @retroactive Codable {
    enum CodingKeys: String, CodingKey { case start, duration }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let start    = try c.decode(Date.self, forKey: .start)
        let duration = try c.decode(TimeInterval.self, forKey: .duration)
        self.init(start: start, duration: duration)
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(start, forKey: .start)
        try c.encode(duration, forKey: .duration)
    }
}
