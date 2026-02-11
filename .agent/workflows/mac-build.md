---
description: 如何在 Mac 上构建和运行此 Expo iOS 项目
---

由于本项目包含原生模块 `llama.rn`，你需要在 Mac 上使用 Xcode 进行编译。以下是详细步骤：

### 1. 环境准备 (Mac)

确保你的 Mac 已安装以下工具：
- **Node.js**: 建议使用 v18 或更高版本
- **Xcode**: 从 App Store 下载并安装（需要包含 iOS SDK 和 Simulator）
- **CocoaPods**: 执行 `sudo gem install cocoapods` 或用 brew 安装

### 2. 初始化项目

// turbo
1. 安装项目依赖：
   ```bash
   npm install
   ```

2. 安装 EAS CLI (推荐):
   ```bash
   npm install -g eas-cli
   ```

### 3. 本地构建 (Expo Prebuild)

// turbo
如果要进行本地调试，需要通过 Prebuild 生成 `ios` 目录：
```bash
npx expo prebuild
```

### 4. 安装 iOS 原生依赖

// turbo
进入 ios 目录并安装 pods:
```bash
cd ios && pod install && cd ..
```

### 5. 编译并运行

你可以通过命令行直接启动：
// turbo
```bash
npx expo run:ios
```

**或者**，使用 Xcode 打开：
1. 打开 `ios/Champignon.xcworkspace`。
2. 选择你的真机或模拟器。
3. 点击底部的 **Play** 按钮。

### 6. 特别注意 (llama.rn)

- **Entitlements**: 如果在加载模型时报错 `Failed to load model`，请在 Xcode 的 `Signing & Capabilities` 中检查是否开启了 `Extended Virtual Addressing`。
- **Release 构建**: 如果要打正式包，建议使用 EAS:
  ```bash
  eas build --platform ios
  ```

### 7. 排错
- 如果 `pod install` 报错，尝试：`npx expo install --fix`。
- 确保 `app.json` 中的 `bundleIdentifier` 与你的 Apple 开发者后台一致。
