# 🚀 心情树洞 - Expo 运行指南 (iOS 真机调试)

由于您在 Windows 上开发且需要向 iPhone 预览，我们将使用 **Expo Go**。

### 1. 准备工作
- **在 iPhone 上安装 Expo Go**: [App Store 下载](https://apps.apple.com/app/expo-go/id982107779)。
- **确保网络连接**: 您的电脑和 iPhone 必须连接到 **同一个 Wi-Fi**。

### 2. 启动项目
在项目目录下打开终端，运行：
```bash
npx expo start
```

### 3. 如何预览
1. 终端运行后，会显示一个巨大的 **二维码**。
2. 打开您的 iPhone 相机（或 Expo Go App），扫描该二维码。
3. App 会开始下载并加载。

### 4. 常见问题
- **无法连接 (Timed out)**:
    - 检查防火墙：确保 Node.js 被允许通过 Windows 防火墙。
    - 尝试模式切换：如果扫码后卡在 0%，在终端按 `s` 切换到 **Tunnel** 模式（可能需要安装 `@expo/ngrok`）。
- **同步延迟**: Expo 支持热更新，您保存代码后，iPhone 会即时刷新。

---
现在，您可以扫码开始体验您的“心情树洞”了！
