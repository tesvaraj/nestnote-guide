// 🤖 AGENT: Chat and AI-related type definitions
// This file defines message structures and AI recommendation types

import { SavedResource } from "@/features/resources/types";

export interface Recommendation extends SavedResource {
  matchReason: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { id: string; page: number; text: string }[];
  recommendations?: Recommendation[];
}
