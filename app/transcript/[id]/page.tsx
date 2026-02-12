"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  User,
  Calendar,
  Check,
  Circle,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  useTranscriptContext,
  type ActionItem,
  type Transcript as TranscriptType,
} from "@/context/TranscriptContext";
import { PRIORITY_OPTIONS, type PriorityTag } from "@/lib/actionTags";

type TranscriptDoc = TranscriptType;

type FilterStatus = "all" | "open" | "done";


export default function TranscriptDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [transcript, setTranscript] = useState<TranscriptDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const [addTask, setAddTask] = useState("");
  const [addOwner, setAddOwner] = useState("");
  const [addDueDate, setAddDueDate] = useState("");
  const [addPriority, setAddPriority] = useState<PriorityTag | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTask, setEditTask] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState<PriorityTag | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const { getTranscriptById, updateTranscriptInContext } = useTranscriptContext();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("transcript-theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const fromContext = getTranscriptById(id);
    if (fromContext) {
      setTranscript(fromContext);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    async function fetchTranscript() {
      try {
        const res = await fetch(`/api/transcript/${id}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load");
          setTranscript(null);
          return;
        }
        setTranscript(data);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Network error");
          setTranscript(null);
        }
      } finally {
        if (!cancelled) setLoading(false);    
      }
    }
    fetchTranscript();
    return () => { cancelled = true; };
  }, [id, getTranscriptById]);

  async function patchTranscript(updates: { text?: string; actions?: ActionItem[] }) {
    if (!id || !transcript) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/transcript/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        setTranscript(data);
        updateTranscriptInContext(id, data);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleAddAction(e: React.FormEvent) {
    e.preventDefault();
    if (!transcript || !addTask.trim()) return;
    const newAction: ActionItem = {
      task: addTask.trim(),
      owner: addOwner.trim() || null,
      dueDate: addDueDate.trim() || null,
      status: "open",
      priority: addPriority,
    };
    patchTranscript({ actions: [...transcript.actions, newAction] });
    setAddTask("");
    setAddOwner("");
    setAddDueDate("");
    setAddPriority(null);
  }

  function handleUpdateAction(index: number) {
    if (!transcript || !editTask.trim()) return;
    const updated = [...transcript.actions];
    updated[index] = {
      ...updated[index],
      task: editTask.trim(),
      owner: editOwner.trim() || null,
      dueDate: editDueDate.trim() || null,
      priority: editPriority,
    };
    patchTranscript({ actions: updated });
    setEditingIndex(null);
  }

  function handleDeleteAction(index: number) {
    if (!transcript) return;
    const updated = transcript.actions.filter((_, i) => i !== index);
    patchTranscript({ actions: updated });
    setEditingIndex(null);
  }

  function handleToggleStatus(index: number) {
    if (!transcript) return;
    const updated = transcript.actions.map((a, i) =>
      i === index
        ? { ...a, status: (a.status === "done" ? "open" : "done") as "open" | "done" }
        : a
    );
    patchTranscript({ actions: updated });
  }

  function startEdit(index: number) {
    const a = transcript?.actions[index];
    if (!a) return;
    setEditTask(a.task);
    setEditOwner(a.owner ?? "");
    setEditDueDate(a.dueDate ?? "");
    setEditPriority((a.priority as PriorityTag) ?? null);
    setEditingIndex(index);
  }

  const filteredWithIndex = transcript?.actions
    .map((action, i) => ({ action, index: i }))
    .filter(({ action: a }) => {
      if (filter === "all") return true;
      if (filter === "open") return a.status === "open";
      return a.status === "done";
    }) ?? [];

  const isDark = theme === "dark";

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (error || !transcript) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-4 p-4">
        <p className={cn("text-lg", isDark ? "text-slate-300" : "text-slate-700")}>
          {error ?? "Transcript not found"}
        </p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <main className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-medium transition-colors",
              isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to history
          </Link>
          {saving && (
            <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
              Saving…
            </span>
          )}
        </div>

        {/* Full transcript text */}
        <Card
          className={cn(
            "mb-8 border-0 shadow-xl",
            isDark ? "bg-slate-900/80" : "bg-white/90"
          )}
        >
          <CardHeader>
            <CardTitle className={cn("text-lg", isDark ? "text-slate-100" : "text-slate-900")}>
              Transcript
            </CardTitle>
            <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
              {new Date(transcript.createdAt).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            <pre
              className={cn(
                "whitespace-pre-wrap font-sans text-sm leading-relaxed rounded-lg p-4 border",
                isDark
                  ? "bg-slate-950/50 border-slate-700/50 text-slate-200"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              )}
            >
              {transcript.text}
            </pre>
          </CardContent>
        </Card>

        {/* Action items section */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <h2 className={cn("text-xl font-bold", isDark ? "text-slate-100" : "text-slate-900")}>
            Action items
          </h2>
          <div className="flex rounded-lg border p-0.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            {(["all", "open", "done"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors",
                  filter === f
                    ? isDark
                      ? "bg-slate-700 text-white"
                      : "bg-white text-slate-900 shadow-sm"
                    : isDark
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-3 mb-8">
          {filteredWithIndex.length === 0 ? (
            <div
              className={cn(
                "rounded-xl border py-8 text-center text-sm",
                isDark ? "border-slate-700/50 text-slate-400" : "border-slate-200 text-slate-500"
              )}
            >
              {filter === "all"
                ? "No action items yet. Add one below."
                : `No ${filter} items.`}
            </div>
          ) : (
            filteredWithIndex.map(({ action, index: globalIndex }) => {
              const isEditing = editingIndex === globalIndex;
              const priorityOpt = action.priority ? PRIORITY_OPTIONS.find((o) => o.value === action.priority) : null;

              return (
                <Card
                  key={globalIndex}
                  className={cn(
                    "border transition-all",
                    isDark
                      ? "bg-slate-900/40 border-slate-700/30"
                      : "bg-white/80 border-slate-200/50"
                  )}
                >
                  <CardContent className="pt-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={editTask}
                          onChange={(e) => setEditTask(e.target.value)}
                          placeholder="Task"
                          className={cn(
                            "w-full rounded-md border px-3 py-2 text-sm",
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-100"
                              : "bg-white border-slate-300 text-slate-900"
                          )}
                        />
                        <input
                          value={editOwner}
                          onChange={(e) => setEditOwner(e.target.value)}
                          placeholder="Owner"
                          className={cn(
                            "w-full rounded-md border px-3 py-2 text-sm",
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-100"
                              : "bg-white border-slate-300 text-slate-900"
                          )}
                        />
                        <input
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          placeholder="Due date (YYYY-MM-DD)"
                          className={cn(
                            "w-full rounded-md border px-3 py-2 text-sm",
                            isDark
                              ? "bg-slate-800 border-slate-600 text-slate-100"
                              : "bg-white border-slate-300 text-slate-900"
                          )}
                        />
                        <div className="space-y-1.5">
                          <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Priority</p>
                          <div className="flex flex-wrap gap-1.5">
                            {PRIORITY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setEditPriority(editPriority === opt.value ? null : opt.value)}
                                className={cn(
                                  "rounded-md border px-2 py-1 text-xs font-medium transition-opacity",
                                  opt.className,
                                  editPriority === opt.value ? `ring-2 ring-offset-2 ring-cyan-500 ${isDark ? "ring-offset-slate-950" : "ring-offset-white"}` : "opacity-70 hover:opacity-100"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateAction(globalIndex)}
                            disabled={saving || !editTask.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingIndex(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(globalIndex)}
                          className="mt-0.5 shrink-0 rounded p-0.5 transition-colors hover:opacity-80"
                          title={action.status === "open" ? "Mark done" : "Mark open"}
                        >
                          {action.status === "done" ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "font-medium",
                              action.status === "done"
                                ? "line-through opacity-70"
                                : "",
                              isDark ? "text-slate-100" : "text-slate-900"
                            )}
                          >
                            {action.task}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            {action.owner && (
                              <span className={cn("inline-flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-600")}>
                                <User className="w-3 h-3" />
                                {action.owner}
                              </span>
                            )}
                            {action.dueDate && (
                              <span className={cn("inline-flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-600")}>
                                <Calendar className="w-3 h-3" />
                                {action.dueDate}
                              </span>
                            )}
                          </div>
                          {priorityOpt && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", priorityOpt.className)}>
                                {priorityOpt.label}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEdit(globalIndex)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => handleDeleteAction(globalIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Add new action */}
        <Card className={cn("border", isDark ? "bg-slate-900/40 border-slate-700/30" : "bg-slate-50/80 border-slate-200")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2 text-base", isDark ? "text-slate-100" : "text-slate-900")}>
              <Plus className="w-4 h-4" />
              Add action item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAction} className="space-y-3">
              <input
                value={addTask}
                onChange={(e) => setAddTask(e.target.value)}
                placeholder="Task description"
                required
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-sm",
                  isDark
                    ? "bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
                    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={addOwner}
                  onChange={(e) => setAddOwner(e.target.value)}
                  placeholder="Owner"
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-sm",
                    isDark
                      ? "bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  )}
                />
                <input
                  value={addDueDate}
                  onChange={(e) => setAddDueDate(e.target.value)}
                  placeholder="Due date (YYYY-MM-DD)"
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-sm",
                    isDark
                      ? "bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-500")}>Priority</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAddPriority(addPriority === opt.value ? null : opt.value)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-medium transition-opacity",
                        opt.className,
                        addPriority === opt.value ? `ring-2 ring-offset-2 ring-cyan-500 ${isDark ? "ring-offset-slate-950" : "ring-offset-white"}` : "opacity-70 hover:opacity-100"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={saving || !addTask.trim()} className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
