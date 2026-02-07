import SwiftUI
import SwiftData

struct TimelineView: View {
    @EnvironmentObject var theme: ThemeManager
    @Environment(\.modelContext) private var modelContext
    @Binding var isMultiSelectMode: Bool
    @Binding var noteToFollowUp: MoodNote?
    @Binding var selectedNoteIDs: Set<UUID>
    
    @Query(sort: \MoodNote.timestamp, order: .reverse) private var notes: [MoodNote]
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20, pinnedViews: [.sectionHeaders]) {
                let groupedNotes = Dictionary(grouping: notes.filter { !$0.isFollowUp }) { note in
                    Calendar.current.startOfDay(for: note.timestamp)
                }
                let sortedDates = groupedNotes.keys.sorted(by: >)
                
                ForEach(sortedDates, id: \.self) { date in
                    Section(header: TimelineHeader(date: date)) {
                        ForEach(groupedNotes[date] ?? []) { note in
                            NoteCardView(
                                note: note,
                                isSelected: selectedNoteIDs.contains(note.id),
                                onFollowUp: {
                                    noteToFollowUp = note
                                }
                            )
                            .onTapGesture {
                                if isMultiSelectMode {
                                    if selectedNoteIDs.contains(note.id) {
                                        selectedNoteIDs.remove(note.id)
                                    } else {
                                        selectedNoteIDs.insert(note.id)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
            }
            .padding(.top)
        }
    }
}

struct TimelineHeader: View {
    @EnvironmentObject var theme: ThemeManager
    let date: Date
    
    var dateString: String {
        if Calendar.current.isDateInToday(date) { return "今天" }
        if Calendar.current.isDateInYesterday(date) { return "昨天" }
        let formatter = DateFormatter()
        formatter.dateFormat = "M月d日"
        return formatter.string(from: date)
    }
    
    var body: some View {
        HStack {
            Circle()
                .fill(theme.currentTheme.accentColor)
                .frame(width: 8, height: 8)
            
            Text(dateString)
                .font(theme.currentTheme.dateFont)
                .fontWeight(.bold)
                .foregroundColor(theme.currentTheme.secondaryTextColor)
            
            Spacer()
            
            Rectangle()
                .fill(theme.currentTheme.secondaryTextColor.opacity(0.1))
                .frame(height: 1)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(theme.currentTheme.backgroundColor.opacity(0.95))
    }
}
