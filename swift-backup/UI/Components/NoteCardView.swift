import SwiftUI
import SwiftData

struct NoteCardView: View {
    @EnvironmentObject var theme: ThemeManager
    let note: MoodNote
    var isSelected: Bool = false
    var onFollowUp: (() -> Void)? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                // 心情图标
                theme.currentTheme.icon(for: note.moodType)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 32, height: 32)
                    .foregroundColor(theme.currentTheme.accentColor)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(note.content)
                        .font(theme.currentTheme.bodyFont)
                        .foregroundColor(theme.currentTheme.textColor)
                        .lineLimit(isSelected ? nil : 5)
                    
                    if !note.tags.isEmpty {
                        FlowLayout(spacing: 8) {
                            ForEach(note.tags) { tag in
                                Text("#\(tag.name)")
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(theme.currentTheme.accentColor.opacity(0.1))
                                    .foregroundColor(theme.currentTheme.accentColor)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Menu {
                        Button(action: { onFollowUp?() }) {
                            Label("添加后续", systemImage: "arrow.uturn.right")
                        }
                        Button(action: {}) {
                            Label("编辑", systemImage: "pencil")
                        }
                        Button(role: .destructive, action: {}) {
                            Label("删除", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis")
                            .foregroundColor(theme.currentTheme.secondaryTextColor)
                            .padding(8)
                            .contentShape(Rectangle())
                    }
                    
                    Text(note.timestamp, style: .time)
                        .font(theme.currentTheme.dateFont)
                        .foregroundColor(theme.currentTheme.secondaryTextColor)
                }
            }
            
            // 后续展示区域
            if !note.followUps.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Divider()
                        .background(theme.currentTheme.secondaryTextColor.opacity(0.2))
                    
                    HStack {
                        Image(systemName: "chevron.down")
                            .font(.caption2)
                            .foregroundColor(theme.currentTheme.secondaryTextColor)
                        Text("后续")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(theme.currentTheme.secondaryTextColor)
                    }
                    
                    ForEach(note.followUps) { followUp in
                        Text(followUp.content)
                            .font(theme.currentTheme.bodyFont)
                            .size(.small) // 模拟主次区分，可以在主题中定义更多字号
                            .foregroundColor(theme.currentTheme.secondaryTextColor)
                            .padding(.leading, 12)
                    }
                }
                .padding(.top, 4)
            }
        }
        .padding()
        .background(theme.currentTheme.cardBackground)
        .overlay(
            RoundedRectangle(cornerRadius: theme.currentTheme.cardCornerRadius)
                .stroke(isSelected ? theme.currentTheme.accentColor : Color.clear, lineWidth: 2)
        )
        .shadow(
            color: theme.currentTheme.cardShadow.color,
            radius: theme.currentTheme.cardShadow.radius,
            x: theme.currentTheme.cardShadow.x,
            y: theme.currentTheme.cardShadow.y
        )
    }
}

/// 辅助组件：流式布局显示标签
struct FlowLayout: Layout {
    var spacing: CGFloat
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
        var width: CGFloat = 0
        var height: CGFloat = 0
        var currentRowWidth: CGFloat = 0
        var currentRowHeight: CGFloat = 0
        
        for size in sizes {
            if currentRowWidth + size.width + spacing > (proposal.width ?? .infinity) {
                width = max(width, currentRowWidth)
                height += currentRowHeight + spacing
                currentRowWidth = size.width
                currentRowHeight = size.height
            } else {
                currentRowWidth += size.width + spacing
                currentRowHeight = max(currentRowHeight, size.height)
            }
        }
        width = max(width, currentRowWidth)
        height += currentRowHeight
        return CGSize(width: width, height: height)
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
        var x = bounds.minX
        var y = bounds.minY
        var currentRowHeight: CGFloat = 0
        
        for (index, size) in sizes.enumerated() {
            if x + size.width > bounds.maxX {
                x = bounds.minX
                y += currentRowHeight + spacing
                currentRowHeight = size.height
            }
            subviews[index].place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            currentRowHeight = max(currentRowHeight, size.height)
        }
    }
}

/// 辅助扩展：调整字号
extension View {
    func size(_ size: FontSize) -> some View {
        switch size {
        case .small: return self.font(.system(size: 14))
        case .regular: return self.font(.system(size: 16))
        case .large: return self.font(.system(size: 20))
        }
    }
}

enum FontSize {
    case small, regular, large
}
