import SwiftUI

/// A shape that traces a segment of the day's quadratic-bezier arc
/// from normalized t=start to t=end (t ∈ [0,1] spans midnight → next midnight).
/// Control points: P0=(6,42) P1=(150,-14) P2=(294,42) in a (300×54) coordinate
/// space, scaled to the view's bounds. Kept in VedicCore so both the widget
/// extension and the app can reuse it.
public struct ArcShape: Shape {
    public let start: CGFloat
    public let end: CGFloat

    public init(start: CGFloat, end: CGFloat) {
        self.start = start
        self.end = end
    }

    /// Returns the point on the arc at normalized parameter t, mapped into `size`.
    public static func point(on t: CGFloat, in size: CGSize) -> CGPoint {
        let ct = max(0, min(1, t))
        let u = 1 - ct
        let nx = u * u * 6  + 2 * u * ct * 150 + ct * ct * 294
        let ny = u * u * 42 + 2 * u * ct * -14 + ct * ct * 42
        return CGPoint(
            x: (nx / 300) * size.width,
            y: (ny / 54) * size.height
        )
    }

    public func path(in rect: CGRect) -> Path {
        var path = Path()
        guard end > start else { return path }
        let steps = 40
        for i in 0...steps {
            let t = start + (end - start) * CGFloat(i) / CGFloat(steps)
            let pt = ArcShape.point(on: t, in: rect.size)
            if i == 0 { path.move(to: pt) } else { path.addLine(to: pt) }
        }
        return path
    }
}
