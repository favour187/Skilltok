/**
 * AI Route — proxies Grok (xAI) API calls for Skill Tests.
 * The XAI_API_KEY lives only on the server; never exposed to the browser.
 */
import { Router, Request, Response } from 'express';

const router = Router();

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-3';

async function callGrok(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

router.post('/skill-test/generate', async (req: Request, res: Response) => {
  try {
    const { skill } = req.body as { skill: string };
    if (!skill || typeof skill !== 'string' || skill.trim().length === 0) {
      return res.status(400).json({ error: 'skill is required' });
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured. Add XAI_API_KEY to backend .env' });
    }

    const text = await callGrok(
      apiKey,
      `You are a strict, senior technical interviewer and certification examiner at SkillTok, a professional freelance platform. Generate rigorous, real-world skill assessments. Never be easy or trivial. Return ONLY valid JSON, no markdown, no extra text.`,
      `Generate a 10-question vigorous skill test for: "${skill.trim()}".

Rules:
- Mix of: 4 multiple-choice (4 options each), 3 short-answer, 3 code/practical questions
- Questions must be non-trivial, real-world, industry-level difficulty
- Code questions should require actual implementation thinking
- Short-answer questions should require specific technical knowledge
- Do NOT include answers or hints

Return exactly this JSON:
{
  "questions": [
    { "number": 1, "text": "...", "type": "multiple_choice", "options": ["A) ...", "B) ...", "C) ...", "D) ..."] },
    { "number": 2, "text": "...", "type": "short_answer" },
    { "number": 3, "text": "...", "type": "code" }
  ]
}`
    );

    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);

  } catch (e: any) {
    console.error('skill-test/generate error:', e);
    return res.status(500).json({ error: 'Failed to generate test.' });
  }
});

router.post('/skill-test/grade', async (req: Request, res: Response) => {
  try {
    const { skill, questions, answers } = req.body as { skill: string; questions: any[]; answers: any[] };
    if (!skill || !questions?.length || !answers?.length) {
      return res.status(400).json({ error: 'skill, questions, and answers are required' });
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured. Add XAI_API_KEY to backend .env' });
    }

    const qaBlock = questions.map((q: any) => {
      const ans = answers.find((a: any) => a.questionNumber === q.number);
      return `Q${q.number} [${q.type}]: ${q.text}\n${q.options ? 'Options: ' + q.options.join(', ') + '\n' : ''}Answer: ${ans?.answer || '(no answer)'}`;
    }).join('\n\n');

    const text = await callGrok(
      apiKey,
      `You are a strict, fair grader for SkillTok's professional skill certification program. Grade honestly — a passing score requires genuine competency. Return ONLY valid JSON, no markdown.`,
      `Grade this skill test for "${skill}". Be strict and realistic.

${qaBlock}

Return exactly this JSON:
{
  "score": <0-100 integer>,
  "totalQuestions": 10,
  "passed": <true if score >= 70>,
  "feedback": "<2-3 sentence overall assessment>",
  "breakdown": [
    { "qNum": 1, "correct": true, "explanation": "Brief reason" },
    { "qNum": 2, "correct": false, "explanation": "What was wrong / correct answer" }
  ]
}`
    );

    const cleaned = text.replace(/```json|```/g, '').trim();
    const grade = JSON.parse(cleaned);
    return res.json(grade);

  } catch (e: any) {
    console.error('skill-test/grade error:', e);
    return res.status(500).json({ error: 'Failed to grade test.' });
  }
});

export default router;
