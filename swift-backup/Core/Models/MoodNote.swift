import Foundation
import SwiftData

@Model
final class MoodNote {
    @Attribute(.unique) var id: UUID
    var content: String
    var imagePath: String?
    var audioPath: String?
    var timestamp: Date
    var moodTypeRaw: String
    var isFollowUp: Bool
    
    @Relationship(deleteRule: .cascade, inverse: \Tag.notes)
    var tags: [Tag] = []
    
    // 建立追记（后续）的一对一或一对多关联
    // 这里采用父子关系建模
    @Relationship(deleteRule: .nullify)
    var parentNote: MoodNote?
    
    @Relationship(deleteRule: .cascade)
    var followUps: [MoodNote] = []
    
    var moodType: MoodType {
        get { MoodType(rawValue: moodTypeRaw) ?? .neutral }
        set { moodTypeRaw = newValue.rawValue }
    }
    
    init(content: String, moodType: MoodType = .neutral, isFollowUp: Bool = false) {
        self.id = UUID()
        self.content = content
        self.timestamp = Date()
        self.moodTypeRaw = moodType.rawValue
        self.isFollowUp = isFollowUp
    }
}
