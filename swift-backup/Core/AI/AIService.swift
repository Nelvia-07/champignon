import Foundation
import Combine
import CoreML
import NaturalLanguage

/// AI 服务层：负责本地模型的调度与结果处理
class AIService: ObservableObject {
    static let shared = AIService()
    
    @Published var isProcessing: Bool = false
    
    /// 分析文本并返回建议的心情和标签
    func analyze(text: String, customPrompt: String? = nil) async -> (mood: MoodType, tags: [String]) {
        await MainActor.run { isProcessing = true }
        
        let prompt = customPrompt ?? UserDefaults.standard.string(forKey: "custom_ai_prompt") ?? "分析心情和标签"
        let fullInput = "\(prompt)\n用户输入：\(text)"
        
        var result: (mood: MoodType, tags: [String]) = (.neutral, [])
        
        do {
            // 尝试加载 Core ML 模型
            // 注意：Qwen2_05B 类由 Xcode 编译 .mlpackage 后自动生成
            // 如果模型尚未导入，这里会报错，所以我们使用保护性逻辑
            if let modelURL = Bundle.main.url(forResource: "Qwen2_05B", withExtension: "mlmodelc") {
                let config = MLModelConfiguration()
                config.computeUnits = .all // 优先使用 Neural Engine / GPU
                
                // 这里使用动态加载方式，避免编译时强依赖
                let model = try MLModel(contentsOf: modelURL, configuration: config)
                
                // 执行推理 (简化演示)
                // 真实 LLM 推理需要 Tokenizer 和循环生成，这里展示调用逻辑
                let output = try await performRealInference(model: model, input: fullInput)
                result = parseAIOutput(output)
            } else {
                // 回退到启发式分析（当模型未就绪时）
                print("Core ML 模型未找到，使用启发式分析回退")
                try? await Task.sleep(nanoseconds: 1 * 1_000_000_000)
                result = performHeuristicAnalysis(text: text)
            }
        } catch {
            print("AI 分析失败: \(error)")
            result = performHeuristicAnalysis(text: text)
        }
        
        await MainActor.run { isProcessing = false }
        return result
    }
    
    /// 模拟真实模型推理过程
    private func performRealInference(model: MLModel, input: String) async throws -> String {
        // TODO: 这里需要集成 Tokenizer (如 Tiktoken 或 Swift Transformers)
        // 1. 将文本转为 Tokens
        // 2. 构造 MLFeatureProvider
        // 3. 调用 model.prediction(from:)
        // 4. 将输出 Tokens 转回文本
        return "😊;心情很好;生活" // 模拟输出
    }
    
    /// 解析 AI 生成的内容，提取心情和标签
    private func parseAIOutput(_ output: String) -> (mood: MoodType, tags: [String]) {
        let parts = output.components(separatedBy: ";")
        let moodPart = parts.first ?? ""
        var tags: [String] = []
        
        if parts.count > 1 {
            tags = parts.dropFirst().map { $0.trimmingCharacters(in: .whitespaces) }
        }
        
        // 映射表情到 MoodType
        let mood: MoodType
        if moodPart.contains("😊") || moodPart.contains("喜") {
            mood = .happy
        } else if moodPart.contains("😢") || moodPart.contains("哀") {
            mood = .sad
        } else if moodPart.contains("😫") || moodPart.contains("累") {
            mood = .tired
        } else {
            mood = .neutral
        }
        
        return (mood, tags)
    }
    
    private func performHeuristicAnalysis(text: String) -> (mood: MoodType, tags: [String]) {
        var tags: [String] = []
        var mood: MoodType = .neutral
        
        // 简单的关键词匹配示例
        if text.contains("开心") || text.contains("好棒") {
            mood = .happy
            tags.append("好心情")
        } else if text.contains("累") || text.contains("睡觉") {
            mood = .tired
            tags.append("日常")
        }
        
        // 自动提取井号标签
        let regex = try? NSRegularExpression(pattern: "#(\\w+)", options: [])
        let matches = regex?.matches(in: text, options: [], range: NSRange(text.startIndex..., in: text))
        matches?.forEach { match in
            if let range = Range(match.range(at: 1), in: text) {
                tags.append(String(text[range]))
            }
        }
        
        return (mood, tags)
    }
}
