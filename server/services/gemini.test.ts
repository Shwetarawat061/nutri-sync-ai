import assert from "node:assert/strict";
import test from "node:test";
import { classifyScanError, validateGeminiScanPayload } from "./gemini.js";

const validPayload = {
  model: "gemini-test",
  mealName: "Lentil bowl",
  foods: [{ name: "Lentils", portion: "1 bowl" }],
  nutrition: { calories: 420, protein: 24, carbs: 55, fat: 10, fiber: 14 },
  confidence: 0.92,
  reasoning: "Visible ingredients support this estimate.",
  warnings: [],
  estimatedWeightG: 350,
};

test("accepts a valid AI success response", () => {
  const result = validateGeminiScanPayload(validPayload);
  assert.equal(result?.success, true);
  assert.deepEqual(result?.nutrition, validPayload.nutrition);
});

test("rejects malformed JSON output", () => {
  assert.equal(validateGeminiScanPayload(JSON.parse("{}")), null);
});

test("rejects missing required nutrition fields", () => {
  const payload = { ...validPayload, nutrition: { ...validPayload.nutrition, fat: undefined } };
  assert.equal(validateGeminiScanPayload(payload), null);
});

test("retains low confidence for the service to classify", () => {
  const result = validateGeminiScanPayload({ ...validPayload, confidence: 0.2 });
  assert.equal(result?.confidence, 0.2);
});

test("classifies timeouts as AI unavailable", () => {
  assert.equal(classifyScanError(new Error("request timed out")).errorCode, "AI_UNAVAILABLE");
});

test("classifies API failures as AI unavailable", () => {
  assert.equal(classifyScanError(new Error("503 service unavailable")).errorCode, "AI_UNAVAILABLE");
});