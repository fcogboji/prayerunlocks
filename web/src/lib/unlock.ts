import OpenAI from "openai";
import { z } from "zod";

const unlockSchema = z.object({
  encouragement: z.string(),
  verses: z
    .array(
      z.object({
        reference: z.string(),
        text: z.string(),
        why: z.string(),
      }),
    )
    .min(1)
    .max(4),
  prayerType: z.string(),
  prayerTypeExplain: z.string(),
  howToPray: z.array(z.string()).min(2).max(5),
  samplePrayer: z.string(),
  consistencyTip: z.string(),
});

export type PrayerUnlock = z.infer<typeof unlockSchema>;

const SYSTEM_PROMPT = `You are PrayerUnlocks — a warm Christian guide helping people pray their way through real-life situations.

When the user describes a situation, respond ONLY with valid JSON matching this shape:
{
  "encouragement": "one compassionate sentence acknowledging their situation",
  "verses": [
    {
      "reference": "Book chapter:verse",
      "text": "short accurate Scripture text (NIV or ESV style)",
      "why": "1-2 sentences why this verse speaks to their situation"
    }
  ],
  "prayerType": "name of prayer style e.g. Prayer of surrender, Lament, Intercession, Thanksgiving, Warfare prayer",
  "prayerTypeExplain": "why this type of prayer fits their situation",
  "howToPray": ["step 1", "step 2", "step 3"],
  "samplePrayer": "a heartfelt prayer they can pray aloud now (4-8 sentences, first person)",
  "consistencyTip": "one practical line on staying consistent with God through this season"
}

Rules:
- Give 2-3 verses, never generic — tie each to their specific situation
- Stay orthodox Christian; compassionate, never judgmental
- Sample prayer must feel personal to what they shared
- No markdown, no text outside JSON`;

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function unlockPrayerForSituation(
  situation: string,
): Promise<PrayerUnlock> {
  const openai = getOpenAI();
  if (!openai) {
    return getFallbackUnlock(situation);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `My situation: ${situation}`,
        },
      ],
      max_tokens: 900,
      temperature: 0.65,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return getFallbackUnlock(situation);

    const parsed = unlockSchema.parse(JSON.parse(raw));
    return parsed;
  } catch {
    return getFallbackUnlock(situation);
  }
}

function getFallbackUnlock(situation: string): PrayerUnlock {
  const s = situation.toLowerCase();

  if (
    s.includes("anxious") ||
    s.includes("anxiety") ||
    s.includes("worry") ||
    s.includes("stress") ||
    s.includes("afraid") ||
    s.includes("fear")
  ) {
    return {
      encouragement:
        "God sees the weight you're carrying — you don't have to hold it alone.",
      verses: [
        {
          reference: "Philippians 4:6-7",
          text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
          why: "Paul teaches anxiety to be met with honest prayer, not suppressed. Your situation is exactly what this verse was written for.",
        },
        {
          reference: "Isaiah 41:10",
          text: "So do not fear, for I am with you; do not be dismayed, for I am your God.",
          why: "Fear loses power when God's presence is named. This verse anchors you when circumstances feel bigger than you.",
        },
      ],
      prayerType: "Prayer of release and trust",
      prayerTypeExplain:
        "When anxiety grips you, the goal isn't to pretend you're fine — it's to hand each fear to God one by one.",
      howToPray: [
        "Name exactly what you're afraid of — out loud or in writing.",
        "Read Philippians 4:6 slowly, replacing 'anything' with your specific worry.",
        "Pray the sample prayer below, pausing after each sentence.",
        "Sit in silence for 60 seconds — let God have the last word.",
      ],
      samplePrayer: `Father, my mind won't stop racing about ${situation.slice(0, 80)}. I confess I cannot control this. I release it into Your hands right now. Replace my fear with Your peace that passes understanding. Help me take the next faithful step today, not solve everything at once. I trust that You are with me in this. Amen.`,
      consistencyTip:
        "Return to this prayer each morning before the day starts — anxiety loses ground when met early with Scripture.",
    };
  }

  if (
    s.includes("job") ||
    s.includes("money") ||
    s.includes("financ") ||
    s.includes("broke") ||
    s.includes("debt")
  ) {
    return {
      encouragement:
        "Your worth is not your bank balance — God is your provider even in lean seasons.",
      verses: [
        {
          reference: "Matthew 6:31-33",
          text: "So do not worry, saying, 'What shall we eat?' or 'What shall we drink?' Seek first his kingdom and his righteousness, and all these things will be given to you as well.",
          why: "Jesus addresses provision anxiety directly. Seeking God first reframes financial pressure from panic to priority.",
        },
        {
          reference: "Philippians 4:19",
          text: "And my God will meet all your needs according to the riches of his glory in Christ Jesus.",
          why: "Paul wrote this from prison — God's provision is not limited by your circumstances.",
        },
      ],
      prayerType: "Prayer of provision and wisdom",
      prayerTypeExplain:
        "This prayer asks God for both practical wisdom and heart-level trust while you take faithful action.",
      howToPray: [
        "List what you need — practically and honestly.",
        "Ask God for wisdom on one specific next step you can take this week.",
        "Pray for contentment while you work — not passivity, but peace in the process.",
        "Thank God for one thing He has already provided.",
      ],
      samplePrayer: `Lord, I bring my financial situation before You: ${situation.slice(0, 80)}. You know every need I have. Give me wisdom for practical steps, courage to act, and peace while I wait on You. I choose to seek Your kingdom first today. Provide what I need according to Your riches. Amen.`,
      consistencyTip:
        "Pray before you check your accounts — let God's voice speak first each morning.",
    };
  }

  return {
    encouragement:
      "Whatever you're facing, God invites you to bring the full weight of it to Him in prayer.",
    verses: [
      {
        reference: "Jeremiah 29:11",
        text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
        why: "Written to people in exile — God's good plans persist even when life feels off-course.",
      },
      {
        reference: "Psalm 34:17",
        text: "The righteous cry out, and the Lord hears them; he delivers them from all their troubles.",
        why: "Deliverance often comes through prayer before it shows up in circumstances. God hears you now.",
      },
      {
        reference: "James 1:5",
        text: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault.",
        why: "You don't need perfect faith to ask — God gives wisdom generously when you come honestly.",
      },
    ],
    prayerType: "Prayer of honest surrender",
    prayerTypeExplain:
      "When life feels unclear, surrender prayers name the situation truthfully and ask God for wisdom and direction.",
    howToPray: [
      "Tell God exactly what's happening — no religious language required.",
      "Ask: 'What is one faithful step I can take today?'",
      "Read each verse slowly and ask what God might be saying to you.",
      "Pray the sample prayer aloud — your own words matter more than perfect ones.",
    ],
    samplePrayer: `God, I'm facing ${situation.slice(0, 100)}. I don't have this figured out. I need Your wisdom, Your presence, and Your peace. Show me the next step. Help me stay close to You through this — not just when it's resolved, but right now in the middle of it. I trust You are working even when I can't see it. Amen.`,
    consistencyTip:
      "Pray this same prayer daily for 7 days — consistency with God builds faith that outlasts any situation.",
  };
}
