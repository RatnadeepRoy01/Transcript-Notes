"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Server, Database, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatusCheck = {
  status: "ok" | "error";
  message?: string;
};

type StatusResponse = {
  backend: StatusCheck;
  database: StatusCheck;
  llm: StatusCheck;
};

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

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
    let cancelled = false;
    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        const json = await res.json();
        if (!cancelled) {
          setData({
            backend: res.ok ? { status: "ok" } : { status: "error", message: json.error ?? "Request failed" },
            database: json.database ?? { status: "error", message: "Unknown" },
            llm: json.llm ?? { status: "error", message: "Unknown" },
          });
        }
      } catch (err) {
        if (!cancelled) {
          setData({
            backend: { status: "error", message: err instanceof Error ? err.message : "Network error" },
            database: { status: "error", message: "Not reached" },
            llm: { status: "error", message: "Not reached" },
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStatus();
    return () => { cancelled = true; };
  }, []);

  const isDark = theme === "dark";

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <main className="relative mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className={cn(
            "inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors",
            isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className={cn("text-2xl font-bold mb-2", isDark ? "text-slate-100" : "text-slate-900")}>
          System status
        </h1>
        <p className={cn("text-sm mb-8", isDark ? "text-slate-400" : "text-slate-500")}>
          Backend, database, and LLM connection health.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className={cn("w-8 h-8 animate-spin", isDark ? "text-slate-400" : "text-slate-500")} />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <StatusCard
              isDark={isDark}
              title="Backend"
              description="API server"
              check={data.backend}
              icon={Server}
            />
            <StatusCard
              isDark={isDark}
              title="Database"
              description="MongoDB connection"
              check={data.database}
              icon={Database}
            />
            <StatusCard
              isDark={isDark}
              title="LLM"
              description="Google Gemini"
              check={data.llm}
              icon={Sparkles}
            />
          </div>
        ) : (
          <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
            Could not load status.
          </p>
        )}
      </main>
    </div>
  );
}

function StatusCard({
  isDark,
  title,
  description,
  check,
  icon: Icon,
}: {
  isDark: boolean;
  title: string;
  description: string;
  check: StatusCheck;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const ok = check.status === "ok";
  return (
    <Card className={cn("border", isDark ? "bg-slate-900/40 border-slate-700/30" : "bg-white border-slate-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isDark ? "bg-slate-800/50" : "bg-slate-100")}>
              <Icon className={cn("w-5 h-5", isDark ? "text-slate-300" : "text-slate-600")} />
            </div>
            <div>
              <CardTitle className={cn("text-base", isDark ? "text-slate-100" : "text-slate-900")}>
                {title}
              </CardTitle>
              <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                {description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ok ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <span className={cn("text-sm font-medium", ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
              {ok ? "Healthy" : "Error"}
            </span>
          </div>
        </div>
      </CardHeader>
      {!ok && check.message && (
        <CardContent className="pt-0">
          <p className={cn("text-xs rounded-md px-3 py-2", isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-700")}>
            {check.message}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
