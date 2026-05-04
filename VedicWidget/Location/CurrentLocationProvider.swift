import Foundation
import CoreLocation
import WidgetKit
import VedicCore

/// Requests "when in use" location permission and, on success, writes the
/// current coordinate + timezone into `SharedProfile` so both the Today
/// view and the widget timeline pick up the user's *actual* city for
/// today's windows.
///
/// No toggle. If the user declines permission we silently leave the
/// current-location fields nil; SharedProfile falls back to birth location.
/// TODO: once we have a header slot, surface a subtle "using birth location"
/// hint when `profile.isUsingBirthLocationFallback` is true.
final class CurrentLocationProvider: NSObject, ObservableObject, CLLocationManagerDelegate {

    static let shared = CurrentLocationProvider()

    private let manager = CLLocationManager()
    private var hasRequested = false

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer   // city-level is plenty for rahu kalam
        manager.distanceFilter = 5_000                            // 5km moves only
    }

    /// Request permission (if not determined) and a one-shot location fix.
    /// Safe to call repeatedly; real work is gated.
    func requestIfNeeded() {
        switch manager.authorizationStatus {
        case .notDetermined:
            if !hasRequested {
                hasRequested = true
                manager.requestWhenInUseAuthorization()
            }
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        case .denied, .restricted:
            // Fall back silently. SharedProfile handles the nil case.
            break
        @unknown default:
            break
        }
    }

    // MARK: - CLLocationManagerDelegate

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        let lat = loc.coordinate.latitude
        let lon = loc.coordinate.longitude

        // Resolve timezone from the coordinate. CLGeocoder is async; until
        // it responds we write lat/lon with a nil timezone (SharedProfile
        // falls back to birth timezone for the tz in that window).
        SharedProfileStore.updateCurrentLocation(
            latitude: lat,
            longitude: lon,
            timezone: nil,
            appGroup: AppGroup.identifier
        )

        CLGeocoder().reverseGeocodeLocation(loc) { placemarks, _ in
            let tzID = placemarks?.first?.timeZone?.identifier
            SharedProfileStore.updateCurrentLocation(
                latitude: lat,
                longitude: lon,
                timezone: tzID,
                appGroup: AppGroup.identifier
            )
            // Kick the widget so it recomputes windows against the new location.
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Silent fallback — SharedProfile will keep whatever it had (possibly nil).
    }
}
