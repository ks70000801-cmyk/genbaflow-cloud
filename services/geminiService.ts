
import { GoogleGenAI } from "@google/genai";
import { DailyReportData } from "../types";

export const generateProfessionalReport = async (data: DailyReportData): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("APIキーが設定されていません。Netlifyの設定を確認してください。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const workerInfo = data.workers.map(w => 
    `・${w.name}: ${w.startTime}〜${w.endTime} (休憩${w.breakMinutes}分)`
  ).join('\n');

  const prompt = `
あなたは民間工事のベテラン現場責任者です。
以下の情報を整理し、社長や経理担当者が一目で状況を把握できる「プロの作業日報」を作成してください。

【現場情報】
・現場名：${data.projectName}
・作業日：${data.date}

【稼働状況】
${workerInfo}

【作業内容詳細】
${data.workContent}

【使用機械・資材】
・使用機械：${data.machinesUsed || '特になし'}
・搬入資材：${data.materialsProcurement || '特になし'}

【安全管理・その他】
・安全注意事項：${data.safetyNotes}
・明日の予定：${data.tomorrowPlan || '未定'}
・備考：${data.memo || '特になし'}

---
作成ルール：
1. 冒頭に「お疲れ様です。本日の作業報告をいたします。」と添える。
2. 箇条書きを多用し、視認性を高める。
3. 専門用語は使いつつも、経理が工数や資材の動きを理解しやすい表現にする。
4. 安全管理が適切に行われていることを強調する。
5. 最後に「以上、よろしくお願いいたします。」で締める。
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "レポート生成に失敗しました。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
