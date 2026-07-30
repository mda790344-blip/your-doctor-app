/**
 * aiService.js
 *
 * Handles the actual call to Groq's API. Keeps the AI call logic
 * separate from routing/safety logic so each piece stays testable.
 */

const Groq = require("groq-sdk");
const { SYSTEM_PROMPT } = require("../prompts/systemPrompt");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Sends the conversation history to Groq and returns a parsed JSON response.
 * @param {Array<{role: string, content: string}>} conversationHistory
 * @returns {Promise<object>} parsed triage response matching the shape in systemPrompt.js
 */
async function getTriageResponse(conversationHistory) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
  ];

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0, // deterministic output -- same input gives the same triage result every time
    max_tokens: 800,
    response_format: { type: "json_object" }, // Groq supports forced JSON mode on supported models
  });

  const raw = completion.choices[0]?.message?.content;

  if (!raw) {
    throw new Error("Empty response from Groq API");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // Fallback if the model ever slips and adds stray text around the JSON
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Could not parse AI response as JSON: " + raw);
    }
  }

  return parsed;
}

module.exports = { getTriageResponse };
