import Foundation
import SwiftUI
import VedicCore

/// Polls (once per minute while the app is foregrounded) whether "now" is
/// inside the best (abhijit) or avoid (rahu kalam) window, and fires a
/// haptic whenever the membership flips. One tap on entry, one on exit.
///
/// A 60s tick is coarse but matches the minute-level granularity we
/// surface in the UI; finer polling would burn battery for no visible gain.
final class WindowTransitionMonitor: ObservableObject {

    enum Membership: Equatable {
        case none
        case best
        case avoid
    }

    private var timer: Timer?
    private var lastMembership: Membership = .none
    private var primed = false

    private var bestWindow: DateInterval?
    private var avoidWindow: DateInterval?

    /// Call whenever today's guidance is (re)loaded so we track the right windows.
    func updateWindows(best: DateInterval, avoid: DateInterval) {
        self.bestWindow = best
        self.avoidWindow = avoid
        // Re-prime: set the current membership without firing, so we only
        // fire on actual transitions from here forward.
        lastMembership = membership(at: Date())
        primed = true
    }

    /// Start the foreground tick. Called on scene activation.
    func start() {
        stop()
        // First check immediately so entries that happened mid-minute still register.
        tick()
        let t = Timer(timeInterval: 60, repeats: true) { [weak self] _ in
            self?.tick()
        }
        RunLoop.main.add(t, forMode: .common)
        timer = t
    }

    func stop() {
        timer?.invalidate()
        timer = nil
    }

    private func tick() {
        guard primed else { return }
        let current = membership(at: Date())
        guard current != lastMembership else { return }

        // Transitioned. Any "none → best/avoid" is an entry; any "best/avoid → none"
        // is an exit. A direct best↔avoid flip counts as exit-then-enter.
        switch (lastMembership, current) {
        case (.none, .best), (.none, .avoid):
            Haptics.windowEntered()
        case (.best, .none), (.avoid, .none):
            Haptics.windowExited()
        case (.best, .avoid), (.avoid, .best):
            Haptics.windowExited()
            Haptics.windowEntered()
        default:
            break
        }
        lastMembership = current
    }

    private func membership(at date: Date) -> Membership {
        if let a = avoidWindow, a.contains(date) { return .avoid }
        if let b = bestWindow,  b.contains(date) { return .best }
        return .none
    }
}
