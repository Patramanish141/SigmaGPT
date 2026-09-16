import request from "supertest";
import app from "../app.js";
import { connect, clearDatabase, closeDatabase } from "./db.js";

jest.mock("../utils/openai.js", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue("This is a mocked AI reply."),
}));

import getOpenAIAPIResponse from "../utils/openai.js";

process.env.TOKEN_KEY = process.env.TOKEN_KEY || "test-secret-key-for-jest";

beforeAll(async () => {
  await connect();
}, 120000);

afterEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});

afterAll(async () => {
  await closeDatabase();
});

const credentials = {
  email: "bob@example.com",
  username: "bob",
  password: "supersecret1",
};

const otherUser = {
  email: "carol@example.com",
  username: "carol",
  password: "differentpass9",
};

async function loginAndGetCookie(user = credentials) {
  await request(app).post("/signup").send(user);
  const res = await request(app)
    .post("/login")
    .send({ email: user.email, password: user.password });
  return res.headers["set-cookie"];
}

describe("chat routes require authentication", () => {
  test("GET /api/thread without a session cookie is rejected", async () => {
    const res = await request(app).get("/api/thread");
    expect(res.status).toBe(401);
  });

  test("POST /api/chat without a session cookie is rejected", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ threadId: "t1", message: "hi" });
    expect(res.status).toBe(401);
  });

  test("DELETE /api/thread/:threadId without a session cookie is rejected", async () => {
    const res = await request(app).delete("/api/thread/t1");
    expect(res.status).toBe(401);
  });
});

describe("chat routes (authenticated)", () => {
  let cookie;

  beforeEach(async () => {
    cookie = await loginAndGetCookie();
  });

  test("POST /api/chat creates a thread, calls the (mocked) OpenAI client once, and returns its reply", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Cookie", cookie)
      .send({ threadId: "thread-1", message: "Hello there" });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("This is a mocked AI reply.");
    expect(getOpenAIAPIResponse).toHaveBeenCalledTimes(1);
    expect(getOpenAIAPIResponse).toHaveBeenCalledWith("Hello there");
  });

  test("GET /api/thread/:threadId returns the persisted conversation", async () => {
    await request(app)
      .post("/api/chat")
      .set("Cookie", cookie)
      .send({ threadId: "thread-2", message: "First message" });

    const res = await request(app)
      .get("/api/thread/thread-2")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ role: "user", content: "First message" });
    expect(res.body[1]).toMatchObject({
      role: "assistant",
      content: "This is a mocked AI reply.",
    });
  });

  test("GET /api/thread lists previously created threads", async () => {
    await request(app)
      .post("/api/chat")
      .set("Cookie", cookie)
      .send({ threadId: "thread-3", message: "hey" });

    const res = await request(app).get("/api/thread").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.some((t) => t.threadId === "thread-3")).toBe(true);
  });

  test("POST /api/chat with a missing message field is rejected before calling OpenAI", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Cookie", cookie)
      .send({ threadId: "thread-4" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Missing required fields");
    expect(getOpenAIAPIResponse).not.toHaveBeenCalled();
  });
});

// Regression: threads used to be stored with no owner and read back with
// Thread.find({}), so every account saw every other account's chat history.
describe("threads are isolated per user", () => {
  let cookieA;
  let cookieB;

  beforeEach(async () => {
    cookieA = await loginAndGetCookie(credentials);
    cookieB = await loginAndGetCookie(otherUser);

    await request(app)
      .post("/api/chat")
      .set("Cookie", cookieA)
      .send({ threadId: "alice-thread", message: "Alice's private message" });
  });

  test("user B's thread list does not contain user A's thread", async () => {
    const res = await request(app).get("/api/thread").set("Cookie", cookieB);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test("user B gets 404 fetching user A's thread by id", async () => {
    const res = await request(app)
      .get("/api/thread/alice-thread")
      .set("Cookie", cookieB);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Thread not found");
    // the message content must not leak in any form
    expect(JSON.stringify(res.body)).not.toContain("Alice's private message");
  });

  test("user B cannot delete user A's thread, and it survives the attempt", async () => {
    const res = await request(app)
      .delete("/api/thread/alice-thread")
      .set("Cookie", cookieB);

    expect(res.status).toBe(404);

    const stillThere = await request(app)
      .get("/api/thread/alice-thread")
      .set("Cookie", cookieA);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body).toHaveLength(2);
  });

  test("user A still sees their own thread", async () => {
    const res = await request(app).get("/api/thread").set("Cookie", cookieA);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].threadId).toBe("alice-thread");
  });

  // Guards the compound {userId, threadId} index: the old global unique index
  // on threadId alone would make this collide with a duplicate-key 500.
  test("user B reusing user A's threadId gets their own separate thread", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Cookie", cookieB)
      .send({ threadId: "alice-thread", message: "Bob's own message" });

    expect(res.status).toBe(200);

    const bobsThread = await request(app)
      .get("/api/thread/alice-thread")
      .set("Cookie", cookieB);
    expect(bobsThread.body).toHaveLength(2);
    expect(bobsThread.body[0].content).toBe("Bob's own message");

    // A's thread of the same id is untouched
    const alicesThread = await request(app)
      .get("/api/thread/alice-thread")
      .set("Cookie", cookieA);
    expect(alicesThread.body).toHaveLength(2);
    expect(alicesThread.body[0].content).toBe("Alice's private message");
  });
});
