const express = require("express");
const router = express.Router();
const { checkRedFlags, EMERGENCY_RESPONSE } = require("../services/redFlagCheck");
const { getTriageResponse } = require("../services/aiService");

/**
 * POST /api/triage
 * body: { message: string, history: [{role, content}] }
 *
 * history is the full prior conversation (excluding system prompt) so the
 * AI has context across follow-up questions. The mobile app is responsible
 * for keeping and sending this array back on each request.
 */
router.post("/", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    // SAFETY LAYER FIRST -- always runs before any AI call
    if (checkRedFlags(message)) {
      return res.json(EMERGENCY_RESPONSE);
    }

    // Also check the full recent history in case red flags emerged
    // gradually across the conversation, not just the latest message
    const recentUserText = history
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" ") + " " + message;

    if (checkRedFlags(recentUserText)) {
      return res.json(EMERGENCY_RESPONSE);
    }

    const conversationHistory = [
      ...history,
      { role: "user", content: message },
    ];

    const aiResponse = await getTriageResponse(conversationHistory);

    return res.json(aiResponse);
  } catch (err) {
    console.error("Triage route error:", err);
    return res.status(500).json({
      error: "Something went wrong processing your request. Please try again.",
    });
  }
});

module.exports = router;
