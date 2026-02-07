# download_qwen.ps1
$url = "https://huggingface.co/seba/qwen-2-coreml-ane/resolve/main/Qwen-2-05B-16Bits-MF.mlpackage.zip"
$output = "Qwen2_05B.mlpackage.zip"

Write-Host "正在下载 Qwen2-0.5B Core ML 模型 (约 450MB)..."
Invoke-WebRequest -Uri $url -OutFile $output

Write-Host "下载完成！请手动解压并将 Qwen2_05B.mlpackage 拖入 Xcode 项目中。"
