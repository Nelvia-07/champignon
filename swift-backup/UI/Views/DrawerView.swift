import SwiftUI

struct DrawerView: View {
    @EnvironmentObject var theme: ThemeManager
    var onTagManagement: () -> Void
    var onAISettings: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // 页眉
            VStack(alignment: .leading, spacing: 8) {
                Text("心情树洞")
                    .font(theme.currentTheme.titleFont)
                    .foregroundColor(theme.currentTheme.textColor)
                Text("记录每一刻的真实")
                    .font(.caption)
                    .foregroundColor(theme.currentTheme.secondaryTextColor)
            }
            .padding(.top, 60)
            .padding(.horizontal)
            .padding(.bottom, 30)
            
            // 菜单列表
            List {
                Section {
                    Label("所有笔记", systemImage: "tray.full")
                        .foregroundColor(theme.currentTheme.textColor)
                    
                    Button(action: onTagManagement) {
                        Label("标签管理", systemImage: "tag")
                            .foregroundColor(theme.currentTheme.textColor)
                    }
                }
                
                Section("设置与偏好") {
                    HStack {
                        Label("手账风格", systemImage: "paintpalette")
                        Spacer()
                        Toggle("", isOn: $theme.isHandDrawnStyle)
                            .labelsHidden()
                    }
                    .foregroundColor(theme.currentTheme.textColor)
                    
                    Button(action: onAISettings) {
                        Label("AI 设置", systemImage: "cpu")
                            .foregroundColor(theme.currentTheme.textColor)
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
            .scrollContentBackground(.hidden)
            
            Spacer()
            
            // 页脚
            Text("v1.0.0")
                .font(.caption2)
                .foregroundColor(theme.currentTheme.secondaryTextColor)
                .padding()
        }
        .background(theme.currentTheme.secondaryBackgroundColor)
        .edgesIgnoringSafeArea(.vertical)
    }
}
