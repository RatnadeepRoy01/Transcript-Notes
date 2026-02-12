"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import type { PriorityTag } from "@/lib/actionTags";

export type ActionItem = {
  task: string;
  owner: string | null;
  dueDate: string | null;
  status?: "open" | "done";
  priority?: PriorityTag | null;
};

export type Transcript = {
  _id: string;
  text: string;
  actions: ActionItem[];
  createdAt: string;
};

type TranscriptContextValue = {
  transcripts: Transcript[];
  setTranscripts: React.Dispatch<React.SetStateAction<Transcript[]>>;
  getTranscriptById: (id: string) => Transcript | undefined;
  updateTranscriptInContext: (id: string, updated: Transcript) => void;
};

const TranscriptContext = createContext<TranscriptContextValue | null>(null);

export function TranscriptProvider({ children }: { children: ReactNode }) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);

  const getTranscriptById = useCallback(
    (id: string) => transcripts.find((t) => t._id === id),
    [transcripts]
  );

  const updateTranscriptInContext = useCallback(
    (id: string, updated: Transcript) => {
      setTranscripts((prev) =>
        prev.map((t) => (t._id === id ? updated : t))
      );
    },
    []
  );

  return (
    <TranscriptContext.Provider
      value={{
        transcripts,
        setTranscripts,
        getTranscriptById,
        updateTranscriptInContext,
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
}

export function useTranscriptContext() {
  const ctx = useContext(TranscriptContext);
  if (!ctx) {
    throw new Error("useTranscriptContext must be used within TranscriptProvider");
  }
  return ctx;
}
