import SwiftUI

/// Maps a content-library color name (e.g. "Yellow", "Blue-black") to a
/// SwiftUI `Color` for rendering. Unknown names fall back to a neutral grey
/// so we never crash on unexpected content. Shared by the app and widget.
public enum WidgetColor {
    public static func from(_ name: String) -> Color {
        let key = name.lowercased().replacingOccurrences(of: " ", with: "")
        switch key {
        case "red":            return Color(red: 0.90, green: 0.30, blue: 0.24)
        case "black":          return Color(red: 0.15, green: 0.15, blue: 0.15)
        case "white":          return Color.white
        case "pink":           return Color(red: 1.00, green: 0.72, blue: 0.80)
        case "green":          return Color(red: 0.40, green: 0.80, blue: 0.45)
        case "blue":           return Color(red: 0.38, green: 0.56, blue: 0.92)
        case "yellow":         return Color(red: 1.00, green: 0.84, blue: 0.29)
        case "ivory":          return Color(red: 0.97, green: 0.94, blue: 0.85)
        case "coral":          return Color(red: 1.00, green: 0.50, blue: 0.41)
        case "orange":         return Color(red: 1.00, green: 0.55, blue: 0.20)
        case "smokygrey",
             "grey", "gray":   return Color(red: 0.60, green: 0.60, blue: 0.62)
        case "gold":           return Color(red: 0.95, green: 0.77, blue: 0.30)
        case "cream":          return Color(red: 0.98, green: 0.93, blue: 0.84)
        case "brown":          return Color(red: 0.55, green: 0.36, blue: 0.22)
        case "silver":         return Color(red: 0.80, green: 0.80, blue: 0.83)
        case "copper":         return Color(red: 0.72, green: 0.45, blue: 0.20)
        case "blue-black",
             "blueblack":      return Color(red: 0.13, green: 0.16, blue: 0.24)
        case "purple":         return Color(red: 0.56, green: 0.40, blue: 0.85)
        case "saffronrice":    return Color(red: 0.96, green: 0.60, blue: 0.18)
        case "sweetrice":      return Color(red: 1.00, green: 0.95, blue: 0.75)
        default:               return Color(red: 0.70, green: 0.70, blue: 0.72)
        }
    }
}
