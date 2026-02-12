"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Check,
  Moon,
  Sun,
  History,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranscriptContext, type ActionItem } from "@/context/TranscriptContext";

export default function TranscriptGenerator() {
  const { transcripts, setTranscripts } = useTranscriptContext();
  const [inputText, setInputText] = useState("");
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("transcript-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  // Fetch history on page load and put into context
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (res.ok && Array.isArray(data.transcripts)) {
          setTranscripts(data.transcripts);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, [setTranscripts]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("transcript-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  async function handleGenerate() {
    setError(null);
    setActions([]);
    setLoading(true);

    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }

      setActions(Array.isArray(data.actions) ? data.actions : []);

      // Add the new transcript to context (already have it from POST response)
      setTranscripts((prev) => [
        { _id: data._id, text: data.text, actions: data.actions ?? [], createdAt: data.createdAt },
        ...prev,
      ]);
    } catch {
      setError("Network or server error");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-slate-950">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Light theme backgrounds */}
        {theme === "light" && (
          <>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 via-cyan-200/20 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-32 w-80 h-80 bg-gradient-to-tr from-violet-200/20 via-purple-200/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(203,213,225,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(203,213,225,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
          </>
        )}

        {/* Dark theme backgrounds */}
        {theme === "dark" && (
          <>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-32 w-80 h-80 bg-gradient-to-tr from-violet-500/15 via-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(71,85,105,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
          </>
        )}
      </div>

      <main className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        {/* Header with Theme Toggle */}
        <div className="flex items-center justify-between mb-16 animate-fade-in">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Link
              href="/status"
              className={`text-sm font-medium ${
                theme === "dark"
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Status
            </Link>
            <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-12 h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </Button>
          </div>
        </div>

        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-lg opacity-75 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                  : "bg-gradient-to-r from-blue-400 to-cyan-400"
              }`} />
              <div className={`relative rounded-full p-3.5 border ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-700/50"
                  : "bg-white border-slate-200/50"
              }`}>
                <Sparkles className={`w-6 h-6 ${
                  theme === "dark" ? "text-cyan-400" : "text-cyan-600"
                }`} />
              </div>
            </div>
          </div>

          <h1 className={`text-5xl sm:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent ${
            theme === "dark"
              ? "bg-gradient-to-r from-slate-100 via-blue-200 to-cyan-200"
              : "bg-gradient-to-r from-slate-900 via-blue-600 to-cyan-600"
          } leading-tight`}>
            Transcript Notes
          </h1>
          
          <p className={`text-lg max-w-lg mx-auto leading-relaxed ${
            theme === "dark" ? "text-slate-300" : "text-slate-600"
          }`}>
            Transform your meeting transcripts into actionable insights with AI-powered clarity
          </p>
        </div>

        {/* Steps Section - 2 per row */}
        <section className="mb-12 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className={`p-5 rounded-lg border transition-all duration-300 ${
              theme === "dark"
                ? "bg-slate-900/40 border-slate-700/30 hover:bg-slate-900/60"
                : "bg-white/50 border-slate-200/50 hover:bg-white/80"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg font-bold shrink-0 ${
                  theme === "dark"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-cyan-200/50 text-cyan-700"
                }`}>
                  1
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}>
                    Paste Transcript
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}>
                    Copy your meeting transcript and paste it into the text box.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-5 rounded-lg border transition-all duration-300 ${
              theme === "dark"
                ? "bg-slate-900/40 border-slate-700/30 hover:bg-slate-900/60"
                : "bg-white/50 border-slate-200/50 hover:bg-white/80"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg font-bold shrink-0 ${
                  theme === "dark"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-cyan-200/50 text-cyan-700"
                }`}>
                  2
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}>
                    Generate Action Items
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}>
                  Click &quot;Extract Action Items&quot; to process using AI and extract tasks.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-5 rounded-lg border transition-all duration-300 ${
              theme === "dark"
                ? "bg-slate-900/40 border-slate-700/30 hover:bg-slate-900/60"
                : "bg-white/50 border-slate-200/50 hover:bg-white/80"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg font-bold shrink-0 ${
                  theme === "dark"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-cyan-200/50 text-cyan-700"
                }`}>
                  3
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}>
                    View Action Items
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}>
                    See all tasks with owner, due date, and status information.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`p-5 rounded-lg border transition-all duration-300 ${
              theme === "dark"
                ? "bg-slate-900/40 border-slate-700/30 hover:bg-slate-900/60"
                : "bg-white/50 border-slate-200/50 hover:bg-white/80"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg font-bold shrink-0 ${
                  theme === "dark"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-cyan-200/50 text-cyan-700"
                }`}>
                  4
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}>
                    Edit / Add / Delete Tasks
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}>
                    Modify tasks as needed or add new ones manually.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className={`p-5 rounded-lg border transition-all duration-300 ${
              theme === "dark"
                ? "bg-slate-900/40 border-slate-700/30 hover:bg-slate-900/60"
                : "bg-white/50 border-slate-200/50 hover:bg-white/80"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg font-bold shrink-0 ${
                  theme === "dark"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-cyan-200/50 text-cyan-700"
                }`}>
                  5
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}>
                    Filter Tasks
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}>
                    Use filters to view all, open, or completed tasks.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className={`p-5 rounded-lg border transition-all duration-300 ${
              theme === "dark"
                ? "bg-slate-900/40 border-slate-700/30 hover:bg-slate-900/60"
                : "bg-white/50 border-slate-200/50 hover:bg-white/80"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg font-bold shrink-0 ${
                  theme === "dark"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-cyan-200/50 text-cyan-700"
                }`}>
                  6
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}>
                    Check History
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}>
                    Access the transcripts you processed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Input Card */}
        <div className="relative mb-8 animate-slide-up group" style={{ animationDelay: "0.1s" }}>
          <div className={`absolute inset-0 rounded-2xl blur-xl ${
            theme === "dark"
              ? "bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
              : "bg-gradient-to-br from-blue-200/20 to-cyan-200/20"
          }`} />
          
          <Card className={`relative border-0 shadow-xl overflow-hidden transition-all duration-300 ${
            theme === "dark"
              ? "bg-slate-900/80 backdrop-blur-xl hover:bg-slate-900/90"
              : "bg-white/80 backdrop-blur-xl hover:bg-white/95"
          }`}>
            {/* Top border glow */}
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent ${
              theme === "dark" ? "via-cyan-500/50" : "via-cyan-400/50"
            }`} />

            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${
                  theme === "dark"
                    ? "bg-slate-800/50 border-slate-700/50"
                    : "bg-slate-100/50 border-slate-200/50"
                }`}>
                  <ClipboardList className={`w-5 h-5 ${
                    theme === "dark" ? "text-cyan-400" : "text-cyan-600"
                  }`} />
                </div>
                <div>
                  <CardTitle className={theme === "dark" ? "text-slate-100" : "text-slate-900"}>
                    Paste Your Transcript
                  </CardTitle>
                  <CardDescription className={theme === "dark" ? "text-slate-400" : "text-slate-600"}>
                    Extract tasks, owners, and dates automatically
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="px-6 pb-6 space-y-4">
              {/* Textarea */}
              <Textarea
                placeholder="Paste your meeting transcript here... e.g. Alice: We need to ship the dashboard by Friday. Bob: I'll handle the API. Carol: I can do the design review by Wednesday…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading}
                className={`min-h-[240px] resize-y rounded-xl font-mono text-sm focus-visible:ring-cyan-500/50 focus-visible:ring-2 disabled:opacity-50 transition-all ${
                  theme === "dark"
                    ? "bg-slate-950/50 border-slate-700/50 text-slate-100 placeholder-slate-500 focus-visible:border-cyan-500/50"
                    : "bg-slate-50/50 border-slate-200/50 text-slate-900 placeholder-slate-400 focus-visible:border-cyan-400/50"
                }`}
              />

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !inputText.trim()}
                size="lg"
                className={`w-full gap-2 transition-all duration-300 font-semibold ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-lg hover:shadow-cyan-500/50"
                    : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-600/50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing transcript…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Extract Action Items
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <div className={`animate-slide-up rounded-xl backdrop-blur-xl p-5 flex items-start gap-4 mb-8 border ${
            theme === "dark"
              ? "bg-red-500/10 border-red-500/50"
              : "bg-red-100/50 border-red-300/50"
          }`}>
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              theme === "dark" ? "bg-red-500/20" : "bg-red-200/50"
            }`}>
              <AlertCircle className={`w-5 h-5 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm leading-relaxed ${
                theme === "dark" ? "text-red-300" : "text-red-700"
              }`}>{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && actions.length === 0 && !error && inputText.trim() && (
          <div className="text-center py-12 animate-fade-in">
            <p className={`text-lg mb-2 ${
              theme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}>
              No action items found
            </p>
            <p className={`text-sm ${
              theme === "dark" ? "text-slate-500" : "text-slate-500"
            }`}>
              Try a longer transcript or add clearer tasks and assignees
            </p>
          </div>
        )}

        {/* History Section */}
        <section className="mt-16 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg border ${
              theme === "dark"
                ? "bg-slate-800/50 border-slate-700/50"
                : "bg-slate-100/50 border-slate-200/50"
            }`}>
              <History className={`w-5 h-5 ${
                theme === "dark" ? "text-slate-300" : "text-slate-600"
              }`} />
            </div>
            <h2 className={`text-2xl font-bold ${
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}>
              History
            </h2>
          </div>

          {loadingHistory ? (
            <div className="text-center py-8">
              <Loader2 className={`w-6 h-6 animate-spin mx-auto ${
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              }`} />
            </div>
          ) : transcripts.length === 0 ? (
            <div className={`text-center py-8 rounded-xl border ${
              theme === "dark"
                ? "bg-slate-900/40 border-slate-700/30 text-slate-400"
                : "bg-slate-50/50 border-slate-200/50 text-slate-500"
            }`}>
              <p>No transcripts saved yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcripts.map((transcript) => (
                <Link key={transcript._id} href={`/transcript/${transcript._id}`}>
                  <Card
                    className={`border transition-all duration-300 cursor-pointer ${
                      theme === "dark"
                        ? "bg-slate-900/40 border-slate-700/30 hover:bg-slate-900/60"
                        : "bg-white/50 border-slate-200/50 hover:bg-white/80"
                    }`}
                  >
                    <CardHeader>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className={`w-4 h-4 ${
                            theme === "dark" ? "text-slate-400" : "text-slate-500"
                          }`} />
                          <span className={`text-xs ${
                            theme === "dark" ? "text-slate-400" : "text-slate-500"
                          }`}>
                            {new Date(transcript.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-sm line-clamp-2 ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}>
                          {transcript.text}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        theme === "dark"
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-cyan-200/50 text-cyan-700"
                      }`}>
                        {transcript.actions.length} {transcript.actions.length === 1 ? "action" : "actions"}
                      </span>
                    </div>
                    {transcript.actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/30 dark:border-slate-700/30">
                        <div className="space-y-2">
                          {transcript.actions.slice(0, 3).map((action, idx) => (
                            <div
                              key={idx}
                              className={`text-sm flex items-center gap-2 ${
                                theme === "dark" ? "text-slate-400" : "text-slate-600"
                              }`}
                            >
                              <Check className="w-3 h-3 shrink-0" />
                              <span className="line-clamp-1">{action.task}</span>
                            </div>
                          ))}
                          {transcript.actions.length > 3 && (
                            <p className={`text-xs italic ${
                              theme === "dark" ? "text-slate-500" : "text-slate-500"
                            }`}>
                              +{transcript.actions.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

    </div>
  );
}