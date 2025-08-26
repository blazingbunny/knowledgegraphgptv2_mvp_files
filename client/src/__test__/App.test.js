import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";

// Mock Graph to isolate App testing
jest.mock("../Graph", () => () => <div data-testid="graph-mock" />);

test("renders app UI and interacts with key input fields (manual toggle)", () => {
  render(<App />);

  // Title present
  expect(screen.getByText(/KnowledgeGraph GPT/i)).toBeInTheDocument();

  // Toggle manual key on
  const toggle = screen.getByText(/Use manual API key/i);
  fireEvent.click(toggle.previousSibling.querySelector("input"));

  // Prompt field
  const promptInput = screen.getByPlaceholderText("Enter your prompt");
  expect(promptInput).toBeInTheDocument();

  // API key input (label depends on endpoint)
  const openaiOption = screen.getByDisplayValue("OpenRouter (default)");
  expect(openaiOption).toBeInTheDocument();

  // When manual is on, an input appears
  const apiKeyInput =
    screen.getByPlaceholderText("Enter your OpenRouter API Key") ||
    screen.getByPlaceholderText("Enter your OpenAI API Key");
  expect(apiKeyInput).toBeInTheDocument();

  // Generate button
  const generateButton =
    screen.getByRole("button", { name: /generate/i }) ||
    screen.getByRole("button", { name: /Generating.../i });
  expect(generateButton).toBeInTheDocument();

  // Graph mock present
  expect(screen.getByTestId("graph-mock")).toBeInTheDocument();
});
