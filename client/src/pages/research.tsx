import { useState } from "react";
import { Send, Sparkles, FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

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
        content: "This is a sample response. In the full application, this would be powered by AI to provide detailed research assistance.",
        sources: ["Sample Source 1", "Sample Source 2"],
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">AI Research Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by advanced AI</p>
            </div>
          </div>
          <Button variant="outline" size="sm" data-testid="button-export-conversation">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${message.id}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col gap-2 max-w-2xl ${message.role === "user" ? "items-end" : "items-start"}`}>
                <Card className={`p-4 ${message.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </Card>
                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((source, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="gap-1 text-xs"
                        data-testid={`source-${index}`}
                      >
                        <FileText className="h-3 w-3" />
                        {source}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
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
            data-testid="input-research-question"
          />
          <Button onClick={handleSend} data-testid="button-send-message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2 max-w-4xl mx-auto">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
