import SwiftUI
import SwiftData

struct TagSelectionSheet: View {
    @EnvironmentObject var theme: ThemeManager
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @Query(sort: \Tag.name) private var allTags: [Tag]
    @State private var selectedTags = Set<UUID>()
    @State private var newTagName: String = ""
    
    var onConfirm: (Set<UUID>) -> Void
    
    var body: some View {
        NavigationStack {
            VStack {
                // 新增标签输入
                HStack {
                    TextField("新增标签...", text: $newTagName)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: addNewTag) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(theme.currentTheme.accentColor)
                    }
                    .disabled(newTagName.isEmpty)
                }
                .padding()
                
                // 标签列表
                List(allTags) { tag in
                    HStack {
                        Text(tag.name)
                        Spacer()
                        if selectedTags.contains(tag.id) {
                            Image(systemName: "checkmark")
                                .foregroundColor(theme.currentTheme.accentColor)
                        }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        if selectedTags.contains(tag.id) {
                            selectedTags.remove(tag.id)
                        } else {
                            selectedTags.insert(tag.id)
                        }
                    }
                }
            }
            .navigationTitle("选择标签")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("确认") {
                        onConfirm(selectedTags)
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func addNewTag() {
        let tag = Tag(name: newTagName)
        modelContext.insert(tag)
        newTagName = ""
    }
}
