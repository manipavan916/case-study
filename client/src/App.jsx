
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  BookOpen, Brain, ChartNoAxesCombined, CheckCircle2,
  ChevronRight, CircleHelp, Clock3, FileText, GraduationCap,
  Layers, LoaderCircle, Menu, MessageCircle, Send, Sparkles,
  Target, Upload, X
} from "lucide-react";
import {
  askTutor, generateFlashcards, generateQuiz, generateSummary
} from "./api";

const initialStats = {
  summaries: 0,
  quizzes: 0,
  correct: 0,
  answered: 0,
};

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { id: "summarizer", label: "AI Summarizer", icon: FileText },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "quiz", label: "Quiz Generator", icon: Brain },
  { id: "tutor", label: "AI Study Tutor", icon: MessageCircle },
];

const sampleMaterials = [
  {
    title: "The water cycle",
    subject: "Earth science",
    text: "The water cycle describes how water moves between Earth's surface and the atmosphere. Heat from the Sun causes liquid water in oceans, lakes, and rivers to evaporate into water vapor. Plants also release water vapor through transpiration. As the vapor rises, it cools and condenses into tiny droplets that form clouds. When droplets become heavy, water falls as precipitation, such as rain or snow. Water then collects in bodies of water or soaks into the ground, and the cycle begins again."
  },
  {
    title: "How plants make food",
    subject: "Biology",
    text: "Photosynthesis is the process by which green plants make glucose using light energy. It mainly takes place in chloroplasts, which contain the green pigment chlorophyll. Roots absorb water from the soil, while tiny openings in leaves called stomata allow carbon dioxide to enter. Using energy from sunlight, the plant converts water and carbon dioxide into glucose and oxygen. The glucose can be used for energy or stored, and oxygen is released into the air."
  },
  {
    title: "Forces and motion",
    subject: "Physics",
    text: "A force is a push or pull that can change an object's motion or shape. Forces are measured in newtons. If the forces on an object are balanced, its motion does not change: a stationary object stays still, while a moving object continues at the same speed and direction. An unbalanced force changes motion by causing acceleration, which may mean speeding up, slowing down, or changing direction. Friction acts between surfaces and opposes their movement. Air resistance is a type of friction that acts on objects moving through air."
  }
];

function getSavedStats() {
  try {
    return {
      ...initialStats,
      ...JSON.parse(localStorage.getItem("studypilot-stats") || "{}"),
    };
  } catch {
    return initialStats;
  }
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [stats, setStats] = useState(getSavedStats);
  const [summaryInput, setSummaryInput] = useState("");
  const [summaryLevel, setSummaryLevel] = useState("medium");
  const [summary, setSummary] = useState("");
  const [flashcardInput, setFlashcardInput] = useState("");
  const [flashcardCount, setFlashcardCount] = useState(8);
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [quizInput, setQuizInput] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("studypilot-stats", JSON.stringify(stats));
    } catch {
      // The dashboard remains usable when storage is disabled or full.
    }
  }, [stats]);

  function navigate(id) {
    setPage(id);
    setMobileMenu(false);
    setError("");
  }

  async function runAI(action) {
    setLoading(true);
    setError("");

    try {
      await action();
    } catch (err) {
      setError(err.message || "Unable to complete the request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSummary(event) {
    event.preventDefault();

    if (summaryInput.trim().length < 20) {
      setError("Please enter at least 20 characters of study material.");
      return;
    }

    await runAI(async () => {
      const result = await generateSummary(summaryInput, summaryLevel);
      setSummary(result.summary);
      setStats((s) => ({ ...s, summaries: s.summaries + 1 }));
    });
  }

  async function handleQuiz(event) {
    event.preventDefault();

    if (quizInput.trim().length < 20) {
      setError("Enter at least 20 characters to generate a quiz.");
      return;
    }

    await runAI(async () => {
      const result = await generateQuiz(quizInput, 5, difficulty);
      setQuiz(result.questions);
      setAnswers({});
      setSubmitted(false);
    });
  }

  async function handleFlashcards(event) {
    event.preventDefault();

    if (flashcardInput.trim().length < 20) {
      setError("Enter at least 20 characters to generate flashcards.");
      return;
    }

    await runAI(async () => {
      const result = await generateFlashcards(flashcardInput, flashcardCount);
      setFlashcards(result.flashcards);
      setFlashcardIndex(0);
      setFlashcardRevealed(false);
    });
  }

  function submitQuiz() {
    if (Object.keys(answers).length !== quiz.length) {
      setError("Answer every question before submitting.");
      return;
    }

    const correct = quiz.reduce(
      (total, q, i) => total + (answers[i] === q.answer ? 1 : 0),
      0
    );

    setSubmitted(true);
    setError("");
    setStats((s) => ({
      ...s,
      quizzes: s.quizzes + 1,
      correct: s.correct + correct,
      answered: s.answered + quiz.length,
    }));
  }

  async function handleChat(event) {
    event.preventDefault();
    const text = question.trim();

    if (!text) return;

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setQuestion("");

    await runAI(async () => {
      const history = nextMessages.slice(-10).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        text: m.text,
      }));

      const result = await askTutor(text, history.slice(0, -1));
      setMessages((m) => [
        ...m,
        { role: "assistant", text: result.answer },
      ]);
    });
  }

  const accuracy = stats.answered
    ? Math.round((stats.correct / stats.answered) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-slate-800">
      {mobileMenu && (
        <button
          className="fixed inset-0 z-30 bg-slate-900/30 md:hidden"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white p-5 transition-transform md:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <GraduationCap size={23} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">StudyPilot</h1>
              <p className="text-xs text-slate-500">Your AI study partner</p>
            </div>
          </div>
          <button
            className="md:hidden"
            onClick={() => setMobileMenu(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                page === id
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={19} />
              {label}
              {page === id && <ChevronRight className="ml-auto" size={16} />}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-blue-50 p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
            <Sparkles size={20} />
          </div>
          <p className="font-semibold text-slate-800">Study smarter</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Turn your learning materials into personalized study resources.
          </p>
          <button
            onClick={() => navigate("summarizer")}
            className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Start studying →
          </button>
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-sm font-semibold">
                {navigation.find((n) => n.id === page)?.label || "Dashboard"}
              </p>
              <p className="text-xs text-slate-500">
                Your personal learning workspace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-slate-600">
              AI Study Space
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-5 md:p-9">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={17} />
              </button>
            </div>
          )}

          {page === "dashboard" && (
            <Dashboard
              stats={stats}
              accuracy={accuracy}
              navigate={navigate}
            />
          )}

          {page === "summarizer" && (
            <section className="space-y-6">
              <PageHeading
                eyebrow="LEARN MORE, READ LESS"
                title="AI Notes Summarizer"
                description="Transform your study material into clear, organized revision notes."
              />

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <form onSubmit={handleSummary} className="space-y-5">
                    <label className="block text-sm font-semibold">
                      Your study material
                    </label>
                    <textarea
                      value={summaryInput}
                      onChange={(e) => setSummaryInput(e.target.value)}
                      placeholder="Paste your textbook notes, lecture content, or study material here..."
                      className="min-h-64 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      required
                    />
                    <SampleMaterials onSelect={setSummaryInput} onError={setError} />
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Summary detail
                      </label>
                      <select
                        value={summaryLevel}
                        onChange={(e) => setSummaryLevel(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                      >
                        <option value="short">Short revision notes</option>
                        <option value="medium">Balanced summary</option>
                        <option value="detailed">Detailed study notes</option>
                      </select>
                    </div>
                    <PrimaryButton loading={loading} icon={Sparkles}>
                      Generate summary
                    </PrimaryButton>
                  </form>
                </div>

                <ResultPanel title="Your study notes" subtitle="AI-generated revision guide">
                  {summary ? (
                    <StudyMarkdown>{summary}</StudyMarkdown>
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="Your summary will appear here"
                      description="Add your material and generate notes to start revising."
                    />
                  )}
                </ResultPanel>
              </div>
            </section>
          )}

          {page === "quiz" && (
            <section className="space-y-6">
              <PageHeading
                eyebrow="TEST YOUR KNOWLEDGE"
                title="Smart Quiz Generator"
                description="Generate practice questions from your own learning material."
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <form onSubmit={handleQuiz} className="space-y-4">
                  <label className="block text-sm font-semibold">
                    Paste your study material
                  </label>
                  <textarea
                    value={quizInput}
                    onChange={(e) => setQuizInput(e.target.value)}
                    placeholder="Paste a chapter or topic you want to practice..."
                    className="min-h-36 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    required
                  />
                  <SampleMaterials onSelect={setQuizInput} onError={setError} />
                  <div className="max-w-xs">
                    <label className="mb-2 block text-sm font-medium">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <PrimaryButton loading={loading} icon={Brain}>
                    Generate 5 questions
                  </PrimaryButton>
                </form>
              </div>

              {quiz.length > 0 && (
                <div className="space-y-5">
                  {submitted && (() => {
                    const score = quiz.filter((q, i) => answers[i] === q.answer).length;
                    const percent = Math.round((score / quiz.length) * 100);
                    return (
                      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-5 bg-gradient-to-r from-blue-700 to-indigo-600 px-6 py-5 text-white">
                          <div>
                            <p className="text-sm font-medium text-blue-100">Practice session complete</p>
                            <h3 className="mt-1 text-xl font-bold">{percent >= 80 ? "Excellent work!" : percent >= 60 ? "Good progress!" : "Keep building your knowledge"}</h3>
                            <p className="mt-1 text-sm text-blue-100">You answered {score} of {quiz.length} questions correctly.</p>
                          </div>
                          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-white/30 bg-white/10">
                            <span className="text-2xl font-bold">{percent}%</span>
                            <span className="text-[10px] uppercase tracking-wider text-blue-100">score</span>
                          </div>
                        </div>
                        <div className="px-6 py-3 text-sm text-slate-600">Review the explanations below to strengthen anything you missed.</div>
                      </div>
                    );
                  })()}

                  {quiz.map((q, i) => (
                    <div
                      key={`${i}-${q.question}`}
                      className="rounded-2xl border border-slate-200 bg-white p-6"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-700">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Question {i + 1}</p>
                          <p className="mt-0.5 text-xs text-slate-400">Choose one answer</p>
                        </div>
                      </div>
                      <h3 className="mt-2 font-semibold leading-6">
                        {q.question}
                      </h3>
                      <div className="mt-4 space-y-2">
                        {q.options.map((option, j) => (
                          <button
                            key={option}
                            disabled={submitted}
                            onClick={() =>
                              setAnswers((a) => ({ ...a, [i]: j }))
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition ${
                              submitted && j === q.answer
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : submitted && answers[i] === j
                                  ? "border-red-300 bg-red-50 text-red-800"
                                  : answers[i] === j
                                    ? "border-blue-400 bg-blue-50 text-blue-800"
                                    : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${submitted && j === q.answer ? "bg-emerald-100 text-emerald-700" : answers[i] === j ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                              {String.fromCharCode(65 + j)}
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>
                      {submitted && (
                        <div className={`mt-4 flex gap-3 rounded-xl p-4 text-sm leading-6 ${answers[i] === q.answer ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>
                          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={17} />
                          <div><strong className="block mb-0.5">Why this is correct</strong>
                          {q.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {!submitted && (
                    <PrimaryButton
                      icon={CheckCircle2}
                      onClick={submitQuiz}
                    >
                      Submit answers
                    </PrimaryButton>
                  )}
                </div>
              )}
            </section>
          )}

          {page === "flashcards" && (
            <section className="space-y-6">
              <PageHeading
                eyebrow="PRACTICE ACTIVE RECALL"
                title="AI Flashcards"
                description="Turn your material into focused question and answer cards. Think of the answer, then flip to check yourself."
              />

              <div className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <form onSubmit={handleFlashcards} className="space-y-5">
                    <label className="block text-sm font-semibold">Your study material</label>
                    <textarea
                      value={flashcardInput}
                      onChange={(e) => setFlashcardInput(e.target.value)}
                      placeholder="Paste notes, a chapter, or key concepts here..."
                      className="min-h-64 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      required
                    />
                    <SampleMaterials onSelect={setFlashcardInput} onError={setError} />
                    <div>
                      <label className="mb-2 block text-sm font-medium">Number of cards</label>
                      <select
                        value={flashcardCount}
                        onChange={(e) => setFlashcardCount(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                      >
                        <option value={5}>5 cards</option>
                        <option value={8}>8 cards</option>
                        <option value={10}>10 cards</option>
                      </select>
                    </div>
                    <PrimaryButton loading={loading} icon={Layers}>Generate flashcards</PrimaryButton>
                  </form>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white px-6 py-5">
                    <div className="rounded-xl bg-white p-2.5 text-violet-600 shadow-sm ring-1 ring-violet-100"><Layers size={19} /></div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Your flashcard deck</h3>
                      <p className="mt-0.5 text-xs text-slate-500">Question on the front · answer on the back</p>
                    </div>
                    {flashcards.length > 0 && <span className="ml-auto rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">{flashcards.length} cards</span>}
                  </div>

                  {flashcards.length ? (
                    <div className="p-5 sm:p-7">
                      <div className="mb-4 flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Card {flashcardIndex + 1} of {flashcards.length}</span>
                        <span>{Math.round(((flashcardIndex + 1) / flashcards.length) * 100)}% through deck</span>
                      </div>
                      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${((flashcardIndex + 1) / flashcards.length) * 100}%` }} />
                      </div>
                      <div className="flashcard-scene min-h-72 sm:min-h-80">
                        <button
                          type="button"
                          onClick={() => setFlashcardRevealed((revealed) => !revealed)}
                          aria-label={flashcardRevealed ? "Show question" : "Reveal answer"}
                          aria-pressed={flashcardRevealed}
                          style={{
                            transform: flashcardRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
                            transformStyle: "preserve-3d",
                          }}
                          className={`flashcard-inner group min-h-72 w-full text-center sm:min-h-80 ${flashcardRevealed ? "is-flipped" : ""}`}
                        >
                          <span className="flashcard-face flashcard-front border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-7 hover:border-blue-300 hover:shadow-md">
                            <span className="mb-5 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-700">Think about it</span>
                            <span className="max-w-xl text-xl font-semibold leading-8 tracking-tight text-slate-800 sm:text-2xl">{flashcards[flashcardIndex].front}</span>
                            <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition group-hover:text-blue-700"><span className="rounded-full bg-white p-2 shadow-sm"><Layers size={15} /></span>Click card to reveal answer</span>
                          </span>
                          <span className="flashcard-face flashcard-back border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-7">
                            <span className="mb-5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-violet-700">Answer</span>
                            <span className="max-w-xl text-xl font-semibold leading-8 tracking-tight text-slate-800 sm:text-2xl">{flashcards[flashcardIndex].back}</span>
                            <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><span className="rounded-full bg-white p-2 shadow-sm"><Layers size={15} /></span>Click card to see question</span>
                          </span>
                        </button>
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={flashcardIndex === 0}
                          onClick={() => { setFlashcardIndex((index) => index - 1); setFlashcardRevealed(false); }}
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                        >Previous</button>
                        <p className="text-xs text-slate-400">Use active recall before revealing</p>
                        <button
                          type="button"
                          disabled={flashcardIndex === flashcards.length - 1}
                          onClick={() => { setFlashcardIndex((index) => index + 1); setFlashcardRevealed(false); }}
                          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40"
                        >Next card <ChevronRight className="ml-1 inline" size={15} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <EmptyState icon={Layers} title="Your flashcards will appear here" description="Add your material and generate a deck to start reviewing." />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {page === "tutor" && (
            <section className="space-y-6">
              <PageHeading
                eyebrow="YOUR PERSONAL AI TUTOR"
                title="Ask StudyPilot"
                description="Ask questions, explore difficult concepts, and learn step by step."
              />

              <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Brain size={22} />
                  </div>
                  <div>
                    <p className="font-semibold">Study Tutor</p>
                    <p className="text-xs text-slate-500">
                      Powered by Gemini
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {messages.length === 0 && (
                    <EmptyState
                      icon={MessageCircle}
                      title="What would you like to learn?"
                      description="Ask a question or choose a suggestion below."
                    />
                  )}

                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                          m.role === "user"
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 bg-white text-slate-700 shadow-sm"
                        }`}
                      >
                        {m.role === "assistant" ? <StudyMarkdown>{m.text}</StudyMarkdown> : m.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[
                      "Explain a difficult concept",
                      "Give me a real-world example",
                      "Help me revise a topic",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setQuestion(suggestion)}
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={handleChat} className="flex gap-2">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask your study question..."
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                      required
                    />
                    <button
                      disabled={loading || !question.trim()}
                      className="rounded-xl bg-blue-600 px-4 text-white hover:bg-blue-700"
                      aria-label="Send question"
                    >
                      {loading ? (
                        <LoaderCircle className="animate-spin" size={20} />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}
        </main>
        <footer className="mx-auto flex max-w-7xl flex-col gap-1 border-t border-slate-200/80 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-9">
          <span>Mani Pavan - 24BCE2519</span>
          <span>Artificial Intelligence Case Study</span>
        </footer>
      </div>
    </div>
  );
}

function Dashboard({ stats, accuracy, navigate }) {
  const cards = [
    { label: "Summaries created", value: stats.summaries, icon: FileText, color: "blue" },
    { label: "Quizzes completed", value: stats.quizzes, icon: Brain, color: "violet" },
    { label: "Questions answered", value: stats.answered, icon: Target, color: "amber" },
    { label: "Quiz accuracy", value: `${accuracy}%`, icon: CheckCircle2, color: "emerald" },
  ];

  const features = [
    {
      id: "summarizer",
      icon: FileText,
      title: "Summarize your notes",
      description: "Turn long study material into clear revision notes.",
      action: "Create summary",
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "quiz",
      icon: Brain,
      title: "Practice with AI quizzes",
      description: "Test your knowledge with personalized MCQs.",
      action: "Start a quiz",
      color: "bg-violet-50 text-violet-600",
    },
    {
      id: "flashcards",
      icon: Layers,
      title: "Review with flashcards",
      description: "Build an active recall deck from your study material.",
      action: "Create flashcards",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      id: "tutor",
      icon: MessageCircle,
      title: "Ask your AI tutor",
      description: "Understand challenging concepts with explanations.",
      action: "Ask a question",
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 p-7 text-white md:p-10">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">
            <Sparkles size={14} /> YOUR AI-POWERED LEARNING SPACE
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Make every study session count.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 md:text-base">
            Summarize notes, create practice quizzes, and understand difficult
            concepts with your personal AI study partner.
          </p>
          <button
            onClick={() => navigate("summarizer")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Start learning <ChevronRight size={17} />
          </button>
        </div>
        <GraduationCap
          className="absolute -bottom-8 -right-4 hidden text-white/10 sm:block"
          size={210}
        />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold">Your study overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your learning activity on this device.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{label}</p>
              <span className={`rounded-xl p-2 ${{
                blue: "bg-blue-50 text-blue-600",
                violet: "bg-violet-50 text-violet-600",
                amber: "bg-amber-50 text-amber-600",
                emerald: "bg-emerald-50 text-emerald-600",
              }[color]}`}>
                  <Icon size={19} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold">Your learning tools</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a tool to get started.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {features.map(({ id, icon: Icon, title, description, action, color }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span className={`inline-flex rounded-xl p-3 ${color}`}>
                <Icon size={22} />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                {action} <ChevronRight size={16} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
            <Clock3 size={21} />
          </div>
          <div>
            <h2 className="font-semibold">A small tip for today</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Try active recall: study a concept, hide your notes, and answer
              practice questions from memory.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

async function extractStudyFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a file smaller than 10 MB.");
  }

  let text;
  if (["txt", "md"].includes(extension)) {
    text = await file.text();
  } else if (extension === "docx") {
    const mammoth = (await import("mammoth/mammoth.browser")).default;
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    text = result.value;
  } else if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = await Promise.all(
      Array.from({ length: document.numPages }, async (_, index) => {
        const page = await document.getPage(index + 1);
        const content = await page.getTextContent();
        return content.items.map((item) => item.str).join(" ");
      })
    );
    text = pages.join("\n\n");
  } else {
    throw new Error("Use a PDF, DOCX, TXT, or Markdown file.");
  }

  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 20) {
    throw new Error("No readable study text found. Scanned PDFs need OCR before upload.");
  }
  if (cleaned.length > 30000) {
    throw new Error("This file has more than 30,000 characters. Upload a shorter section.");
  }
  return cleaned;
}

function SampleMaterials({ onSelect, onError }) {
  const [fileName, setFileName] = useState("");
  const [readingFile, setReadingFile] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setReadingFile(true);
    onError("");
    try {
      const text = await extractStudyFile(file);
      onSelect(text);
      setFileName(file.name);
    } catch (error) {
      setFileName("");
      onError(error.message || "Could not read this file.");
    } finally {
      setReadingFile(false);
    }
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <BookOpen size={16} className="text-blue-600" />
        Try a sample study resource
      </div>
      <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-blue-300 bg-white px-3 py-3 transition hover:border-blue-500 hover:bg-blue-50">
        <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Upload size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-slate-700">
            {readingFile ? "Reading file..." : fileName || "Choose a file to add"}
          </span>
          <span className="block text-xs text-slate-500">PDF, DOCX, TXT, or MD · up to 10 MB</span>
        </span>
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          onChange={handleFile}
          disabled={readingFile}
          className="sr-only"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {sampleMaterials.map((sample) => (
          <button
            key={sample.title}
            type="button"
            onClick={() => onSelect(sample.text)}
            className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-left transition hover:border-blue-400 hover:bg-blue-50"
          >
            <span className="block text-sm font-medium text-slate-700">{sample.title}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{sample.subject}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Choose a file or sample to fill the study material box, then create your study resource.</p>
    </div>
  );
}

function PageHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-widest text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function PrimaryButton({ children, loading = false, icon: Icon, onClick }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      disabled={loading}
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
    >
      {loading ? (
        <LoaderCircle size={18} className="animate-spin" />
      ) : (
        <Icon size={18} />
      )}
      {loading ? "Working..." : children}
    </button>
  );
}

function StudyMarkdown({ children }) {
  return (
    <div className="space-y-4 text-sm leading-7 text-slate-700 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-slate-900 [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-slate-100 [&_h2]:pb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-slate-800 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_li::marker]:text-blue-500 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

function ResultPanel({ title, subtitle, children }) {
  return (
    <div className="min-h-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white px-6 py-5">
        <div className="rounded-xl bg-white p-2.5 text-blue-600 shadow-sm ring-1 ring-blue-100"><BookOpen size={19} /></div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">Study notes</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center py-8 text-center">
      <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
        <Icon size={25} />
      </div>
      <p className="mt-4 font-semibold text-slate-800">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default App;
