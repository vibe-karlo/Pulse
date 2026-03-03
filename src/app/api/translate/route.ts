import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { translateText, translateUILabels } from "@/lib/ai";
import { apiErrorResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { text, texts, labels, targetLanguage } = body;

    const lang = targetLanguage || session.language || "en";

    if (labels) {
      // Translate UI labels (batch)
      const translated = await translateUILabels(labels, lang);
      return NextResponse.json({ translated });
    }

    if (texts && Array.isArray(texts)) {
      // Translate multiple texts
      const translated = await Promise.all(
        texts.map((t: string) => translateText(t, lang))
      );
      return NextResponse.json({ translated });
    }

    if (text) {
      // Translate single text
      const translated = await translateText(text, lang);
      return NextResponse.json({ translated });
    }

    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  } catch (error) {
    const err = apiErrorResponse(error);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
