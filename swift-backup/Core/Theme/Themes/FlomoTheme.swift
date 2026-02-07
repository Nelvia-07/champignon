import SwiftUI

/// 极简风格主题 (参考 flomo)
struct FlomoTheme: AppTheme {
    var backgroundColor: Color = Color.white
    var secondaryBackgroundColor: Color = Color(hex: "F2F2F2")
    var accentColor: Color = Color(hex: "5CB85C") // flomo 绿色
    var textColor: Color = Color(hex: "333333")
    var secondaryTextColor: Color = Color(hex: "999999")
    
    var cardBackground: AnyView {
        AnyView(
            RoundedRectangle(cornerRadius: cardCornerRadius)
                .fill(secondaryBackgroundColor)
        )
    }
    
    var cardShadow: ShadowStyle = ShadowStyle(color: Color.clear, radius: 0, x: 0, y: 0) // 极简风格通常无阴影
    var cardCornerRadius: CGFloat = 8
    
    var titleFont: Font = .system(size: 18, weight: .bold, design: .default)
    var bodyFont: Font = .system(size: 16, weight: .regular, design: .default)
    var dateFont: Font = .system(size: 13, weight: .light, design: .monospaced)
    
    func icon(for mood: MoodType) -> Image {
        // 极简风格使用系统图标
        switch mood {
        case .radiant: return Image(systemName: "sun.max")
        case .happy: return Image(systemName: "smiley")
        case .neutral: return Image(systemName: "face.dashed")
        case .gloomy: return Image(systemName: "cloud.rain")
        case .angry: return Image(systemName: "flame")
        case .anxious: return Image(systemName: "waveform")
        case .tired: return Image(systemName: "powersleep")
        }
    }
}
