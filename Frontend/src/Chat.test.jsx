import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Chat from "./Chat.jsx";
import { Mycontext } from "./MyContext.jsx";

function renderChat(contextValue) {
  return render(
    <Mycontext.Provider value={contextValue}>
      <Chat />
    </Mycontext.Provider>
  );
}

describe("Chat", () => {
  test("shows the empty-state prompt for a new chat with no messages", () => {
    renderChat({ newChat: true, prevChats: [], reply: null });

    expect(screen.getByText("Start a new chat")).toBeInTheDocument();
  });

  test("renders both user and assistant messages from prevChats", () => {
    const prevChats = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi, how can I help?" },
    ];
    renderChat({ newChat: false, prevChats, reply: null });

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi, how can I help?")).toBeInTheDocument();
  });

  test("does not show the empty-state once messages exist, even if newChat is true", () => {
    const prevChats = [{ role: "user", content: "Hi" }];
    renderChat({ newChat: true, prevChats, reply: null });

    expect(screen.queryByText("Start a new chat")).not.toBeInTheDocument();
  });
});
