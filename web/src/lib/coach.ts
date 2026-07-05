import OpenAI from "openai";
import { prisma } from "./prisma";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `You are PrayerUnlocks, a warm Christian Bible coach helping people pray through real-life situations.

Your role:
- Explain Scripture clearly and accurately
- Apply biblical wisdom to real-life situations
- Offer gentle encouragement without being preachy
- End responses with a short, heartfelt prayer when appropriate

Guidelines:
- Stay rooted in orthodox Christian theology
- Use accessible language (avoid heavy jargon)
- Be compassionate, never judgmental
- Keep responses concise (2-4 paragraphs max)
- Structure longer answers with: Explanation → Biblical insight → Real-life application → Prayer

If asked about topics outside faith/spirituality, gently redirect to how faith might inform their situation.`;

export async function askCoach(userId: string, question: string) {
  await prisma.chatMessage.create({
    data: { userId, role: "user", content: question },
  });

  const history = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  if (!process.env.OPENAI_API_KEY) {
    const fallback = getFallbackReply(question);
    await prisma.chatMessage.create({
      data: { userId, role: "assistant", content: fallback },
    });
    return fallback;
  }

  const openai = getOpenAI();
  if (!openai) {
    const fallback = getFallbackReply(question);
    await prisma.chatMessage.create({
      data: { userId, role: "assistant", content: fallback },
    });
    return fallback;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 600,
    temperature: 0.7,
  });

  const reply =
    response.choices[0]?.message?.content ??
    "I'm here to walk with you. Could you share a bit more about what's on your heart?";

  await prisma.chatMessage.create({
    data: { userId, role: "assistant", content: reply },
  });

  return reply;
}

function getFallbackReply(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("john 3:16") || q.includes("john")) {
    return `John 3:16 reveals God's initiating love — salvation comes through trusting Christ, not earning His favour.

**Biblical insight:** This verse sits in a conversation about new birth. Eternal life begins now, not just after death.

**Application:** Where are you trying to prove yourself instead of receiving God's love? Start there today.

**Prayer:** Lord, help me receive Your love before I try to perform for it. Amen.`;
  }

  if (q.includes("anxiety") || q.includes("worry") || q.includes("stress")) {
    return `Scripture doesn't dismiss anxiety — it invites honest surrender. Philippians 4:6-7 and Matthew 6 both teach us to bring our concerns to God rather than carrying them alone.

**Application:** Name one specific worry. Write it down. Pray over it for 2 minutes. Then take one small faithful step.

**Prayer:** Father, I give You what I cannot control. Guard my heart with Your peace. Amen.`;
  }

  if (q.includes("discipline") || q.includes("consistent") || q.includes("habit")) {
    return `Spiritual discipline grows through small, repeated acts of love — not guilt-driven performance.

**Biblical insight:** Galatians 5 speaks of fruit that grows over time, not overnight transformation.

**Application:** Choose one tiny daily rhythm you can keep for 7 days. Consistency beats intensity.

**Prayer:** Spirit, grow in me the fruit of faithfulness. Help me return to You daily. Amen.`;
  }

  return `That's worth bringing to God slowly. Start by naming what is true, asking what love requires next, and choosing one faithful action you can take today.

**Prayer:** Lord, meet me in this moment. Give me wisdom and courage for the next step. Amen.`;
}

export async function getChatHistory(userId: string) {
  return prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
}
