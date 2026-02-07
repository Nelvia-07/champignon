import SwiftUI

struct MainContainerView: View {
    @EnvironmentObject var theme: ThemeManager
    @State private var isDrawerOpen: Bool = false
    @State private var selectedViewMode: ViewMode = .timeline
    @State private var isMultiSelectMode: Bool = false
    @State private var noteToFollowUp: MoodNote? = nil
    @State private var selectedNoteIDs = Set<UUID>()
    @State private var showTagSheet: Bool = false
    @State private var showAISettings: Bool = false
    
    @Environment(\.modelContext) private var modelContext
    @Query private var allTags: [Tag]
    @Query private var notes: [MoodNote]
    
    enum ViewMode {
        case timeline, calendar
    }
    
    var body: some View {
        ZStack {
            theme.currentTheme.backgroundColor
                .ignoresSafeArea()
            
            // 主内容区域
            VStack(spacing: 0) {
                // 顶部导航栏
                HStack {
                    Button(action: {
                        withAnimation(.spring()) {
                            isDrawerOpen.toggle()
                        }
                    }) {
                        Image(systemName: "line.3.horizontal")
                            .font(.title2)
                            .foregroundColor(theme.currentTheme.textColor)
                    }
                    
                    Spacer()
                    
                    // 视图切换按钮
                    Picker("View Mode", selection: $selectedViewMode) {
                        Image(systemName: "list.bullet").tag(ViewMode.timeline)
                        Image(systemName: "calendar").tag(ViewMode.calendar)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .frame(width: 100)
                    
                    Spacer()
                    
                    Button(action: {
                        isMultiSelectMode.toggle()
                    }) {
                        Image(systemName: isMultiSelectMode ? "checkmark.circle.fill" : "checkmark.circle")
                            .font(.title2)
                            .foregroundColor(isMultiSelectMode ? theme.currentTheme.accentColor : theme.currentTheme.textColor)
                    }
                }
                .padding()
                
                // 内容流
                ZStack {
                    if selectedViewMode == .timeline {
                        TimelineView(
                            isMultiSelectMode: $isMultiSelectMode,
                            noteToFollowUp: $noteToFollowUp,
                            selectedNoteIDs: $selectedNoteIDs
                        )
                    } else {
                        CalendarView()
                    }
                }
                
                // 固定底部输入框
                if !isMultiSelectMode {
                    InputAreaView(parentNote: $noteToFollowUp)
                        .padding(.horizontal)
                        .padding(.bottom, 8)
                }
            }
            
            // 多选操作浮窗
            if isMultiSelectMode && !selectedNoteIDs.isEmpty {
                VStack {
                    Spacer()
                    HStack(spacing: 40) {
                        Button(action: batchDelete) {
                            VStack {
                                Image(systemName: "trash")
                                Text("删除")
                                    .font(.caption)
                            }
                            .foregroundColor(.red)
                        }
                        
                        Button(action: { showTagSheet = true }) {
                            VStack {
                                Image(systemName: "tag")
                                Text("打标签")
                                    .font(.caption)
                            }
                            .foregroundColor(theme.currentTheme.accentColor)
                        }
                    }
                    .padding(.horizontal, 40)
                    .padding(.vertical, 12)
                    .background(theme.currentTheme.backgroundColor)
                    .clipShape(Capsule())
                    .shadow(radius: 10)
                    .padding(.bottom, 30)
                }
                .transition(.move(edge: .bottom))
            }
            
            // 侧滑抽屉覆盖层
            if isDrawerOpen {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                    .onTapGesture {
                        withAnimation { isDrawerOpen = false }
                    }
                
                DrawerView(
                    onTagManagement: {
                        // 暂未实现标签列表页
                        isDrawerOpen = false
                    },
                    onAISettings: {
                        showAISettings = true
                        isDrawerOpen = false
                    }
                )
                .transition(.move(edge: .leading))
                    .frame(width: 280)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .sheet(isPresented: $showTagSheet) {
            TagSelectionSheet { tagIDs in
                batchTag(with: tagIDs)
            }
        }
        .sheet(isPresented: $showAISettings) {
            AISettingsView()
        }
    }
    
    private func batchDelete() {
        withAnimation {
            for id in selectedNoteIDs {
                if let noteToDelete = notes.first(where: { $0.id == id }) {
                    modelContext.delete(noteToDelete)
                }
            }
            selectedNoteIDs.removeAll()
            isMultiSelectMode = false
        }
    }
    
    private func batchTag(with tagIDs: Set<UUID>) {
        let selectedTags = allTags.filter { tagIDs.contains($0.id) }
        for id in selectedNoteIDs {
            if let note = notes.first(where: { $0.id == id }) {
                for tag in selectedTags {
                    if !note.tags.contains(where: { $0.id == tag.id }) {
                        note.tags.append(tag)
                    }
                }
            }
        }
        selectedNoteIDs.removeAll()
        isMultiSelectMode = false
    }
}
