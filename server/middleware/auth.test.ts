import assert from "node:assert/strict";
import test from "node:test";
import { authenticateUser, signAuthToken } from "./auth.js";

process.env.JWT_SECRET = "test-only-jwt-secret-that-is-long-enough";

test("authenticates a valid JWT and attaches only its identity", () => {
  const token = signAuthToken({ id: "user-a", email: "a@example.com" });
  const request: any = { headers: { authorization: `Bearer ${token}` } };
  let nextCalled = false;
  authenticateUser(request, {} as any, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.deepEqual(request.user, { id: "user-a", email: "a@example.com" });
});

test("rejects an invalid JWT without calling the protected handler", () => {
  const request: any = { headers: { authorization: "Bearer invalid-token" } };
  let statusCode = 0;
  let nextCalled = false;
  const response: any = {
    status(code: number) { statusCode = code; return this; },
    json() { return this; },
  };
  authenticateUser(request, response, () => { nextCalled = true; });
  assert.equal(statusCode, 401);
  assert.equal(nextCalled, false);
});
