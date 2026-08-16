import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

vi.mock("../hooks/useAuth", () => ({
  default: vi.fn(),
}));

import useAuth from "../hooks/useAuth";

const renderWithRouter = (ui: React.ReactNode, initialPath = "/private") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<p>Home page</p>} />
        <Route path="/private" element={ui} />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  it("should render loading state while auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isAuthLoading: true } as any);

    renderWithRouter(
      <ProtectedRoute>
        <p>Secret</p>
      </ProtectedRoute>
    );

    expect(screen.getByText("Checking session...")).toBeInTheDocument();
  });

  it("should redirect unauthenticated users to home page", async () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isAuthLoading: false } as any);

    renderWithRouter(
      <ProtectedRoute>
        <p>Secret</p>
      </ProtectedRoute>
    );

    expect(await screen.findByText("Home page")).toBeInTheDocument();
  });

  it("should render protected content for authenticated users", () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isAuthLoading: false } as any);

    renderWithRouter(
      <ProtectedRoute>
        <p>Secret</p>
      </ProtectedRoute>
    );

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
