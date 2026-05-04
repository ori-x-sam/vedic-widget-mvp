import Foundation

/// A short modifier phrase that overlays the nakshatra headline.
/// Used by GuidanceEngine to colour the daily tone.
public enum TithiContent {

    /// Returns the modifier phrase for a given tithi (1–30).
    public static func modifier(for tithi: Int) -> String {
        let clamped = max(1, min(30, tithi))
        return table[clamped - 1]
    }

    // 30 entries, index 0 = tithi 1 (Pratipada) … index 29 = tithi 30 (Amavasya)
    private static let table: [String] = [
        // 1 — Pratipada (Shukla): fresh start energy; good for launching anything new
        "Good day for new starts.",
        // 2 — Dvitiya: stable, forward-moving; builds on what was begun
        "Keep building on yesterday's momentum.",
        // 3 — Tritiya: action-oriented; physical effort pays off
        "Push physical or hands-on work today.",
        // 4 — Chaturthi: slow-start day; don't force things in the morning
        "Slow start — pick up speed after noon.",
        // 5 — Panchami: detail work benefits; avoid rash moves
        "Good for detailed, careful work.",
        // 6 — Shashthi: creative and expressive energy is high
        "Let creativity lead.",
        // 7 — Saptami: productive mid-cycle; routines click
        "Routines run smoothly today.",
        // 8 — Ashtami: tension possible; avoid confrontation if you can
        "Low drama wins — skip unnecessary conflicts.",
        // 9 — Navami: sharp and fast-moving; things resolve quickly
        "Decisions made quickly tend to stick.",
        // 10 — Dashami: good for completion and recognition
        "Wrap things up; credit follows.",
        // 11 — Ekadashi: contemplative; light physical activity; fasting beneficial
        "Lighter day — mental work over physical grind.",
        // 12 — Dvadashi: social and giving; generosity returns
        "Good day for helping and being helped.",
        // 13 — Trayodashi: moving energy; good for travel and transitions
        "Movement pays off today — start journeys.",
        // 14 — Chaturdashi: intense; watch temper and edge cases
        "Intensity is up — stay measured.",
        // 15 — Purnima (Full Moon): peak energy; emotions and plans amplified
        "Full energy day. Amplifies everything.",
        // 16 — Pratipada (Krishna): energy starts pulling inward; good for review
        "Turn inward; review what's working.",
        // 17 — Dvitiya (Krishna): consolidation; protect what you have
        "Hold steady; protect your position.",
        // 18 — Tritiya (Krishna): let go of what isn't needed
        "Cut what's slowing you down.",
        // 19 — Chaturthi (Krishna): obstacle-clearing energy; fix problems
        "Good day for removing blockers.",
        // 20 — Panchami (Krishna): quiet productivity; background work runs well
        "Background tasks move faster today.",
        // 21 — Shashthi (Krishna): reflective and inward; avoid big launches
        "Hold new launches until tomorrow.",
        // 22 — Saptami (Krishna): rhythm continues; persistence pays
        "Keep showing up — compounding works today.",
        // 23 — Ashtami (Krishna): caution with finances and agreements
        "Double-check money and contracts today.",
        // 24 — Navami (Krishna): energy dips slightly; pace yourself
        "Pace yourself — don't overcommit.",
        // 25 — Dashami (Krishna): clarity returns; planning works well
        "Good day for planning next steps.",
        // 26 — Ekadashi (Krishna): contemplative; spiritual work, study, reflection
        "Quiet work and reflection return results.",
        // 27 — Dvadashi (Krishna): recharge; relationships benefit
        "Invest in people today.",
        // 28 — Trayodashi (Krishna): waning but still useful for wrapping up
        "Finish what's already in motion.",
        // 29 — Chaturdashi (Krishna): intense; rest more than usual
        "Rest is productive today.",
        // 30 — Amavasya (New Moon): inward, rest, plant seeds quietly
        "New moon: rest and plant new intentions.",
    ]
}
