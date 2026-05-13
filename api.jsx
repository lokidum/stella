// Claude API wrapper. Three paths:
//  1) Direct call to api.anthropic.com with user-supplied key
//  2) window.claude.complete (built-in artifact runtime, no key needed)
//  3) Canned fallback that respects Stella's writing rules
//
// Exports: askStella(lane, apiKey), chatStella(history, apiKey)

const STELLA_SYSTEM_PROMPT = `You are Stella, a gentle AR companion for university students at QUT with social anxiety. You appear in the user's phone camera view and offer low-pressure suggestions.

Writing rules, never broken:
- Never use em dashes or en dashes. Use commas, colons, or full stops instead.
- Never use asterisks for emphasis or formatting. No bold, no italics in output.
- Never use bullet points or numbered lists in output.
- Always frame suggestions as gentle questions, never imperatives.
- Always offer the user an out. They are in control.
- Keep responses short, one to two sentences maximum.
- Use Australian English spelling (behaviour, colour, organised, recognise).
- Sound like a quietly warm human friend, not a chatbot. No greetings, no 'I would be happy to', no 'great question'. Skip pleasantries entirely.
- Never mention being an AI. Avoid AI cliches: dive in, navigate, leverage, facilitate, robust, transformative, holistic, synergy, tapestry, multifaceted, pivotal.

When the user is in the Find a Place lane, give a single wayfinding suggestion under 15 words. Vary the place across responses: courtyards, cafe corners, study booths, library nooks, lawns, breezeways, lecture-theatre back rows, common rooms, food court edges, gardens, quiet stairwells. Never default to the library.
When the user is in the Start a Conversation lane, give a single icebreaker under 20 words.
When the user is in the You're Not Alone lane, give a single reassurance line under 15 words.

Output only the suggestion text, nothing else.`;

const STELLA_CHAT_SYSTEM = `You are Stella, a gentle AI companion who chats with a socially-anxious QUT student. The same writing rules apply:
- No em dashes, en dashes, asterisks, bullet points, or numbered lists.
- Always gentle questions, not imperatives. Always offer them an out.
- One to two sentences per turn, never longer.
- Australian English. Skip pleasantries.
- Never call yourself an AI. Avoid AI cliches.
- You hold space. You do not fix. You do not push.
- If they share something hard, sit with it before suggesting anything.

Output only your turn, nothing else.`;

// Random campus locations for the Find-a-Place lane
const QUT_PLACES = [
  "the Z9 study commons",
  "the courtyard outside P block",
  "the lawn near Old Government House",
  "the breezeway by the library",
  "the back row of QE2 lecture theatre",
  "the food court at GP",
  "a quiet corner of the engineering common room",
  "the bench under the jacaranda on the lawn",
  "the soft seats by the QUT Art Museum",
  "the upper level of the library cafe",
  "the picnic tables at Goodwill Bridge end",
  "the small couches outside the design studio",
  "a corner table at the Botanic Gardens cafe",
];

function randomPlace() {
  return QUT_PLACES[Math.floor(Math.random() * QUT_PLACES.length)];
}

const LANE_USER_PROMPT = (lane) => {
  const place = randomPlace();
  if (lane === "find") {
    return `I'm standing near a small group of students at ${place}. Suggest a single specific kind of spot I could move to (a corner table, window seat, quiet booth, a chair near the door, a low couch, a bench in the sun, a spot under a tree, a back row seat). Mention the actual spot type. Do not say library.`;
  }
  if (lane === "talk") {
    return `I'm standing near a small group of students at ${place}. Give me a single icebreaker question I could ask them. Make it specific to a uni context (course, week of semester, the cafe, an assignment, a lecturer, the weather on the lawn).`;
  }
  return `I'm at ${place} feeling overwhelmed. Give me a single reassurance line. Acknowledge the moment. Do not try to fix.`;
};

const FALLBACKS = {
  find: [
    "Would the bench under the jacaranda feel quieter for now?",
    "Could you try the corner couch in the design studio?",
    "Would a back-row seat in the lecture theatre give you breathing room?",
    "Want to take the window table at the GP food court?",
    "Could the small steps by the lawn work for a minute?",
    "Would the quiet booth in Z9 commons feel okay?",
    "Could the soft seats outside the art museum be a soft landing?",
  ],
  talk: [
    "Want to ask them what course they're in, and how week one is treating them?",
    "Could you ask if anyone has tried the cafe upstairs yet?",
    "Would it feel okay to say you're new, and ask where they like to study?",
    "Want to ask what they think of the lecturer, or is it just you?",
    "Could you ask whether they have figured out the Z block lifts yet?",
  ],
  alone: [
    "Four Stellas have stood right here today. You're in good company.",
    "Take a moment if you need to. The day will wait.",
    "Slow breath, soft eyes. You're doing enough already.",
    "It's okay to just stand here for a minute. Really.",
    "You are allowed to be quiet right now.",
  ],
};

const CHAT_FALLBACKS = [
  "I'm here. What's it like right now?",
  "Want to tell me one small thing, or sit quietly together for a bit?",
  "Mm. That sounds heavy. Is there a softer corner of it we could look at?",
  "You don't have to do anything yet. Where in your body do you feel it?",
  "Okay. We can stay with that. Is there a quieter spot you could move to first?",
];

function pickFallback(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function callClaude({ system, messages, apiKey }) {
  // Direct Anthropic
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 300,
          system,
          messages,
        }),
      });
      if (!res.ok) throw new Error("api " + res.status);
      const data = await res.json();
      const text = data?.content?.[0]?.text?.trim();
      if (text) return { text, source: "direct" };
    } catch (e) {
      console.warn("Direct Anthropic call failed:", e);
    }
  }

  // Built-in runtime
  if (typeof window.claude?.complete === "function") {
    try {
      const text = await window.claude.complete({ messages, system });
      if (typeof text === "string" && text.trim()) {
        return { text: text.trim(), source: "claude" };
      }
    } catch (e) {
      console.warn("window.claude.complete failed:", e);
    }
  }

  return null;
}

function clean(text) {
  return (text || "")
    .replace(/[—–]/g, ",")
    .replace(/\*/g, "")
    .replace(/^["'`]|["'`]$/g, "")
    .trim();
}

async function askStella(lane, apiKey) {
  const result = await callClaude({
    system: STELLA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: LANE_USER_PROMPT(lane) }],
    apiKey,
  });
  if (result) return { text: clean(result.text), source: result.source };
  return { text: pickFallback(FALLBACKS[lane] || FALLBACKS.alone), source: "fallback" };
}

async function chatStella(history, apiKey) {
  // history = [{role:'user'|'assistant', content:string}, ...]
  const result = await callClaude({
    system: STELLA_CHAT_SYSTEM,
    messages: history,
    apiKey,
  });
  if (result) return { text: clean(result.text), source: result.source };
  return { text: pickFallback(CHAT_FALLBACKS), source: "fallback" };
}

window.askStella = askStella;
window.chatStella = chatStella;
