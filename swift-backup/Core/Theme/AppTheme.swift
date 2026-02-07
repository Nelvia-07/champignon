import SwiftUI

/// 定义心情树洞的主题协议
/// 所有的设计风格（手账风、极简风）都需要实现此协议，以便于 UI 层的解耦和一键切换。
protocol AppTheme {
    // 基础颜色
    var backgroundColor: Color { get }
    var secondaryBackgroundColor: Color { get }
    var accentColor: Color { get }
    var textColor: Color { get }
    var secondaryTextColor: Color { get }
    
    // 卡片样式
    var cardBackground: AnyView { get }
    var cardShadow: ShadowStyle { get }
    var cardCornerRadius: CGFloat { get }
    
    // 字体规范
    var titleFont: Font { get }
    var bodyFont: Font { get }
    var dateFont: Font { get }
    
    // 心情图标映射
    func icon(for mood: MoodType) -> Image
}

/// 阴影样式定义
struct ShadowStyle {
    var color: Color
    var radius: CGFloat
    var x: CGFloat
    var y: CGFloat
}

/// 心情类型定义
enum MoodType: String, Codable, CaseIterable {
    case radiant = "radiant"
    case happy = "happy"
    case neutral = "neutral"
    case gloomy = "gloomy"
    case angry = "angry"
    case anxious = "anxious"
    case tired = "tired"
}
