import SwiftUI
import VedicCore

/// Hidden debug screen — revealed from SettingsView by long-pressing the
/// Version row 5 times. Shows raw counters and a Reset button. Zero
/// network, local-only, intended for QA + dogfooding.
struct TelemetryDebugView: View {

    @State private var snapshot: [(Telemetry.Counter, Int)] = Telemetry.snapshot()

    var body: some View {
        List {
            Section("Counters") {
                ForEach(snapshot, id: \.0.rawValue) { pair in
                    HStack {
                        Text(pair.0.displayName)
                        Spacer()
                        Text("\(pair.1)")
                            .font(.system(.body, design: .monospaced))
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Section {
                Button(role: .destructive) {
                    Telemetry.resetAll()
                    snapshot = Telemetry.snapshot()
                } label: {
                    Text("Reset")
                }
            } footer: {
                Text("Local-only. Nothing is uploaded.")
            }
        }
        .navigationTitle("Debug")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            snapshot = Telemetry.snapshot()
        }
    }
}
