import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import PublicRoute from "./PublicRoute";

vi.mock("../hooks/useAuth", () => ({
  default: vi.fn(),
}));

import useAuth from "../hooks/useAuth";

const renderWithRouter = (ui: React.ReactNode, initialPath = "/") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={ui} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>
  );

describe("PublicRoute", () => {
  it("should render loading state while auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isAuthLoading: true } as any);

    renderWithRouter(
      <PublicRoute>
        <p>Public Content</p>
      </PublicRoute>
    );

    expect(screen.getByText("Checking session...")).toBeInTheDocument();
  });

  it("should redirect authenticated users to dashboard", async () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isAuthLoading: false } as any);

    renderWithRouter(
      <PublicRoute>
        <p>Public Content</p>
      </PublicRoute>
    );

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });

  it("should render public content for unauthenticated users", () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isAuthLoading: false } as any);

    renderWithRouter(
      <PublicRoute>
        <p>Public Content</p>
      </PublicRoute>
    );

    expect(screen.getByText("Public Content")).toBeInTheDocument();
  });
});
