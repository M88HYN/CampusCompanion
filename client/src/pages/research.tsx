import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText, Download, Bookmark, BookmarkCheck, Lightbulb, Plus, Trash2, Loader2, StickyNote, BookOpen, HelpCircle, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  messages?: Message[];
}

const QUICK_PROMPTS = [
  { label: "Explain Concept", prompt: "Explain this concept:", responseType: "explanation" as const },
  { label: "Summarize", prompt: "Summarize this topic:", responseType: "summary" as const },
  { label: "Compare & Contrast", prompt: "Compare and contrast:", responseType: "comparison" as const },
  { label: "Real-world Examples", prompt: "Show real-world applications of:", responseType: "examples" as const },
  { label: "Study Tips", prompt: "How should I study:", responseType: "study_tips" as const },
  { label: "Common Mistakes", prompt: "What are common mistakes with:", responseType: "mistakes" as const },
];

export default function Research() {
  const [input, setInput] = useState("");
  const [searchDepth, setSearchDepth] = useState<"quick" | "balanced" | "comprehensive">("balanced");
  const [responseType, setResponseType] = useState<"explanation" | "summary" | "comparison" | "analysis" | "examples" | "study_tips" | "mistakes">("explanation");
  const [savedMessages, setSavedMessages] = useState<number[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/research/conversations"],
  });

  const { data: currentConversation } = useQuery<Conversation>({
    queryKey: ["/api/research/conversations", currentConversationId],
    enabled: !!currentConversationId,
  });

  const messages = currentConversation?.messages || [];

  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/research/conversations", { title });
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/research/conversations"] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/research/conversations/${id}`);
    },
    onSuccess: () => {
      if (currentConversationId) {
        setCurrentConversationId(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/research/conversations"] });
    },
  });

  const saveToNotesMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/notes", {
        title: data.title,
        blocks: [{ type: "markdown", content: data.content }],
      });
      return res.json();
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ 
        title: "Saved to Notes", 
        description: "Research insight has been saved as a new note.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save to notes", variant: "destructive" });
    },
  });

  const handleCopyToClipboard = async (content: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast({ title: "Copied!", description: "Content copied to clipboard." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy to clipboard", variant: "destructive" });
    }
  };

  const handleSaveToNotes = (content: string) => {
    const title = content.split("\n")[0]?.substring(0, 50) || "Research Insight";
    saveToNotesMutation.mutate({ title, content });
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const query = input.trim();
    setInput("");
    setStreamingContent("");
    setIsStreaming(true);
    
    let receivedConversationId: number | null = null;
    let fullContent = "";

    try {
      const response = await fetch("/api/research/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          searchDepth,
          responseType,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send query");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
                if (data.done && data.conversationId) {
                  receivedConversationId = data.conversationId;
                }
                if (data.error) {
                  toast({
                    title: "Error",
                    description: data.error,
                    variant: "destructive",
                  });
                }
              } catch (e) {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }
      }
      
      // Update conversation ID and invalidate queries after stream completes
      if (receivedConversationId) {
        setCurrentConversationId(receivedConversationId);
        await queryClient.invalidateQueries({ queryKey: ["/api/research/conversations"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/research/conversations", receivedConversationId] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your research query",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      // Only clear streaming content after queries are invalidated
      setTimeout(() => setStreamingContent(""), 100);
    }
  };

  const toggleSaveMessage = (messageId: number) => {
    setSavedMessages((prev) => {
      if (prev.includes(messageId)) {
        return prev.filter((id) => id !== messageId);
      } else {
        return [...prev, messageId];
      }
    });
  };

  const isSaved = (messageId: number) => savedMessages.includes(messageId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const allMessages = [...messages];
  if (isStreaming && streamingContent) {
    allMessages.push({
      id: -1,
      conversationId: currentConversationId || 0,
      role: "assistant",
      content: streamingContent,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
      <div className="border-b bg-white dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Insight Scout</h1>
                <p className="text-sm text-muted-foreground">AI-powered research assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentConversationId(null);
                  createConversationMutation.mutate("New Research");
                }}
                data-testid="button-new-conversation"
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
              {currentConversationId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteConversationMutation.mutate(currentConversationId)}
                  data-testid="button-delete-conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {conversations.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {conversations.slice(0, 5).map((conv) => (
                <Button
                  key={conv.id}
                  variant={currentConversationId === conv.id ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setCurrentConversationId(conv.id)}
                  data-testid={`button-conversation-${conv.id}`}
                >
                  {conv.title.length > 20 ? conv.title.substring(0, 20) + "..." : conv.title}
                </Button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Search Depth</label>
              <Select value={searchDepth} onValueChange={(v) => setSearchDepth(v as typeof searchDepth)}>
                <SelectTrigger className="h-8 text-xs border-orange-300 dark:border-orange-700" data-testid="select-search-depth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Response Type</label>
              <Select value={responseType} onValueChange={(v) => setResponseType(v as typeof responseType)}>
                <SelectTrigger className="h-8 text-xs border-orange-300 dark:border-orange-700" data-testid="select-response-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="explanation">Explanation</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="examples">Real-World Examples</SelectItem>
                  <SelectItem value="study_tips">Study Tips</SelectItem>
                  <SelectItem value="mistakes">Common Mistakes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tip</label>
              <div className="h-8 px-3 rounded-md border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 flex items-center gap-2">
                <Lightbulb className="h-3 w-3 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <p className="text-xs text-orange-600 dark:text-orange-300 truncate">Ask specific questions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {allMessages.length === 0 && !isStreaming && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Welcome to Insight Scout</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ask me anything about your studies! I can explain concepts, summarize topics, 
                compare ideas, and help you understand complex subjects.
              </p>
            </div>
          )}

          {allMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 group ${message.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${message.id}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs">
                    IS
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col gap-2 max-w-2xl ${message.role === "user" ? "items-end" : "items-start"}`}>
                <Card className={`p-4 ${message.role === "user" ? "bg-orange-500 text-white" : "bg-white dark:bg-slate-800"}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  {message.id === -1 && (
                    <span className="inline-block w-2 h-4 bg-orange-500 animate-pulse ml-1" />
                  )}
                </Card>
                {message.role === "assistant" && message.id !== -1 && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyToClipboard(message.content, message.id)}
                          data-testid={`button-copy-${message.id}`}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy to clipboard</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleSaveToNotes(message.content)}
                          data-testid={`button-save-note-${message.id}`}
                        >
                          <StickyNote className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save to Notes</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleSaveMessage(message.id)}
                          data-testid={`button-bookmark-${message.id}`}
                        >
                          {isSaved(message.id) ? (
                            <BookmarkCheck className="h-3.5 w-3.5 text-orange-500" />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isSaved(message.id) ? "Bookmarked" : "Bookmark"}</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-slate-300 dark:bg-slate-600">You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your studies..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isStreaming}
              className="border-2 border-orange-300 dark:border-orange-700 focus-visible:ring-orange-500"
              data-testid="input-research-question"
            />
            <Button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="button-send-message"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quick Prompts:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
                  onClick={() => {
                    setResponseType(prompt.responseType);
                    setInput(input ? input + " " + prompt.prompt : prompt.prompt + " ");
                  }}
                  disabled={isStreaming}
                  data-testid={`button-quick-prompt-${idx}`}
                >
                  {prompt.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground max-w-4xl mx-auto">
            Powered by Replit AI. Responses are educational and should be verified for academic work.
          </p>
        </div>
      </div>
    </div>
  );
}
