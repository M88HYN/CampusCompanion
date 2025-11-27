import { useState } from "react";
import { Send, Sparkles, FileText, Download, Bookmark, BookmarkCheck, Lightbulb, Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  savedAt?: number;
}

const QUICK_PROMPTS = [
  { label: "Explain Concept", prompt: "Explain this concept in simple terms" },
  { label: "Summarize", prompt: "Give me a concise summary of" },
  { label: "Compare & Contrast", prompt: "Compare and contrast" },
  { label: "Real-world Examples", prompt: "Give real-world examples of" },
  { label: "Study Tips", prompt: "How should I study" },
  { label: "Common Mistakes", prompt: "What are common mistakes with" },
];

export default function Research() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI research assistant. I can help you with understanding complex topics, summarizing research, and answering academic questions. What would you like to explore today?",
    },
    {
      id: "2",
      role: "user",
      content: "Can you explain quantum entanglement in simple terms?",
    },
    {
      id: "3",
      role: "assistant",
      content: "Quantum entanglement is a phenomenon where two or more particles become connected in such a way that the quantum state of one particle cannot be described independently of the others, even when separated by large distances.\n\nThink of it like this: imagine you have a pair of magic coins. When you flip one and it lands on heads, the other coin instantly becomes tails, no matter how far apart they are. This 'spooky action at a distance' (as Einstein called it) is what makes quantum entanglement so fascinating and important for quantum computing.",
      sources: ["Wikipedia: Quantum Entanglement", "Stanford Encyclopedia of Philosophy"],
    },
  ]);
  const [input, setInput] = useState("");
  const [searchDepth, setSearchDepth] = useState("balanced");
  const [responseType, setResponseType] = useState("explanation");
  const [savedMessages, setSavedMessages] = useState<string[]>();

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages([...messages, userMessage]);
    setInput("");

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Research on "${input}":\n\nThis response uses ${responseType} format with ${searchDepth} search depth. The AI would analyze multiple sources and provide comprehensive insights tailored to your needs.`,
        sources: ["Academic Database 1", "Research Journal 2", "Expert Analysis 3"],
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const toggleSaveMessage = (messageId: string) => {
    setSavedMessages((prev) => {
      const updated = prev ? [...prev] : [];
      if (updated.includes(messageId)) {
        return updated.filter((id) => id !== messageId);
      } else {
        return [...updated, messageId];
      }
    });
  };

  const isSaved = (messageId: string) => savedMessages?.includes(messageId) || false;

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
      <div className="border-b bg-white dark:bg-slate-900 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Insight Scout</h1>
                <p className="text-sm text-muted-foreground">Your AI research assistant</p>
              </div>
            </div>
            <Button variant="outline" size="sm" data-testid="button-export-conversation">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Search Depth</label>
              <Select value={searchDepth} onValueChange={setSearchDepth}>
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
              <Select value={responseType} onValueChange={setResponseType}>
                <SelectTrigger className="h-8 text-xs border-orange-300 dark:border-orange-700" data-testid="select-response-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="explanation">Explanation</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tip</label>
              <div className="h-8 px-3 rounded-md border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 flex items-center gap-2">
                <Lightbulb className="h-3 w-3 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <p className="text-xs text-orange-600 dark:text-orange-300 truncate">Use specific keywords</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {messages.map((message) => (
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
                </Card>
                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((source, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="gap-1 text-xs border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                        data-testid={`source-${index}`}
                      >
                        <FileText className="h-3 w-3" />
                        {source}
                      </Badge>
                    ))}
                  </div>
                )}
                {message.role === "assistant" && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSaveMessage(message.id)}
                      data-testid={`button-save-${message.id}`}
                    >
                      {isSaved(message.id) ? (
                        <BookmarkCheck className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarFallback className="bg-slate-300 dark:bg-slate-600">JD</AvatarFallback>
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
              className="border-2 border-orange-300 dark:border-orange-700 focus-visible:ring-orange-500"
              data-testid="input-research-question"
            />
            <Button
              onClick={handleSend}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
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
                  onClick={() => setInput(input ? input + " - " + prompt.prompt : prompt.prompt)}
                  data-testid={`button-quick-prompt-${idx}`}
                >
                  {prompt.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground max-w-4xl mx-auto">
            AI can make mistakes. Always verify important information before using it for your studies.
          </p>
        </div>
      </div>
    </div>
  );
}
