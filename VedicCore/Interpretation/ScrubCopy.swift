import Foundation

/// Copy the Today-view scrubber shows when the user drags the icon away
/// from "now". Phrased as a direct, Co-Star-ish sentence — never poetic.
/// Respects rahu kalam and abhijit muhurta windows in the day's guidance.
public enum ScrubCopy {

    // MARK: - Public API

    public static func headline(for minute: Int, guidance: DailyGuidance, timezone: TimeZone) -> String {
        switch classify(minute, guidance: guidance, timezone: timezone) {
        case .avoid: return "Hold off. Don't commit right now."
        case .best:  return "Push now. This is your window."
        case .night: return "Rest. Nothing worth doing yet."
        case .morning: return "Steady start. Ease into the day."
        case .day:     return "Steady day. Good for finishing things."
        case .evening: return "Wind down. Close loops, don't open them."
        case .lateNight: return "Rest. The day is done."
        }
    }

    public static func modifier(for minute: Int) -> String {
        let h = minute / 60
        switch h {
        case 0..<5:   return "Late — nothing to do but rest."
        case 5..<10:  return "Fresh energy — use it on what needs focus."
        case 10..<17: return "Lighter day — mental work over physical grind."
        case 17..<20: return "Light dimming — wrap things up, don't start new ones."
        default:      return "Wind-down hours — stop, don't plan."
        }
    }

    public static func detail(for minute: Int, guidance: DailyGuidance, timezone: TimeZone) -> String {
        switch classify(minute, guidance: guidance, timezone: timezone) {
        case .avoid:
            return "This window rewards patience. Skip sign-offs, launches, and big asks. Come back in an hour — the rest of the day is workable."
        case .best:
            return "The steadiest stretch of the day for decisions and starts. Send the message you've been sitting on. Ship the thing. Don't overthink."
        case .night:
            return "Night hours aren't for decisions. If you can sleep, sleep. If you can't, read — don't reply."
        case .morning:
            return "Morning favours quiet work over meetings. Clear the easy stuff first, then take on something that needs focus."
        case .day:
            return guidance.detailedText
        case .evening:
            return "Evening is for finishing, not starting. Reply to the last few messages and then stop — whatever you begin now, you'll second-guess tomorrow."
        case .lateNight:
            return "Late night isn't a planning window. Anything that seems urgent right now will look different in the morning."
        }
    }

    // MARK: - Classification

    enum Kind { case avoid, best, night, morning, day, evening, lateNight }

    private static func classify(_ minute: Int, guidance: DailyGuidance, timezone: TimeZone) -> Kind {
        if isInWindow(minute, window: guidance.avoidWindow, timezone: timezone) { return .avoid }
        if isInWindow(minute, window: guidance.strongestWindow, timezone: timezone) { return .best }
        let h = minute / 60
        switch h {
        case 0..<5:   return .night
        case 5..<10:  return .morning
        case 10..<17: return .day
        case 17..<20: return .evening
        default:      return .lateNight
        }
    }

    private static func isInWindow(_ minute: Int, window: DateInterval, timezone: TimeZone) -> Bool {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timezone
        let startOfDay = cal.startOfDay(for: window.start)
        let minOfStart = Int(window.start.timeIntervalSince(startOfDay) / 60)
        let minOfEnd   = Int(window.end.timeIntervalSince(startOfDay) / 60)
        return minute >= minOfStart && minute < minOfEnd
    }
}
