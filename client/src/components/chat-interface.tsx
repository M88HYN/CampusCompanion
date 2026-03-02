/*
==========================================================
File: client/src/components/chat-interface.tsx

Module: Insight Scout and Research

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Presentation Layer (Frontend UI)

System Interaction:
- Consumes API endpoints via query/mutation utilities and renders user-facing interfaces
- Collaborates with shared types to preserve frontend-backend contract integrity

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, MessageCircle, Lightbulb, Copy, Check } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SuggestedPrompt {
  icon: string;
  label: string;
  prompt: string;
}

export const suggestedPrompts: SuggestedPrompt[] = [
  {
    icon: "💡",
    label: "Explain",
    prompt: "Explain this concept in simple terms",
  },
  {
    icon: "🤔",
    label: "Example",
    prompt: "Give me a real-world example of this",
  },
  {
    icon: "🎯",
    label: "Key Points",
    prompt: "What are the key points I should remember?",
  },
  {
    icon: "❓",
    label: "Compare",
    prompt: "How does this compare to related concepts?",
  },
];

interface ChatBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
}

/*
----------------------------------------------------------
Component: ChatBubble

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- message: Input consumed by this routine during execution
- isTyping: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
export function ChatBubble({ message, isTyping }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

    /*
  ----------------------------------------------------------
  Function: handleCopy

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? "bg-emerald-500 text-white rounded-br-none"
            : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-bl-none"
        }`}
      >
        {isTyping ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            {!isUser && (
              <button
                onClick={handleCopy}
                className="mt-2 text-xs opacity-75 hover:opacity-100 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  onSaveToNotes?: (message: string) => void;
}

/*
----------------------------------------------------------
Component: ChatInterface

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- messages: Input consumed by this routine during execution
- onSendMessage: Input consumed by this routine during execution
- isLoading: Input consumed by this routine during execution
- onSaveToNotes: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
export function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  onSaveToNotes,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

    /*
  ----------------------------------------------------------
  Function: handleSubmit

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - e: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

    /*
  ----------------------------------------------------------
  Function: handleSuggestedPrompt

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - prompt: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSuggestedPrompt = (prompt: string) => {
    onSendMessage(prompt);
    setInput("");
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Insight Scout
        </CardTitle>
        <CardDescription>
          Ask AI for explanations, examples, and clarifications
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Lightbulb className="h-12 w-12 text-amber-400 mb-4 opacity-50" />
            <h3 className="font-semibold text-muted-foreground mb-2">
              No messages yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Ask a question to get started
            </p>

            <div className="space-y-2 w-full">
              <p className="text-xs font-semibold text-muted-foreground mb-3">
                Try these:
              </p>
              {suggestedPrompts.map((prompt) => (
                <Button
                  key={prompt.label}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleSuggestedPrompt(prompt.prompt)}
                >
                  <span className="mr-2">{prompt.icon}</span>
                  {prompt.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <ChatBubble
                message={{
                  id: "typing",
                  role: "assistant",
                  content: "",
                  timestamp: new Date(),
                }}
                isTyping
              />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <div className="p-4 border-t space-y-3">
        {!messages.length && (
          <div className="flex gap-2 flex-wrap">
            {suggestedPrompts.map((prompt) => (
              <Badge
                key={prompt.label}
                variant="secondary"
                className="cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600"
                onClick={() => handleSuggestedPrompt(prompt.prompt)}
              >
                {prompt.icon} {prompt.label}
              </Badge>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const lastMessage = messages[messages.length - 1];
              if (lastMessage.role === "assistant" && onSaveToNotes) {
                onSaveToNotes(lastMessage.content);
              }
            }}
            className="w-full"
          >
            Save Last Response to Notes
          </Button>
        )}
      </div>
    </Card>
  );
}
