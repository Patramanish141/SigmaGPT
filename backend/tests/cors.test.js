import request from "supertest";
import app from "../app.js";

const ALLOWED_ORIGIN = "http://ec2-16-171-18-152.eu-north-1.compute.amazonaws.com";

describe("CORS configuration", () => {
  test("answers the browser preflight for /login with credentials allowed", async () => {
    const res = await request(app)
      .options("/login")
      .set("Origin", ALLOWED_ORIGIN)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  // Regression: cors() used to run *after* express.json(), so a body-parser
  // error skipped it and the 400 came back with no CORS headers. The browser
  // then reported it as a CORS failure instead of a bad request.
  test("still sends CORS headers when the body parser rejects the request", async () => {
    const res = await request(app)
      .post("/login")
      .set("Origin", ALLOWED_ORIGIN)
      .set("Content-Type", "application/json")
      .send("{not valid json");

    expect(res.status).toBe(400);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
  });

  test("does not authorize an origin that is not in the allowlist", async () => {
    const res = await request(app)
      .options("/login")
      .set("Origin", "http://evil.example.com")
      .set("Access-Control-Request-Method", "POST");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
