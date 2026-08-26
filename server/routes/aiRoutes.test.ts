import assert from "node:assert/strict";
import test from "node:test";
import { validateScanImages } from "./aiRoutes.js";

test("accepts supported scan images", () => {
  assert.equal(validateScanImages(["a"], ["image/jpeg"]), null);
});

test("rejects too many scan images", () => {
  assert.equal(validateScanImages(["a", "b", "c", "d", "e"], ["image/jpeg", "image/jpeg", "image/jpeg", "image/jpeg", "image/jpeg"]), "The selected image is too large or invalid.");
});

test("rejects unsupported image MIME types", () => {
  assert.equal(validateScanImages(["a"], ["text/plain"]), "The selected image type is invalid.");
});