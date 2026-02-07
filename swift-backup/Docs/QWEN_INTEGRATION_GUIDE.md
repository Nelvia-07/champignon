# Qwen2-0.5B Core ML 集成指南

由于 Qwen2-0.5B 的完整 Core ML 转换需要在 Python 环境中进行，且模型文件较大（约 300-500MB），我这里提供一个分步指南供您参考。

## 步骤 1: 准备 Python 环境（需要在您的本地机器上执行）

```bash
# 创建 Python 虚拟环境
python3 -m venv qwen_coreml_env
source qwen_coreml_env/bin/activate  # Windows: qwen_coreml_env\Scripts\activate

# 安装必要的工具
pip install torch transformers coremltools huggingface_hub
```

## 步骤 2: 下载并转换 Qwen2-0.5B 模型

```python
# convert_qwen_to_coreml.py
import torch
import coremltools as ct
from transformers import AutoTokenizer, AutoModelForCausalLM

# 1. 加载 Qwen2-0.5B 模型
model_id = "Qwen/Qwen2-0.5B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float16,
    device_map="cpu"
)
model.eval()

# 2. 准备示例输入（用于追踪模型结构）
example_text = "分析以下心情："
inputs = tokenizer(example_text, return_tensors="pt")

# 3. 转换为 Core ML（简化版，实际需要更多优化）
traced_model = torch.jit.trace(
    model,
    (inputs['input_ids'], inputs['attention_mask'])
)

# 4. 转为 Core ML 格式
mlmodel = ct.convert(
    traced_model,
    inputs=[
        ct.TensorType(name="input_ids", shape=(1, ct.RangeDim(1, 512))),
        ct.TensorType(name="attention_mask", shape=(1, ct.RangeDim(1, 512)))
    ],
    compute_precision=ct.precision.FLOAT16,
    minimum_deployment_target=ct.target.iOS17
)

# 5. 保存模型
mlmodel.save("Qwen2_0.5B.mlpackage")
print("模型已保存为 Qwen2_0.5B.mlpackage")
```

## 步骤 3: 将模型添加到 Xcode 项目中
1. 将生成的 `Qwen2_0.5B.mlpackage` 文件拖入 Xcode 项目
2. Xcode 会自动生成 Swift 接口

## 注意事项
由于完整的 LLM 模型转换涉及到复杂的 Tokenizer 和生成逻辑，上述脚本仅为概念演示。**实际生产级集成推荐使用以下方案之一**：

### 方案 A: 使用 Hugging Face 已转换的 Core ML 模型（推荐）
检查 Hugging Face Hub 是否有社区已转换的 Qwen2-0.5B Core ML 版本

### 方案 B: 使用 MLX Swift 框架（更简单）
Apple 的 MLX 框架专为 LLM 设计，可直接加载 GGUF 格式的量化模型，无需手动转换。

## 当前实现状态
由于完整的模型集成需要外部资源（Python 环境、大文件下载），我在 `AIService.swift` 中保留了**模拟推理接口**。当您准备好 Core ML 模型文件后，可以直接替换这部分逻辑。
