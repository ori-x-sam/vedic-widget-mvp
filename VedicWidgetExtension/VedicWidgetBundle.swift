import SwiftUI
import WidgetKit
import VedicCore

@main
struct VedicWidgetBundle: WidgetBundle {
    var body: some Widget {
        VedicWidget()
    }
}

struct VedicWidget: Widget {
    let kind: String = "VedicWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VedicProvider()) { entry in
            VedicWidgetEntryView(entry: entry)
                .containerBackground(Color.black, for: .widget)
        }
        .configurationDisplayName("Vedic Daily")
        .description("At-a-glance guidance for the day.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct VedicWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    let entry: VedicTimelineEntry

    /// Deep-link URL that Today-view handles via onOpenURL. The "widgetTap"
    /// host tells the app to bump the `widgetTapsTotal` telemetry counter.
    private static let tapURL = URL(string: "vedicwidget://widgetTap")!

    var body: some View {
        Group {
            switch family {
            case .systemSmall:   SmallWidgetView(entry: entry)
            case .systemMedium:  MediumWidgetView(entry: entry)
            case .systemLarge:   LargeWidgetView(entry: entry)
            default:             SmallWidgetView(entry: entry)
            }
        }
        .widgetURL(Self.tapURL)
    }
}
