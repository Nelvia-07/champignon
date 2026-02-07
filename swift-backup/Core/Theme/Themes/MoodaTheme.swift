import SwiftUI

/// 手账风格主题 (参考 Mooda)
struct MoodaTheme: AppTheme {
    var backgroundColor: Color = Color(hex: "F9F6F1")
    var secondaryBackgroundColor: Color = Color(hex: "EBE6DE")
    var accentColor: Color = Color(hex: "BFA28E")
    var textColor: Color = Color(hex: "4A4A4A")
    var secondaryTextColor: Color = Color(hex: "8E8E8E")
    
    var cardBackground: AnyView {
        AnyView(
            ZStack {
                RoundedRectangle(cornerRadius: cardCornerRadius)
                    .fill(Color.white)
                // 这里未来可以添加纸张纹理
            }
        )
    }
    
    var cardShadow: ShadowStyle = ShadowStyle(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
    var cardCornerRadius: CGFloat = 20
    
    var titleFont: Font = .custom("PingFangSC-Semibold", size: 20)
    var bodyFont: Font = .custom("PingFangSC-Regular", size: 16)
    var dateFont: Font = .custom("Cochin", size: 14)
    
    func icon(for mood: MoodType) -> Image {
        // 占位图标，未来替换为手绘素材
        switch mood {
        case .radiant: return Image(systemName: "sun.max.fill")
        case .happy: return Image(systemName: "face.smiling.fill")
        case .neutral: return Image(systemName: "face.dashed.fill")
        case .gloomy: return Image(systemName: "cloud.rain.fill")
        case .angry: return Image(systemName: "flame.fill")
        case .anxious: return Image(systemName: "waveform.path.ecg")
        case .tired: return Image(systemName: "bed.double.fill")
        }
    }
}

/// 辅助扩展：Hex 颜色
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}
