const fs = require('fs');
const path = require('path');

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
      turns: Array.isArray(session.turns)
        ? session.turns.map(normalizeTurn)
        : Array.isArray(session.messages)
        ? session.messages.map(normalizeTurn)
        : []
    }));
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
    id: question.id || `${index}-q-${questionIndex}`,
    type,
    prompt: String(prompt),
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

const buildCompact = (raw) => {
  const items = raw.map((item, index) => ({
    id: item.id || item.item_id || `item-${index}`,
    sessions: normalizeSessions(item, index),
    questions: normalizeQuestions(item, index)
  }));
  return {
    version: '1',
    items
  };
};

inputFiles.forEach(({ input, output }) => {
  if (!fs.existsSync(input)) {
    console.log(`Raw file missing: ${input}. Keeping existing compact data.`);
    return;
  }

  const raw = JSON.parse(fs.readFileSync(input, 'utf8'));
  const compact = buildCompact(Array.isArray(raw) ? raw : raw.items || []);
  fs.writeFileSync(output, JSON.stringify(compact, null, 2));
  console.log(`Wrote compact dataset to ${output}`);
});
