/**
 * redFlagCheck.js
 *
 * This is the most important file in the app.
 * It runs BEFORE any AI call. If it matches, we skip the AI entirely
 * and return an immediate emergency message. This protects users even
 * if the AI reasoning would have gotten something wrong or been too slow.
 *
 * IMPORTANT: This list is a starting point only. Before any real users
 * touch this app, have a licensed physician review and expand it.
 */

const EMERGENCY_PATTERNS = [
  // Cardiac / circulatory
  /chest pain/i,
  /chest pressure/i,
  /crushing (feeling|pain)/i,
  /pain (radiating|spreading) (down|to) (my |the )?(left )?arm/i,

  // Respiratory
  /can'?t breathe/i,
  /difficulty breathing/i,
  /shortness of breath.*(severe|sudden|worsening)/i,
  /choking/i,
  /turning blue|lips? (are |turning )?blue/i,

  // Neurological / stroke (FAST criteria)
  /face (is )?droop(ing)?/i,
  /slurred speech/i,
  /sudden (numbness|weakness).*(face|arm|leg|one side)/i,
  /can'?t (move|feel) (my |one )?(arm|leg|side)/i,
  /worst headache of my life/i,
  /sudden (confusion|vision loss)/i,

  // Bleeding / trauma
  /severe bleeding/i,
  /bleeding.*(won'?t stop|not stopping)/i,
  /coughing (up )?blood/i,
  /vomiting blood/i,

  // Consciousness
  /unconscious/i,
  /unresponsive/i,
  /passed out/i,
  /fainted.*(not waking|still out)/i,

  // Mental health crisis
  /suicidal/i,
  /want to die/i,
  /kill myself/i,
  /end (my|it) (life|all)/i,
  /hurting myself/i,

  // Allergic / anaphylaxis
  /throat (closing|swelling)/i,
  /can'?t swallow.*swelling/i,
  /severe allergic reaction/i,

  // Poisoning / overdose
  /overdose/i,
  /took too many (pills|tablets|medication)/i,
  /swallowed (poison|bleach|chemicals)/i,
];

/**
 * Checks user input for emergency red-flag language.
 * @param {string} text - raw user message
 * @returns {boolean} true if this should trigger an immediate emergency response
 */
function checkRedFlags(text) {
  if (!text || typeof text !== "string") return false;
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(text));
}

const EMERGENCY_RESPONSE = {
  urgency: "EMERGENCY",
  message:
    "This may be a medical emergency. Please call your local emergency number right now (e.g. 911 in the US, 112 in the EU, 108 in India) or go to the nearest emergency room immediately. Do not wait for an app to help you with this.",
  possibleAreas: [],
  suggestedAction: "CALL EMERGENCY SERVICES NOW",
  disclaimer:
    "This is not a diagnosis. This is a safety alert based on the words you used.",
};

module.exports = { checkRedFlags, EMERGENCY_RESPONSE };
