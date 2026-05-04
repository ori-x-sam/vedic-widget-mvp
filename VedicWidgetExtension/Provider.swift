import Foundation
import WidgetKit
import CoreLocation
import VedicCore

/// One entry per hour across the current day.
///
/// Why hourly: the guidance *content* (headline/color/food) is stable all day
/// and derives from the moon's longitude at sunrise. What changes hour-to-hour
/// is whether "now" sits inside the rahu kalam (avoid) or abhijit muhurta (best)
/// window — so the small-widget status dot can flip. Hourly entries keep that
/// accurate without blowing the widget refresh budget.
struct VedicProvider: TimelineProvider {

    // MARK: - Placeholder (redacted first paint)

    func placeholder(in context: Context) -> VedicTimelineEntry {
        VedicTimelineEntry(date: Date(), guidance: .placeholder)
    }

    // MARK: - Snapshot (widget gallery)

    func getSnapshot(in context: Context, completion: @escaping (VedicTimelineEntry) -> Void) {
        if context.isPreview {
            completion(VedicTimelineEntry(date: Date(), guidance: .placeholder))
            return
        }
        let entry = makeCurrentEntry() ?? VedicTimelineEntry(date: Date(), guidance: .placeholder)
        completion(entry)
    }

    // MARK: - Timeline (hourly entries until next midnight, then refresh)

    func getTimeline(in context: Context, completion: @escaping (Timeline<VedicTimelineEntry>) -> Void) {
        let now = Date()

        guard let profile = SharedProfileStore.read(appGroup: AppGroup.identifier) else {
            // No profile yet — show placeholder and retry in an hour.
            let entry = VedicTimelineEntry(date: now, guidance: .placeholder)
            let refresh = now.addingTimeInterval(3600)
            completion(Timeline(entries: [entry], policy: .after(refresh)))
            return
        }

        // Daily windows (sunrise/sunset, rahu kalam, abhijit) must anchor to
        // the user's *current* location, not birth. SharedProfile falls back
        // to birth automatically when we don't yet have a current-location fix.
        let tz = profile.todayTimeZone
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = tz

        // Compute today's guidance once, then stamp it onto hourly dates.
        guard let guidance = computeGuidance(profile: profile, date: now) else {
            let entry = VedicTimelineEntry(date: now, guidance: .placeholder)
            let refresh = now.addingTimeInterval(3600)
            completion(Timeline(entries: [entry], policy: .after(refresh)))
            return
        }

        // Build hourly entries from the current hour until the start of tomorrow.
        let startOfToday = cal.startOfDay(for: now)
        guard let startOfTomorrow = cal.date(byAdding: .day, value: 1, to: startOfToday) else {
            completion(Timeline(entries: [VedicTimelineEntry(date: now, guidance: guidance)],
                                policy: .after(now.addingTimeInterval(3600))))
            return
        }

        var entries: [VedicTimelineEntry] = []

        // Start at the top of the current hour so alignments land on clean boundaries.
        let hourComponents = cal.dateComponents([.year, .month, .day, .hour], from: now)
        var cursor = cal.date(from: hourComponents) ?? now

        while cursor < startOfTomorrow {
            entries.append(VedicTimelineEntry(date: cursor, guidance: guidance))
            guard let next = cal.date(byAdding: .hour, value: 1, to: cursor) else { break }
            cursor = next
        }

        // Final entry at tomorrow 00:00 triggers a fresh timeline generation
        // with next-day guidance.
        completion(Timeline(entries: entries, policy: .after(startOfTomorrow)))
    }

    // MARK: - Computation

    private func makeCurrentEntry() -> VedicTimelineEntry? {
        guard let profile = SharedProfileStore.read(appGroup: AppGroup.identifier),
              let guidance = computeGuidance(profile: profile, date: Date())
        else { return nil }
        return VedicTimelineEntry(date: Date(), guidance: guidance)
    }

    private func computeGuidance(profile: SharedProfile, date: Date) -> DailyGuidance? {
        let calculator = PanchangaCalculator()
        do {
            // Use *today* coordinate/timezone — rahu kalam and abhijit
            // belong to "here, now", not "where I was born".
            let panchang = try calculator.calculate(
                for: date,
                coordinate: profile.todayCoordinate,
                timezone: profile.todayTimeZone
            )
            return GuidanceEngine.shared.guidance(from: panchang)
        } catch {
            return nil
        }
    }
}

// MARK: - Placeholder guidance

extension DailyGuidance {
    /// A plausible-looking placeholder for first paint / no-profile states.
    /// Shown only briefly while real data computes.
    static let placeholder: DailyGuidance = {
        let now = Date()
        let avoidStart = now.addingTimeInterval(2 * 3600)
        let bestStart  = now.addingTimeInterval(-30 * 60)
        return DailyGuidance(
            headline: "Steady day. Good for finishing things.",
            color: "Yellow",
            food: "Rice",
            avoidWindow: DateInterval(start: avoidStart, duration: 90 * 60),
            strongestWindow: DateInterval(start: bestStart, duration: 48 * 60),
            detailedText: "Today rewards care, precision, and patience. Good day to wrap up loose ends.",
            nakshatraIndex: 8,
            tithiIndex: 5
        )
    }()
}
