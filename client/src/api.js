
const defaultApiBase = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "/api";

const API_BASE = (import.meta.env.VITE_API_URL || defaultApiBase)
  .replace(/\/+$/, "");

async function request(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });
  } catch (error) {
    if (error.name === "TimeoutError") {
      throw new Error("This is taking longer than expected. Please try again.");
    }
    throw new Error("Could not reach StudyPilot. Check that the API server is running.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

export function generateSummary(text, level = "medium") {
  return request("/ai/summarize", { text, level });
}

export function generateQuiz(text, count = 5, difficulty = "medium") {
  return request("/ai/quiz", { text, count, difficulty });
}

export function generateFlashcards(text, count = 8) {
  return request("/ai/flashcards", { text, count });
}

export function askTutor(question, history = []) {
  return request("/ai/chat", { question, history });
}
