import Foundation

/// Format helpers for rahu kalam and abhijit muhurta display strings.
public enum TimeWindowContent {

    private static let formatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        f.amSymbol = "am"
        f.pmSymbol = "pm"
        return f
    }()

    /// "Avoid important decisions between 1:30pm–3:00pm."
    public static func avoidLine(for interval: DateInterval) -> String {
        let start = formatter.string(from: interval.start)
        let end   = formatter.string(from: interval.end)
        return "Avoid important decisions between \(start)–\(end)."
    }

    /// "Your strongest window today is 12:08pm–12:56pm."
    public static func strongestWindowLine(for interval: DateInterval) -> String {
        let start = formatter.string(from: interval.start)
        let end   = formatter.string(from: interval.end)
        return "Your strongest window today is \(start)–\(end)."
    }

    /// Short form for medium widget: "1:30–3:00pm"
    public static func shortRange(for interval: DateInterval) -> String {
        let startFmt = DateFormatter()
        startFmt.dateFormat = "h:mm"
        let endFmt = DateFormatter()
        endFmt.dateFormat = "h:mma"
        endFmt.amSymbol = "am"
        endFmt.pmSymbol = "pm"
        return "\(startFmt.string(from: interval.start))–\(endFmt.string(from: interval.end))"
    }
}
