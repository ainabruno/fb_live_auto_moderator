import { invokeLLM } from "./_core/llm";

export type Classification = "question" | "gratitude" | "spam" | "off_topic";
export type Language = "mg" | "fr" | "en";

export interface ClassificationResult {
  classification: Classification;
  confidence: number;
  priority: number;
}

export interface LanguageDetectionResult {
  language: Language;
  confidence: number;
}

export interface ResponseGenerationResult {
  response: string;
  isGroundedInContext: boolean;
  language: Language;
  confidence: number;
}

/**
 * Detect the language of a comment (Malagasy, French, or English)
 */
export async function detectLanguage(
  text: string
): Promise<LanguageDetectionResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a language detection expert. Analyze the given text and determine if it is in Malagasy (mg), French (fr), or English (en). 
          
Respond ONLY with a JSON object in this exact format:
{"language": "mg" | "fr" | "en", "confidence": 0.0-1.0}

Do not include any other text or explanation.`,
        },
        {
          role: "user",
          content: `Detect the language of this text: "${text}"`,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (typeof content !== 'string') {
      return { language: 'en', confidence: 0.3 };
    }
    const parsed = JSON.parse(content);

    return {
      language: parsed.language || "en",
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error("[Language Detection] Error:", error);
    return { language: "en", confidence: 0.3 };
  }
}

/**
 * Classify a comment as question, gratitude, spam, or off-topic
 */
export async function classifyComment(
  text: string,
  liveContext: string
): Promise<ClassificationResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a social media comment classifier. Analyze comments in the context of a live stream.

Classification categories:
- "question": Direct questions about the live topic or content
- "gratitude": Thanks, compliments, or positive feedback
- "spam": Promotional content, irrelevant links, or spam
- "off_topic": Comments not related to the live topic

Respond ONLY with a JSON object in this exact format:
{"classification": "question" | "gratitude" | "spam" | "off_topic", "confidence": 0.0-1.0, "priority": 0-100}

Priority: 0-100 where 100 is highest priority. Questions related to the topic get highest priority.
Do not include any other text or explanation.`,
        },
        {
          role: "user",
          content: `Live stream context: "${liveContext}"

Comment to classify: "${text}"`,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (typeof content !== 'string') {
      return {
        classification: 'off_topic',
        confidence: 0.3,
        priority: 0,
      };
    }
    const parsed = JSON.parse(content);

    return {
      classification: parsed.classification || "off_topic",
      confidence: parsed.confidence || 0.5,
      priority: parsed.priority || 0,
    };
  } catch (error) {
    console.error("[Comment Classification] Error:", error);
    return {
      classification: "off_topic",
      confidence: 0.3,
      priority: 0,
    };
  }
}

/**
 * Generate an AI response to a comment based on live context
 * Ensures response is grounded in the provided context
 */
export async function generateResponse(
  comment: string,
  liveContext: string,
  commentLanguage: Language
): Promise<ResponseGenerationResult> {
  try {
    // Map language codes to full names for the prompt
    const languageMap: Record<Language, string> = {
      mg: "Malagasy",
      fr: "French",
      en: "English",
    };

    const targetLanguage = languageMap[commentLanguage] || "English";

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a helpful live stream moderator assistant. Your job is to generate brief, friendly responses to viewer comments.

CRITICAL RULES:
1. ONLY respond if the answer exists in the provided live context
2. If the question cannot be answered from the context, respond with: "I don't have that information yet, but thanks for asking!"
3. Keep responses SHORT (1-3 sentences max)
4. Be friendly and conversational
5. Respond in ${targetLanguage}
6. Never fabricate or guess information outside the context

Respond with a JSON object in this exact format:
{"response": "your response text", "isGroundedInContext": true | false, "confidence": 0.0-1.0}

Do not include any other text or explanation.`,
        },
        {
          role: "user",
          content: `Live stream context/transcript:
"${liveContext}"

Viewer comment:
"${comment}"

Generate a helpful response based ONLY on the context above.`,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (typeof content !== 'string') {
      return {
        response: 'Thanks for your comment!',
        isGroundedInContext: false,
        language: commentLanguage,
        confidence: 0.2,
      };
    }
    const parsed = JSON.parse(content);

    return {
      response: parsed.response || 'Thanks for your comment!',
      isGroundedInContext: parsed.isGroundedInContext === true,
      language: commentLanguage,
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error("[Response Generation] Error:", error);
    return {
      response: "Thanks for your comment!",
      isGroundedInContext: false,
      language: commentLanguage,
      confidence: 0.2,
    };
  }
}

/**
 * Check if a comment contains spam keywords
 */
export function checkSpamKeywords(
  text: string,
  blockedKeywords: string[]
): boolean {
  if (!blockedKeywords || blockedKeywords.length === 0) {
    return false;
  }

  const lowerText = text.toLowerCase();
  return blockedKeywords.some((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * Calculate priority score for a comment
 */
export function calculatePriority(
  classification: Classification,
  classificationConfidence: number,
  isSpam: boolean
): number {
  if (isSpam) return -100; // Lowest priority

  const baseScores: Record<Classification, number> = {
    question: 100,
    gratitude: 50,
    off_topic: 25,
    spam: -100,
  };

  const baseScore = baseScores[classification] || 0;
  const confidenceBoost = classificationConfidence * 20;

  return Math.round(baseScore + confidenceBoost);
}

/**
 * Determine if a response should be auto-approved based on settings
 */
export function shouldAutoApprove(
  autoApproveResponses: boolean,
  isGroundedInContext: boolean,
  responseConfidence: number
): boolean {
  if (!autoApproveResponses) return false;
  if (!isGroundedInContext) return false;
  if (responseConfidence < 0.7) return false;

  return true;
}
