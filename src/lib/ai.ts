import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = "en"
): Promise<string> {
  if (targetLanguage === sourceLanguage || targetLanguage === "en") {
    return text;
  }

  const languageNames: Record<string, string> = {
    de: "German",
    fr: "French",
    es: "Spanish",
    hr: "Croatian",
    nl: "Dutch",
    pt: "Portuguese",
    ja: "Japanese",
    zh: "Simplified Chinese",
    it: "Italian",
    en: "English",
  };

  const targetName = languageNames[targetLanguage] || targetLanguage;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Translate the following text to ${targetName}. Return ONLY the translated text, nothing else. Preserve any markdown formatting (bold, italic, lists, etc.):\n\n${text}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      return content.text;
    }
    return text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original on error
  }
}

export async function translateUILabels(
  labels: Record<string, string>,
  targetLanguage: string
): Promise<Record<string, string>> {
  if (targetLanguage === "en") {
    return labels;
  }

  const languageNames: Record<string, string> = {
    de: "German",
    fr: "French",
    es: "Spanish",
    hr: "Croatian",
    nl: "Dutch",
    pt: "Portuguese",
    ja: "Japanese",
    zh: "Simplified Chinese",
    it: "Italian",
  };

  const targetName = languageNames[targetLanguage] || targetLanguage;
  const jsonInput = JSON.stringify(labels);

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `Translate the following JSON object values to ${targetName}. Return ONLY valid JSON with the same keys but translated values. Keep the same structure:\n\n${jsonInput}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return labels;
  } catch (error) {
    console.error("UI translation error:", error);
    return labels;
  }
}
