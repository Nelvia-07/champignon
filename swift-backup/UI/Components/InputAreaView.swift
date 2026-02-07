import SwiftUI
import SwiftData

struct InputAreaView: View {
    @EnvironmentObject var theme: ThemeManager
    @Environment(\.modelContext) private var modelContext
    @StateObject private var aiService = AIService.shared
    @Binding var parentNote: MoodNote?
    @State private var text: String = ""
    @State private var isAnalyzing: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            theme.currentTheme.cardBackground
                .overlay(
                    VStack(spacing: 0) {
                        if let parent = parentNote {
                            HStack {
                                Text("回复：\(parent.content)")
                                    .font(.caption)
                                    .lineLimit(1)
                                    .foregroundColor(theme.currentTheme.accentColor)
                                Spacer()
                                Button(action: { parentNote = nil }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(theme.currentTheme.secondaryTextColor)
                                }
                            }
                            .padding(.horizontal, 8)
                            .padding(.top, 4)
                        }
                        
                        TextEditor(text: $text)
                            .frame(height: 100)
                            .scrollContentBackground(.hidden)
                            .padding(8)
                            .font(theme.currentTheme.bodyFont)
                        
                        HStack {
                            Button(action: {
                                // 图片上传占位
                            }) {
                                Image(systemName: "photo")
                                    .foregroundColor(theme.currentTheme.secondaryTextColor)
                            }
                            
                            Button(action: {
                                // 语音转文字占位
                            }) {
                                Image(systemName: "mic")
                                    .foregroundColor(theme.currentTheme.secondaryTextColor)
                            }
                            
                            Spacer()
                            
                            Button(action: saveNote) {
                                if isAnalyzing {
                                    ProgressView()
                                        .tint(.white)
                                        .padding(10)
                                        .background(theme.currentTheme.accentColor)
                                        .clipShape(Circle())
                                } else {
                                    Image(systemName: "paperplane.fill")
                                        .padding(10)
                                        .background(text.isEmpty ? Color.gray.opacity(0.3) : theme.currentTheme.accentColor)
                                        .foregroundColor(.white)
                                        .clipShape(Circle())
                                }
                            }
                            .disabled(text.isEmpty || isAnalyzing)
                        }
                        .padding([.horizontal, .bottom], 8)
                    }
                )
                .frame(height: 150)
                .clipShape(RoundedRectangle(cornerRadius: theme.currentTheme.cardCornerRadius))
                .shadow(
                    color: theme.currentTheme.cardShadow.color,
                    radius: theme.currentTheme.cardShadow.radius,
                    x: theme.currentTheme.cardShadow.x,
                    y: theme.currentTheme.cardShadow.y
                )
        }
    }
    
    private func saveNote() {
        isAnalyzing = true
        
        Task {
            // 调用 AI 分析
            let analysis = await aiService.analyze(text: text)
            
            await MainActor.run {
                let newNote = MoodNote(content: text, isFollowUp: parentNote != nil)
                newNote.moodType = analysis.mood
                
                if let parent = parentNote {
                    newNote.parentNote = parent
                    parent.followUps.append(newNote)
                }
                
                // 自动添加识别出的标签
                for tagName in analysis.tags {
                    // 这里可以检查标签是否已存在，简单起见直接创建
                    let tag = Tag(name: tagName)
                    modelContext.insert(tag)
                    newNote.tags.append(tag)
                }
                
                modelContext.insert(newNote)
                text = ""
                parentNote = nil
                isAnalyzing = false
                
                // 隐藏键盘
                UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
            }
        }
    }
}
