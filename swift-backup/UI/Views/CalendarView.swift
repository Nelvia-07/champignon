import SwiftUI
import SwiftData

struct CalendarView: View {
    @EnvironmentObject var theme: ThemeManager
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \MoodNote.timestamp, order: .reverse) private var allNotes: [MoodNote]
    
    @State private var selectedDate: Date? = nil
    @State private var currentMonth: Date = Date()
    
    private let calendar = Calendar.current
    private let daysOfWeek = ["日", "一", "二", "三", "四", "五", "六"]
    
    var body: some View {
        VStack(spacing: 0) {
            // 月份选择器
            HStack {
                Button(action: previousMonth) {
                    Image(systemName: "chevron.left")
                        .foregroundColor(theme.currentTheme.accentColor)
                }
                
                Spacer()
                
                Text(monthYearString)
                    .font(theme.currentTheme.titleFont)
                    .foregroundColor(theme.currentTheme.textColor)
                
                Spacer()
                
                Button(action: nextMonth) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(theme.currentTheme.accentColor)
                }
            }
            .padding()
            
            // 星期标题
            HStack(spacing: 0) {
                ForEach(daysOfWeek, id: \.self) { day in
                    Text(day)
                        .font(.caption)
                        .foregroundColor(theme.currentTheme.secondaryTextColor)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal)
            
            // 日历网格
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 12) {
                ForEach(daysInMonth, id: \.self) { date in
                    if let date = date {
                        DayCell(
                            date: date,
                            mood: dominantMood(for: date),
                            isSelected: calendar.isDate(date, inSameDayAs: selectedDate ?? Date.distantPast),
                            isToday: calendar.isDateInToday(date)
                        )
                        .onTapGesture {
                            selectedDate = date
                        }
                    } else {
                        Color.clear
                            .frame(height: 50)
                    }
                }
            }
            .padding()
            
            // 选中日期的笔记列表
            if let selected = selectedDate {
                Divider()
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("笔记 - \(dateString(selected))")
                            .font(theme.currentTheme.titleFont)
                            .padding(.horizontal)
                            .padding(.top, 8)
                        
                        ForEach(notesFor(date: selected)) { note in
                            NoteCardView(note: note, isSelected: false)
                                .padding(.horizontal)
                        }
                    }
                }
            } else {
                Spacer()
                VStack {
                    Image(systemName: "calendar")
                        .font(.system(size: 60))
                        .foregroundColor(theme.currentTheme.secondaryTextColor.opacity(0.3))
                    Text("点击日期查看笔记")
                        .font(theme.currentTheme.bodyFont)
                        .foregroundColor(theme.currentTheme.secondaryTextColor)
                }
                Spacer()
            }
        }
        .background(theme.currentTheme.backgroundColor)
    }
    
    // MARK: - Helper Methods
    
    private var monthYearString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy年 M月"
        return formatter.string(from: currentMonth)
    }
    
    private var daysInMonth: [Date?] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: currentMonth),
              let monthFirstWeek = calendar.dateInterval(of: .weekOfMonth, for: monthInterval.start) else {
            return []
        }
        
        var days: [Date?] = []
        var currentDate = monthFirstWeek.start
        
        while currentDate < monthInterval.end {
            if calendar.isDate(currentDate, equalTo: currentMonth, toGranularity: .month) {
                days.append(currentDate)
            } else {
                days.append(nil)
            }
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
        
        return days
    }
    
    private func dominantMood(for date: Date) -> MoodType? {
        let notes = notesFor(date: date)
        guard !notes.isEmpty else { return nil }
        
        let moodCounts = Dictionary(grouping: notes, by: { $0.moodType })
            .mapValues { $0.count }
        return moodCounts.max(by: { $0.value < $1.value })?.key
    }
    
    private func notesFor(date: Date) -> [MoodNote] {
        allNotes.filter { note in
            calendar.isDate(note.timestamp, inSameDayAs: date) && !note.isFollowUp
        }
    }
    
    private func dateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "M月d日"
        return formatter.string(from: date)
    }
    
    private func previousMonth() {
        currentMonth = calendar.date(byAdding: .month, value: -1, to: currentMonth) ?? currentMonth
    }
    
    private func nextMonth() {
        currentMonth = calendar.date(byAdding: .month, value: 1, to: currentMonth) ?? currentMonth
    }
}

struct DayCell: View {
    @EnvironmentObject var theme: ThemeManager
    let date: Date
    let mood: MoodType?
    let isSelected: Bool
    let isToday: Bool
    
    private var dayNumber: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter.string(from: date)
    }
    
    var body: some View {
        VStack(spacing: 4) {
            if let mood = mood {
                theme.currentTheme.icon(for: mood)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 20, height: 20)
                    .foregroundColor(theme.currentTheme.accentColor)
            }
            
            Text(dayNumber)
                .font(.system(size: 14, weight: isToday ? .bold : .regular))
                .foregroundColor(isToday ? theme.currentTheme.accentColor : theme.currentTheme.textColor)
        }
        .frame(height: 50)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(isSelected ? theme.currentTheme.accentColor.opacity(0.2) : Color.clear)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(isToday ? theme.currentTheme.accentColor : Color.clear, lineWidth: 2)
        )
    }
}
