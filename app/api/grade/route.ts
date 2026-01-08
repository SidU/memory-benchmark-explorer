import { NextResponse } from 'next/server';

type GradeRequest = {
  question: string;
  answer: string;
  response: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as GradeRequest;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  if (!body?.question || !body?.answer) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are grading a human answer against a ground-truth answer. ' +
          'Return JSON only: {"correct": true|false}. ' +
          'Mark correct when the meaning matches, even if phrased differently. ' +
          'Mark incorrect when the meaning differs or is missing key facts.'
      },
      {
        role: 'user',
        content: [
          `Question: ${body.question}`,
          `Ground truth answer: ${body.answer}`,
          `User answer: ${body.response}`
        ].join('\n')
      }
    ],
    temperature: 0,
    response_format: { type: 'json_object' }
  };

  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return NextResponse.json({ error: 'OpenAI request failed' }, { status: 500 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: 'OpenAI request failed' }, { status: 500 });
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message?.content ?? '{}';

  let parsed = { correct: false };
  try {
    parsed = JSON.parse(message);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid grader response' }, { status: 500 });
  }

  return NextResponse.json({ correct: Boolean(parsed.correct) });
}
