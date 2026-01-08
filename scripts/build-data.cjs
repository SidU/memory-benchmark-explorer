const fs = require('fs');
const path = require('path');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');

const rawDir = path.join(process.cwd(), 'data', 'raw');
const publicDir = path.join(process.cwd(), 'public', 'data');
fs.mkdirSync(publicDir, { recursive: true });

const inputFiles = [
  {
    input: path.join(rawDir, 'longmemeval_s_cleaned.json'),
    output: path.join(publicDir, 'longmemeval_s.compact.json')
  },
  {
    input: path.join(rawDir, 'longmemeval_m_cleaned.json'),
    output: path.join(publicDir, 'longmemeval_m.compact.json')
  }
];

const normalizeTurn = (turn) => {
  const role =
    turn.role ||
    turn.speaker ||
    turn.from ||
    (turn.is_assistant ? 'assistant' : 'user') ||
    'user';
  const content =
    turn.content ||
    turn.text ||
    turn.message ||
    (typeof turn === 'string' ? turn : '') ||
    '';
  return {
    role: role === 'assistant' || role === 'system' ? role : 'user',
    content: String(content)
  };
};

const normalizeSessions = (item, index) => {
  if (Array.isArray(item.sessions)) {
    return item.sessions.map((session, sessionIndex) => ({
      id: session.id || `${index}-session-${sessionIndex}`,
      title: session.title || session.topic,
      date: session.date || session.timestamp || session.time,
      turns: Array.isArray(session.turns)
        ? session.turns.map(normalizeTurn)
        : Array.isArray(session.messages)
        ? session.messages.map(normalizeTurn)
        : []
    }));
  }
  if (Array.isArray(item.haystack_sessions)) {
    return item.haystack_sessions.map((session, sessionIndex) => {
      const turns = Array.isArray(session)
        ? session.map(normalizeTurn)
        : Array.isArray(session.turns)
        ? session.turns.map(normalizeTurn)
        : Array.isArray(session.messages)
        ? session.messages.map(normalizeTurn)
        : [];
      const fallbackId = `${index}-session-${sessionIndex}`;
      const haystackId = Array.isArray(item.haystack_session_ids)
        ? item.haystack_session_ids[sessionIndex]
        : null;
      const haystackDate = Array.isArray(item.haystack_dates)
        ? item.haystack_dates[sessionIndex]
        : null;
      return {
        id: haystackId || session.id || fallbackId,
        title: session.title || session.topic,
        date: session.date || session.timestamp || session.time || haystackDate,
        turns
      };
    });
  }
  if (Array.isArray(item.history)) {
    const turns = item.history.map(normalizeTurn);
    return [{ id: `${index}-session-0`, turns }];
  }
  if (Array.isArray(item.dialogue)) {
    const turns = item.dialogue.map(normalizeTurn);
    return [{ id: `${index}-session-0`, turns }];
  }
  return [{ id: `${index}-session-0`, turns: [] }];
};

const normalizeQuestion = (question, index, questionIndex) => {
  const prompt = question.prompt || question.question || question.q || '';
  const options = question.options || question.choices || question.candidates;
  const aliases = question.aliases || question.acceptable_answers || question.alt_answers;
  const rawAnswer =
    question.answer || question.gold || question.label || question.target || question.a;
  const answer =
    typeof rawAnswer === 'boolean'
      ? rawAnswer
        ? 'True'
        : 'False'
      : String(rawAnswer ?? '');

  let type = 'short_text';
  if (Array.isArray(options) && options.length > 0) {
    type = 'multiple_choice';
  } else if (answer.toLowerCase() === 'true' || answer.toLowerCase() === 'false') {
    type = 'boolean';
  }

  return {
    id: question.id || question.question_id || `${index}-q-${questionIndex}`,
    type,
    prompt: String(prompt),
    date: question.question_date || question.date || question.timestamp,
    options: Array.isArray(options) ? options.map(String) : undefined,
    answer,
    aliases: Array.isArray(aliases) ? aliases.map(String) : undefined
  };
};

const normalizeQuestions = (item, index) => {
  if (Array.isArray(item.questions)) {
    return item.questions.map((question, questionIndex) =>
      normalizeQuestion(question, index, questionIndex)
    );
  }
  if (Array.isArray(item.qa)) {
    return item.qa.map((question, questionIndex) =>
      normalizeQuestion(question, index, questionIndex)
    );
  }
  if (item.question) {
    return [normalizeQuestion(item, index, 0)];
  }
  return [];
};

const buildCompactItem = (item, index) => ({
  id: item.id || item.item_id || item.question_id || `item-${index}`,
  sessions: normalizeSessions(item, index),
  questions: normalizeQuestions(item, index)
});

const streamJsonArray = (inputPath, onItem) =>
  new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    const pipeline = input.pipe(parser()).pipe(streamArray());

    pipeline.on('data', ({ value }) => {
      onItem(value);
    });
    pipeline.on('end', resolve);
    pipeline.on('error', reject);
    input.on('error', reject);
  });

const buildCompactStream = async (input, output) => {
  const out = fs.createWriteStream(output);
  out.write('{\n  "version": "1",\n  "items": [\n');
  let first = true;
  let index = 0;
  await streamJsonArray(input, (item) => {
    const compactItem = buildCompactItem(item, index);
    const json = JSON.stringify(compactItem);
    out.write(`${first ? '' : ',\n'}${json}`);
    first = false;
    index += 1;
  });
  out.write('\n  ]\n}\n');
  await new Promise((resolve) => out.end(resolve));
};

const run = async () => {
  for (const { input, output } of inputFiles) {
    if (!fs.existsSync(input)) {
      console.log(`Raw file missing: ${input}. Keeping existing compact data.`);
      continue;
    }
    await buildCompactStream(input, output);
    console.log(`Wrote compact dataset to ${output}`);
  }
};

run().catch((err) => {
  console.error('Dataset build failed:', err.message);
  process.exit(1);
});
