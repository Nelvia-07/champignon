import SwiftUI
import SwiftData

@main
struct MoodTreeHoleApp: App {
    @StateObject private var themeManager = ThemeManager()
    
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            MoodNote.self,
            Tag.self,
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)

        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            MainContainerView()
                .environmentObject(themeManager)
                .preferredColorScheme(themeManager.isHandDrawnStyle ? .light : nil)
        }
        .modelContainer(sharedModelContainer)
    }
}
