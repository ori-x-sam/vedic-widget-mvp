import Foundation

/// Shared App Group identifier. The app target writes `SharedProfile` here;
/// the widget extension reads from it. Both targets must have the matching
/// App Group capability enabled and this identifier listed in their
/// entitlements files.
///
/// Change this once (and the matching entitlement) when you replace the
/// placeholder "yourteam" with your actual Apple Team / reverse-DNS prefix.
public enum AppGroup {
    public static let identifier = "group.com.yourteam.vedicwidget"
}
