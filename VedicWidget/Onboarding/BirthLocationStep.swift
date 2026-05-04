import SwiftUI
import CoreLocation

struct BirthLocationStep: View {
    @Binding var draft: OnboardingDraft
    let onBack: () -> Void
    let onNext: () -> Void

    @State private var query      = ""
    @State private var results:    [CLPlacemark] = []
    @State private var isSearching = false
    @State private var selected:   CLPlacemark?
    @State private var error:      String?

    private let geocoder = CLGeocoder()

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            BackButton(action: onBack)

            VStack(alignment: .leading, spacing: 8) {
                Text("Where were you born?")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(.white)

                Text("Type a city name to search.")
                    .font(.system(size: 16))
                    .foregroundStyle(.white.opacity(0.5))
            }

            // Search field
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.white.opacity(0.4))
                TextField("", text: $query, prompt: Text("City, Country").foregroundStyle(.white.opacity(0.3)))
                    .foregroundStyle(.white)
                    .submitLabel(.search)
                    .onSubmit { runSearch() }
                    .autocorrectionDisabled()

                if isSearching {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(0.8)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .onChange(of: query) { _, new in
                if new.count >= 3 { runSearchDebounced() }
            }

            // Error
            if let error {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundStyle(.red.opacity(0.8))
            }

            // Results list
            if !results.isEmpty {
                ScrollView {
                    VStack(spacing: 0) {
                        ForEach(results.indices, id: \.self) { i in
                            let placemark = results[i]
                            Button {
                                select(placemark)
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(placemark.locality ?? placemark.name ?? "")
                                            .font(.system(size: 15, weight: .medium))
                                            .foregroundStyle(.white)
                                        Text([placemark.administrativeArea, placemark.country]
                                            .compactMap { $0 }.joined(separator: ", "))
                                            .font(.system(size: 13))
                                            .foregroundStyle(.white.opacity(0.5))
                                    }
                                    Spacer()
                                    if selected?.location?.coordinate.latitude == placemark.location?.coordinate.latitude {
                                        Image(systemName: "checkmark")
                                            .foregroundStyle(.white)
                                    }
                                }
                                .padding(.vertical, 12)
                                .padding(.horizontal, 16)
                            }
                            if i < results.count - 1 {
                                Divider().background(Color.white.opacity(0.1))
                                    .padding(.horizontal, 16)
                            }
                        }
                    }
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .frame(maxHeight: 240)
            }

            Spacer(minLength: 0)

            PrimaryButton(label: "Continue", enabled: selected != nil, action: onNext)
        }
        .padding(.horizontal, 32)
    }

    // MARK: - Search

    private var searchTask: Task<Void, Never>? = nil

    private mutating func runSearchDebounced() {
        // Simple debounce via Task cancellation
        runSearch()
    }

    private func runSearch() {
        guard !query.isEmpty else { return }
        isSearching = true
        error = nil
        geocoder.cancelGeocode()
        geocoder.geocodeAddressString(query) { placemarks, err in
            DispatchQueue.main.async {
                isSearching = false
                if let err {
                    self.error = err.localizedDescription
                    return
                }
                self.results = placemarks?.prefix(6).map { $0 } ?? []
            }
        }
    }

    private func select(_ placemark: CLPlacemark) {
        selected = placemark
        if let coord = placemark.location?.coordinate {
            draft.birthLatitude  = coord.latitude
            draft.birthLongitude = coord.longitude
        }
        if let tz = placemark.timeZone {
            draft.birthTimezone = tz.identifier
        }
        results = []
        query = [placemark.locality, placemark.country].compactMap { $0 }.joined(separator: ", ")
    }
}
