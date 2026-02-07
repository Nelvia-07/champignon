import SwiftUI

/// 主题管理器，负责保存和切换当前主题
class ThemeManager: ObservableObject {
    @Published var currentTheme: AppTheme = MoodaTheme()
    @Published var isHandDrawnStyle: Bool = true {
        didSet {
            currentTheme = isHandDrawnStyle ? MoodaTheme() : FlomoTheme()
        }
    }
    
    func toggleTheme() {
        isHandDrawnStyle.toggle()
    }
}
