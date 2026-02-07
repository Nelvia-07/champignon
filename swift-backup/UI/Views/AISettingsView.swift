import SwiftUI

struct AISettingsView: View {
    @EnvironmentObject var theme: ThemeManager
    @StateObject private var aiService = AIService.shared
    @Environment(\.dismiss) private var dismiss
    
    @AppStorage("custom_ai_prompt") private var customPrompt: String = "分析以下日记内容的心情（提供一个表情）和相关的标签（最多3个，用分号隔开）。"
    
    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("自定义识别 Prompt")) {
                    TextEditor(text: $customPrompt)
                        .frame(height: 150)
                        .font(.system(.body, design: .monospaced))
                    
                    Text("提示：此指令将直接发送给本地 LLM。您可以要求它使用特定的语气或标签风格。")
                        .font(.caption)
                        .foregroundColor(theme.currentTheme.secondaryTextColor)
                }
                
                Section {
                    Button("恢复默认设置", role: .destructive) {
                        customPrompt = "分析以下日记内容的心情（提供一个表情）和相关的标签（最多3个，用分号隔开）。"
                    }
                }
            }
            .navigationTitle("AI 设置")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("完成") { dismiss() }
                }
            }
        }
    }
}
