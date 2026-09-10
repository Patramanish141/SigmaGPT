import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Login from "./Login.jsx";
import { Mycontext } from "./MyContext.jsx";

vi.mock("axios");

function renderLogin(setUsername = vi.fn()) {
  return render(
    <MemoryRouter>
      <Mycontext.Provider value={{ setUsername }}>
        <Login />
      </Mycontext.Provider>
    </MemoryRouter>
  );
}

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders email and password fields and a sign-in button", () => {
    renderLogin();

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("submits entered credentials to the login API and updates auth state on success", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Logged in", user: "alice" },
    });
    const setUsername = vi.fn();
    renderLogin(setUsername);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "alice@example.com");
    await userEvent.type(screen.getByPlaceholderText("Enter your password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/login"),
      { email: "alice@example.com", password: "password123" },
      { withCredentials: true }
    );
    expect(setUsername).toHaveBeenCalledWith("alice");
  });

  test("shows the server error message and leaves auth state untouched on failed login", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Incorrect password or email" },
    });
    const setUsername = vi.fn();
    renderLogin(setUsername);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "alice@example.com");
    await userEvent.type(screen.getByPlaceholderText("Enter your password"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(setUsername).not.toHaveBeenCalled();
    expect(await screen.findByText("Incorrect password or email")).toBeInTheDocument();
  });
});
