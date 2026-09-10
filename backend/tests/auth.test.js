import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { connect, clearDatabase, closeDatabase } from "./db.js";

process.env.TOKEN_KEY = process.env.TOKEN_KEY || "test-secret-key-for-jest";

beforeAll(async () => {
  await connect();
}, 120000);

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

const newUser = {
  email: "alice@example.com",
  username: "alice",
  password: "correcthorse123",
};

describe("POST /signup", () => {
  test("creates a new user, hashes the password, and returns 201", async () => {
    const res = await request(app).post("/signup").send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(newUser.email);
    expect(res.body.user.username).toBe(newUser.username);
    // password must never be stored/returned in plaintext
    expect(res.body.user.password).not.toBe(newUser.password);
  });

  test("rejects a duplicate email without creating a second user", async () => {
    await request(app).post("/signup").send(newUser);

    const res = await request(app).post("/signup").send(newUser);

    expect(res.body.message).toBe("User already exists");
    expect(res.body.success).toBeUndefined();
  });
});

describe("POST /login", () => {
  beforeEach(async () => {
    await request(app).post("/signup").send(newUser);
  });

  test("logs in with correct credentials and issues a verifiable JWT cookie", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: newUser.email, password: newUser.password });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBe(newUser.username);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const tokenCookie = cookies.find((c) => c.startsWith("token="));
    expect(tokenCookie).toBeDefined();

    const token = tokenCookie.split(";")[0].split("=")[1];
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    expect(decoded).toHaveProperty("id");
  });

  test("rejects an incorrect password and issues no cookie", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: newUser.email, password: "wrongpassword" });

    expect(res.body.message).toBe("Incorrect password or email");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  test("rejects an email that was never registered", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: "nobody@example.com", password: "whatever123" });

    expect(res.body.message).toBe("Incorrect password or email");
  });
});
