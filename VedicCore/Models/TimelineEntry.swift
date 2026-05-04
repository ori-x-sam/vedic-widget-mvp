import Foundation

/// A single widget timeline entry — one per hour.
public struct VedicTimelineEntry: Sendable {
    /// The date this entry becomes current.
    public let date: Date

    /// The day's guidance (headline, color, food are stable all day;
    /// isInAvoidWindow changes hour to hour).
    public let guidance: DailyGuidance

    /// True when `date` falls inside the rahu kalam avoid window.
    public let isInAvoidWindow: Bool

    /// True when `date` falls inside the abhijit muhurta strongest window.
    public let isInStrongestWindow: Bool

    public init(date: Date, guidance: DailyGuidance) {
        self.date = date
        self.guidance = guidance
        self.isInAvoidWindow = guidance.avoidWindow.contains(date)
        self.isInStrongestWindow = guidance.strongestWindow.contains(date)
    }
}
