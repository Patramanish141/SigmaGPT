import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ChatWindow from "./ChatWindow.jsx";
import { Mycontext } from "./MyContext.jsx";

function renderChatWindow(overrides = {}) {
  const contextValue = {
    reply: null,
    setReply: vi.fn(),
    prompt: "",
    setPrompt: vi.fn(),
    currThreadId: "thread-abc",
    prevChats: [],
    setPrevChats: vi.fn(),
    setNewChat: vi.fn(),
    username: "alice",
    setUsername: vi.fn(),
    getAllThreads: vi.fn(),
    newChat: true,
    ...overrides,
  };

  const utils = render(
    <MemoryRouter>
      <Mycontext.Provider value={contextValue}>
        <ChatWindow />
      </Mycontext.Provider>
    </MemoryRouter>
  );

  return { ...utils, contextValue };
}

describe("ChatWindow", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ reply: "Mocked reply" }),
    });
  });

  test("renders the prompt input and username", () => {
    renderChatWindow();

    expect(screen.getByPlaceholderText("Ask anything")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  test("sends the current prompt to the chat API and stores the returned reply", async () => {
    const setReply = vi.fn();
    const { container } = renderChatWindow({ prompt: "Hello AI", setReply });

    await userEvent.click(container.querySelector(".submit"));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/chat"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "Hello AI", threadId: "thread-abc" }),
      })
    );

    await waitFor(() => expect(setReply).toHaveBeenCalledWith("Mocked reply"));
  });
});
