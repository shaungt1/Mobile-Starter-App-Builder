import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "./home";

describe("HomePage", () => {
  it("shows runtime details reported by the Rust core", async () => {
    mockWindows("main");
    mockIPC((command) =>
      command === "app_info"
        ? { name: "Test App", version: "1.2.3", platform: "android", arch: "aarch64", tauri: "2.12.5" }
        : null,
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <HomePage />
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId("app-version")).toHaveTextContent("1.2.3");
    expect(screen.getByText("2.12.5")).toBeInTheDocument();
  });
});
