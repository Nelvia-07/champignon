# 心情树洞 - 运行与调试指南

## 前置准备
- macOS (建议 Sonoma 或更新版本)
- Xcode 15+ 
- iOS 17+ 模拟器或真机

## 方法 1: 使用 Xcode 运行（推荐）

### 步骤 1: 打开项目
1. 导航到项目文件夹：`c:\Users\yj07\Demo\tree-hole-app`
2. **创建 Xcode 项目文件**（因为当前只有源代码文件）:
   - 打开 Xcode
   - 选择 "Create New Project"
   - 选择 "iOS" → "App"
   - Project Name: `MoodTreeHole`
   - Interface: `SwiftUI`
   - Storage: `SwiftData`
   - 将项目保存到 `c:\Users\yj07\Demo\tree-hole-app`

### 步骤 2: 导入源代码文件
1. 在 Xcode 左侧导航器中，删除默认生成的 `ContentView.swift`
2. 右键项目根目录 → "Add Files to MoodTreeHole"
3. 选中以下文件夹并添加（勾选"Copy items if needed"）：
   - `Core/` 文件夹（包含 Theme, Models, AI）
   - `UI/` 文件夹（包含 Views 和 Components）
   - `MoodTreeHoleApp.swift`

### 步骤 3: 选择运行目标
在 Xcode 顶部工具栏：
- 点击设备选择器（默认显示"Any iOS Device"）
- 选择一个模拟器，例如 "iPhone 15 Pro"

### 步骤 4: 运行项目
- 快捷键：`Cmd + R`
- 或点击顶部工具栏的"播放"按钮（▶️）

Xcode 会自动编译并在模拟器中启动应用。

## 方法 2: 使用 SwiftUI Preview（即时预览）

在任意视图文件（如 `MainContainerView.swift`）中添加预览代码：

```swift
#Preview {
    MainContainerView()
        .environmentObject(ThemeManager())
        .modelContainer(for: [MoodNote.self, Tag.self])
}
```

然后：
1. 打开 Xcode 的 Canvas（快捷键：`Cmd + Option + Enter`）
2. 点击 Canvas 中的"▶️ Resume"按钮
3. 可实时看到 UI 变化

## 方法 3: 真机调试

### 步骤 1: 连接 iPhone
用数据线将 iPhone 连接到 Mac

### 步骤 2: 设置开发者账号
1. Xcode → Settings → Accounts
2. 添加您的 Apple ID（免费账号即可）

### 步骤 3: 配置签名
1. 选中项目 → Targets → MoodTreeHole → Signing & Capabilities
2. Team: 选择您的 Apple ID
3. Bundle Identifier: 修改为唯一 ID（如 `com.yourname.moodtreehole`）

### 步骤 4: 真机运行
- 在设备选择器中选择您的 iPhone
- 点击运行（`Cmd + R`）
- **首次运行**：iPhone 上会提示"不受信任的开发者"
  - 打开 iPhone 设置 → 通用 → VPN与设备管理
  - 信任您的开发者证书

## 常见问题

### 问题 1: 编译错误 - "Cannot find type 'MoodNote'"
**解决方案**: 确保所有文件都已正确添加到 Xcode 项目中。检查左侧导航器中是否缺少文件。

### 问题 2: Preview 无法加载
**解决方案**: 
```swift
// 在 Preview 中手动注入依赖
#Preview {
    let config = ModelConfiguration(isStoredInMemoryOnly: true)
    let container = try! ModelContainer(for: MoodNote.self, Tag.self, configurations: config)
    
    return MainContainerView()
        .environmentObject(ThemeManager())
        .modelContainer(container)
}
```

### 问题 3: AI 分析不工作
这是正常的！当前 AI 使用的是简单的关键词匹配模拟。要启用真实的 Qwen2 模型，请参考 `Docs/QWEN_INTEGRATION_GUIDE.md`。

## 快速验证核心功能

运行后可以测试：
1. ✅ **发布心情**：在底部输入框输入文字（如"今天很开心 #生活"），点击发送
2. ✅ **查看时间线**：观察笔记是否按日期分组显示
3. ✅ **切换主题**：打开左侧抽屉 → 切换"手账风格"开关
4. ✅ **添加后续**：点击笔记右上角的"..."菜单 → 添加后续
5. ✅ **日历视图**：点击顶部的日历图标查看月历
6. ✅ **多选删除**：点击顶部的多选图标，选中笔记后批量删除
