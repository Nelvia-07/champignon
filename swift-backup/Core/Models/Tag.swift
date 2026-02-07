import Foundation
import SwiftData

@Model
final class Tag {
    @Attribute(.unique) var id: UUID
    var name: String
    var notes: [MoodNote] = []
    
    init(name: String) {
        self.id = UUID()
        self.name = name
    }
}
