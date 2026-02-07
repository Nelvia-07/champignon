import { AIProvider, AIAnalysisResult, AIMood } from '../types';

export class LocalSmartProvider implements AIProvider {
    name = 'LocalSmartEnergy';

    async analyze(text: string, presetTags: string[]): Promise<AIAnalysisResult> {
        // Simulate local "processing" time for UX
        await new Promise(resolve => setTimeout(resolve, 600));

        const detectedTags: string[] = [];

        // 1. Tag Matching (Semantic-ish via expanded keywords)
        const tagKeywords: Record<string, string[]> = {
            '理财': ['钱', '工资', '存', '买', '股票', '基金', '余额', '支出', '收入', '理财', '贵'],
            '工作': ['加班', '项目', '同事', '老板', '开会', '汇报', '工作', '入职', '离职'],
            '生活': ['电影', '饭', '步', '猫', '狗', '家', '超市', '零食'],
            '感情': ['她', '他', '男朋友', '女朋友', '爱', '分手', '吵架', '喜欢'],
            '健康': ['病', '药', '医院', '健身', '瘦', '胖', '疼', '难受']
        };

        presetTags.forEach(tag => {
            // Direct match
            if (text.includes(tag)) {
                detectedTags.push(tag);
            } else {
                // Keyword alias match
                const kws = tagKeywords[tag] || [];
                if (kws.some(kw => text.includes(kw))) {
                    detectedTags.push(tag);
                }
            }
        });

        // 2. Sentiment Scoring Engine
        let score = 0;

        const weights = {
            positive: ['开心', '高兴', '棒', '好', '舒服', '给力', '太棒', '快乐', '成功', '奖励', '中奖', '漂亮', '喜欢'],
            negative: ['难过', '伤心', '痛苦', '哎', '糟糕', '难受', '分手', '失败', '哭', '委屈', '寂寞', '绝望'],
            stress: ['累', '疲惫', '困', '加班', '没劲', '郁闷', '烦', '压力', '生气', '焦虑', '火大']
        };

        weights.positive.forEach(w => { if (text.includes(w)) score += 2; });
        weights.negative.forEach(w => { if (text.includes(w)) score -= 2; });
        weights.stress.forEach(w => { if (text.includes(w)) score -= 1; });

        let mood: AIMood = 'neutral';
        if (score >= 2) mood = 'happy';
        else if (score <= -2) mood = 'sad';
        else mood = 'neutral';

        return {
            mood,
            tags: [...new Set(detectedTags)]
        };
    }

    async transcribe(base64Audio: string): Promise<string> {
        // LocalSmartProvider does not support speech recognition, 
        // fallback or error handling should be done at the service/provider level.
        console.warn('LocalSmartProvider does not support STT');
        return '';
    }
}
