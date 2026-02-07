import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Play, RotateCw, Upload, Trash2, Eye, EyeOff, Tags, Settings, Loader2, ArrowLeft, Search, Brain, Target, Zap, Clock, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, Keyboard, ChevronRight, Sparkles, BarChart3, BookOpen } from "lucide-react";
import { normalizeTags } from "@/lib/tag-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSoundEffect, useConfetti, useKeyboardShortcuts } from "@/hooks/use-ui-effects";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import type { Deck, Card as FlashCard } from "@shared/schema";

interface DeckWithStats extends Deck {
  cards: number;
  dueToday: number;
  mastered: number;
  learning?: number;
  new?: number;
}

interface DeckWithCards extends Deck {
  cards: FlashCard[];
}

interface SmartCard extends FlashCard {
  priorityScore: number;
  priorityReason: string;
  urgency: "critical" | "high" | "medium" | "low";
}

interface SmartQueueResponse {
  cards: SmartCard[];
  stats: {
    totalCards: number;
    dueNow: number;
    newCards: number;
    strugglingCards: number;
    masteredCards: number;
    estimatedTime: number;
  };
}

interface SessionSummary {
  summary: {
    totalCards: number;
    correctCount: number;
    strugglingCount: number;
    accuracy: number;
    estimatedTimeSpent: number;
  };
  weakConcepts: Array<{
    id: string;
    front: string;
    easeFactor: number;
    suggestion: string;
  }>;
  strongConcepts: Array<{
    id: string;
    front: string;
  }>;
  nextActions: Array<{
    type: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  encouragement: string;
}

type ViewState = "decks" | "create-deck" | "create-card" | "studying" | "bulk-import" | "session-summary" | "smart-study";
type StudyMode = "smart" | "due-only" | "new-only" | "struggling" | "deck";

export default function Flashcards() {
  const [view, setView] = useState<ViewState>("decks");
  const [flipped, setFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [showStudySettings, setShowStudySettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [studyMode, setStudyMode] = useState<StudyMode>("smart");
  const [showThinkingPrompt, setShowThinkingPrompt] = useState(true);
  const [sessionResponses, setSessionResponses] = useState<number[]>([]);
  const [sessionCardIds, setSessionCardIds] = useState<string[]>([]);
  const [smartCards, setSmartCards] = useState<SmartCard[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [deckForm, setDeckForm] = useState({
    title: "",
    subject: "",
    description: "",
    tags: "",
  });

  const [cardForm, setCardForm] = useState({
    front: "",
    back: "",
  });

  const [studyPreferences, setStudyPreferences] = useState({
    shuffleCards: false,
    showThinkingPrompt: true,
    sessionSize: "20",
  });

  // Get smart queue data BEFORE useEffect hooks that reference it
  const { data: smartQueue, refetch: refetchSmartQueue } = useQuery<SmartQueueResponse>({
    queryKey: ["/api/cards/smart-queue", studyMode, selectedDeckId],
    queryFn: async () => {
      const params = new URLSearchParams({
        mode: studyMode === "deck" ? "smart" : studyMode,
        limit: studyPreferences.sessionSize,
      });
      if (studyMode === "deck" && selectedDeckId) {
        params.append("deckId", selectedDeckId);
      }
      // Use apiRequest to include auth token in headers
      const res = await apiRequest("GET", `/api/cards/smart-queue?${params}`);
      return res.json();
    },
    enabled: view === "smart-study" || view === "decks",
    retry: 1,
  });

  // Keyboard shortcuts for smart study
  useEffect(() => {
    if (view !== "smart-study") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const cards = smartCards.length > 0 ? smartCards : (smartQueue?.cards || []);
      if (cards.length === 0) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "enter":
          e.preventDefault();
          setFlipped((prev) => !prev);
          break;
        case "1":
          e.preventDefault();
          if (flipped && !reviewCardMutation.isPending) handleReview(1);
          break;
        case "2":
          e.preventDefault();
          if (flipped && !reviewCardMutation.isPending) handleReview(2);
          break;
        case "3":
          e.preventDefault();
          if (flipped && !reviewCardMutation.isPending) handleReview(3);
          break;
        case "4":
          e.preventDefault();
          if (flipped && !reviewCardMutation.isPending) handleReview(5);
          break;
        case "escape":
          e.preventDefault();
          if (sessionCardIds.length > 0) {
            getSessionSummaryMutation.mutate({
              cardIds: sessionCardIds,
              responses: sessionResponses,
            });
          } else {
            setView("decks");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, flipped, currentCard, smartCards, smartQueue?.cards, sessionCardIds, sessionResponses]);

  const { data: decks = [], isLoading: isLoadingDecks } = useQuery<DeckWithStats[]>({
    queryKey: ["/api/decks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/decks");
      const data = await res.json();
      
      // DEFENSIVE: Deduplicate by ID
      const seenIds = new Set<string>();
      const uniqueDecks = data.filter((deck: DeckWithStats) => {
        if (seenIds.has(deck.id)) {
          console.warn(`[FLASHCARDS] ⚠️  Duplicate deck detected: ${deck.title} (${deck.id})`);
          return false;
        }
        seenIds.add(deck.id);
        return true;
      });
      
      // VALIDATION: Check count constraints
      if (uniqueDecks.length > 10) {
        console.warn(`[FLASHCARDS] ⚠️  WARNING: ${uniqueDecks.length} decks found (max 10 expected)`);
      } else if (uniqueDecks.length < 5 && uniqueDecks.length > 0) {
        console.warn(`[FLASHCARDS] ⚠️  WARNING: Only ${uniqueDecks.length} decks found (5-10 expected)`);
      }
      
      // Validate each deck has 10-30 cards
      uniqueDecks.forEach((deck: DeckWithStats) => {
        if (deck.cards < 10 || deck.cards > 30) {
          console.warn(`[FLASHCARDS] ⚠️  WARNING: Deck "${deck.title}" has ${deck.cards} cards (10-30 expected)`);
        }
      });
      
      console.log(`[FLASHCARDS] ✅ Loaded ${uniqueDecks.length} unique decks`);
      return uniqueDecks;
    },
    retry: 1,
  });

  const { data: selectedDeck } = useQuery<DeckWithCards>({
    queryKey: ["/api/decks", selectedDeckId],
    enabled: !!selectedDeckId && (view === "studying" || view === "create-card" || view === "bulk-import"),
    retry: 1,
  });

  // Real stats from backend
  const { data: flashcardStats } = useQuery({
    queryKey: ["/api/flashcards/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/flashcards/stats");
      return res.json();
    },
    enabled: view === "decks",
    retry: 1,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (data: { title: string; subject?: string; description?: string; tags?: string[] }) => {
      console.log("[FLASHCARDS API] Sending POST /api/decks", data);
      const res = await apiRequest("POST", "/api/decks", data);
      console.log("[FLASHCARDS API] Response status:", res.status);
      const result = await res.json();
      console.log("[FLASHCARDS API] Response data:", result);
      return result;
    },
    onSuccess: (newDeck) => {
      console.log("[FLASHCARDS] Create deck SUCCESS:", newDeck.id);
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setSelectedDeckId(newDeck.id);
      setView("create-card");
      setDeckForm({ title: "", subject: "", description: "", tags: "" });
      toast({ title: "Deck created!", description: "Now add some flashcards." });
    },
    onError: (error) => {
      console.error("[FLASHCARDS] Create deck ERROR:", error);
      toast({ title: "Error", description: "Failed to create deck", variant: "destructive" });
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/decks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({ title: "Deck deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete deck", variant: "destructive" });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: { deckId: string; front: string; back: string }) => {
      console.log("[FLASHCARDS API] Sending POST /api/cards", data);
      const res = await apiRequest("POST", "/api/cards", data);
      console.log("[FLASHCARDS API] Response status:", res.status);
      const result = await res.json();
      console.log("[FLASHCARDS API] Response data:", result);
      return result;
    },
    onSuccess: () => {
      console.log("[FLASHCARDS] Create card SUCCESS");
      queryClient.invalidateQueries({ queryKey: ["/api/decks", selectedDeckId] });
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setCardForm({ front: "", back: "" });
      toast({ title: "Card added!" });
    },
    onError: (error) => {
      console.error("[FLASHCARDS] Create card ERROR:", error);
      toast({ title: "Error", description: "Failed to add card", variant: "destructive" });
    },
  });

  const reviewCardMutation = useMutation({
    mutationFn: async ({ cardId, quality }: { cardId: string; quality: number }) => {
      console.log("[FLASHCARDS API] Sending POST /api/cards/:id/review", { cardId, quality });
      const res = await apiRequest("POST", `/api/cards/${cardId}/review`, { quality });
      console.log("[FLASHCARDS API] Response status:", res.status);
      const result = await res.json();
      console.log("[FLASHCARDS API] Response data:", result);
      return result;
    },
    onSuccess: () => {
      console.log("[FLASHCARDS] Review card SUCCESS");
      queryClient.invalidateQueries({ queryKey: ["/api/decks", selectedDeckId] });
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/smart-queue"] });
    },
    onError: (error) => {
      console.error("[FLASHCARDS] Review card ERROR:", error);
    },
  });

  const getSessionSummaryMutation = useMutation({
    mutationFn: async (data: { cardIds: string[]; responses: number[] }) => {
      const res = await apiRequest("POST", "/api/cards/session-summary", data);
      return res.json();
    },
    onSuccess: (data) => {
      setSessionSummary(data);
      setView("session-summary");
    },
  });

  const handleCreateDeck = () => {
    console.log("[FLASHCARDS] Create Deck button clicked");
    console.log("[FLASHCARDS] Handler entered - deck form:", deckForm);
    const token = localStorage.getItem("token");
    console.log("[FLASHCARDS] Auth check - token exists:", !!token);
    
    const tags = deckForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    console.log("[FLASHCARDS] Calling createDeck mutation");
    createDeckMutation.mutate({
      title: deckForm.title,
      subject: deckForm.subject || undefined,
      description: deckForm.description || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  const handleAddCard = () => {
    console.log("[FLASHCARDS] Add Card button clicked");
    console.log("[FLASHCARDS] Handler entered - card form:", cardForm);
    
    if (!cardForm.front.trim() || !cardForm.back.trim()) {
      console.log("[FLASHCARDS] Validation failed - missing front/back");
      toast({ title: "Error", description: "Both front and back are required", variant: "destructive" });
      return;
    }
    
    const token = localStorage.getItem("token");
    console.log("[FLASHCARDS] Auth check - token exists:", !!token);
    console.log("[FLASHCARDS] Calling createCard mutation for deck:", selectedDeckId);
    
    createCardMutation.mutate({
      deckId: selectedDeckId,
      front: cardForm.front.trim(),
      back: cardForm.back.trim(),
    });
  };

  const startSmartStudy = (mode: StudyMode, deckId?: string) => {
    console.log("[FLASHCARDS] Study Deck button clicked");
    console.log("[FLASHCARDS] Handler entered - mode:", mode, "deckId:", deckId);
    const token = localStorage.getItem("token");
    console.log("[FLASHCARDS] Auth check - token exists:", !!token);
    
    setStudyMode(mode);
    if (deckId) setSelectedDeckId(deckId);
    setCurrentCard(0);
    setFlipped(false);
    setShowThinkingPrompt(studyPreferences.showThinkingPrompt);
    setSessionResponses([]);
    setSessionCardIds([]);
    setView("smart-study");
    console.log("[FLASHCARDS] Refetching smart queue");
    refetchSmartQueue();
  };

  const handleReview = useCallback((quality: number) => {
    const { playSound } = useSoundEffect();
    const { confetti } = useConfetti();
    
    console.log("[FLASHCARDS] Review button clicked - quality:", quality);
    const cards = smartCards.length > 0 ? smartCards : (smartQueue?.cards || []);
    console.log("[FLASHCARDS] Handler entered - cards available:", cards.length);
    
    if (cards.length === 0) {
      console.log("[FLASHCARDS] No cards available - aborting");
      return;
    }
    
    const card = cards[currentCard];
    const token = localStorage.getItem("token");
    console.log("[FLASHCARDS] Auth check - token exists:", !!token);
    console.log("[FLASHCARDS] Calling reviewCard mutation for card:", card.id);
    reviewCardMutation.mutate({ cardId: card.id, quality });
    
    // Play sound feedback
    playSound(quality >= 3 ? "success" : "click");
    
    // Track session data
    setSessionResponses(prev => [...prev, quality]);
    setSessionCardIds(prev => [...prev, card.id]);
    
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setFlipped(false);
      setShowThinkingPrompt(studyPreferences.showThinkingPrompt);
    } else {
      // Session complete - get summary and show confetti if good performance
      const allCardIds = [...sessionCardIds, card.id];
      const allResponses = [...sessionResponses, quality];
      const avgQuality = (allResponses.reduce((a, b) => a + b, 0) / allResponses.length);
      
      if (avgQuality >= 3) {
        confetti();
      }
      
      getSessionSummaryMutation.mutate({ cardIds: allCardIds, responses: allResponses });
    }
  }, [smartCards, smartQueue?.cards, currentCard, reviewCardMutation, sessionCardIds, sessionResponses, studyPreferences.showThinkingPrompt, getSessionSummaryMutation]);

  const parseBulkImport = () => {
    const lines = bulkImportText.split("\n").filter(line => line.trim());
    return lines.map(line => {
      const [front, back] = line.split("|").map(s => s.trim());
      return { front: front || "", back: back || "" };
    });
  };

  const handleBulkImport = async () => {
    const cards = parseBulkImport().filter(c => c.front && c.back);
    for (const card of cards) {
      await createCardMutation.mutateAsync({
        deckId: selectedDeckId,
        front: card.front,
        back: card.back,
      });
    }
    setBulkImportText("");
    setView("create-card");
    toast({ title: "Import complete!", description: `${cards.length} cards added.` });
  };

  const getSubjectColor = (subject?: string | null) => {
    const colors: Record<string, string> = {
      "Computer Science": "from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 border-blue-300 dark:border-blue-700",
      "Mathematics": "from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900 border-purple-300 dark:border-purple-700",
      "Languages": "from-pink-100 to-rose-100 dark:from-pink-900 dark:to-rose-900 border-pink-300 dark:border-pink-700",
      "Science": "from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 border-teal-300 dark:border-teal-700",
    };
    return colors[subject || ""] || "from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 border-emerald-300 dark:border-emerald-700";
  };

  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return decks;
    const query = searchQuery.toLowerCase();
    return decks.filter(deck => {
      const normalizedTags = normalizeTags(deck.tags);
      return (
        deck.title.toLowerCase().includes(query) ||
        deck.subject?.toLowerCase().includes(query) ||
        normalizedTags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }, [decks, searchQuery]);

  const urgencyColors = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-emerald-500",
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (view !== "smart-study" && view !== "studying") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          if (showThinkingPrompt) {
            setShowThinkingPrompt(false);
          } else {
            setFlipped(f => !f);
          }
          break;
        case "1":
          e.preventDefault();
          if (flipped) handleReview(1);
          break;
        case "2":
          e.preventDefault();
          if (flipped) handleReview(2);
          break;
        case "3":
          e.preventDefault();
          if (flipped) handleReview(3);
          break;
        case "4":
          e.preventDefault();
          if (flipped) handleReview(5);
          break;
        case "Escape":
          e.preventDefault();
          if (sessionCardIds.length > 0) {
            getSessionSummaryMutation.mutate({ cardIds: sessionCardIds, responses: sessionResponses });
          } else {
            setView("decks");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, handleReview, flipped, showThinkingPrompt, sessionCardIds, sessionResponses, getSessionSummaryMutation]);

  // Set smart cards when queue loads
  useEffect(() => {
    if (smartQueue?.cards && view === "smart-study") {
      setSmartCards(smartQueue.cards);
    }
  }, [smartQueue?.cards, view]);

  if (isLoadingDecks) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Session Summary View
  if (view === "session-summary" && sessionSummary) {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Session Complete!</h1>
            <p className="text-lg text-muted-foreground">{sessionSummary.encouragement}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center p-4">
              <p className="text-3xl font-bold text-emerald-600">{sessionSummary.summary.totalCards}</p>
              <p className="text-sm text-muted-foreground">Cards Reviewed</p>
            </Card>
            <Card className="text-center p-4">
              <p className="text-3xl font-bold text-blue-600">{sessionSummary.summary.accuracy}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </Card>
            <Card className="text-center p-4">
              <p className="text-3xl font-bold text-green-600">{sessionSummary.summary.correctCount}</p>
              <p className="text-sm text-muted-foreground">Good/Easy</p>
            </Card>
            <Card className="text-center p-4">
              <p className="text-3xl font-bold text-orange-600">{sessionSummary.summary.strugglingCount}</p>
              <p className="text-sm text-muted-foreground">Need Practice</p>
            </Card>
          </div>

          {sessionSummary.weakConcepts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Concepts to Review
                </CardTitle>
                <CardDescription>These cards need more practice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sessionSummary.weakConcepts.slice(0, 5).map((concept) => (
                  <div key={concept.id} className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="font-medium text-sm">{concept.front}</p>
                    <p className="text-xs text-muted-foreground mt-1">{concept.suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {sessionSummary.strongConcepts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <Sparkles className="h-5 w-5" />
                  Well Done!
                </CardTitle>
                <CardDescription>You nailed these concepts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sessionSummary.strongConcepts.slice(0, 8).map((concept) => (
                    <Badge key={concept.id} variant="secondary" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      {concept.front.substring(0, 40)}{concept.front.length > 40 ? '...' : ''}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionSummary.nextActions.map((action, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg border flex items-start gap-3 ${
                    action.priority === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                    action.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' :
                    'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <Target className={`h-5 w-5 mt-0.5 ${
                    action.priority === 'high' ? 'text-red-500' :
                    action.priority === 'medium' ? 'text-amber-500' :
                    'text-emerald-500'
                  }`} />
                  <div>
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={() => startSmartStudy("struggling")}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
              data-testid="button-review-weak"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Review Weak Cards
            </Button>
            <Button 
              onClick={() => startSmartStudy("smart")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              data-testid="button-continue-studying"
            >
              <Play className="h-4 w-4 mr-2" />
              Continue Studying
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setView("decks");
                setSessionSummary(null);
                setSessionResponses([]);
                setSessionCardIds([]);
              }}
              data-testid="button-back-to-decks"
            >
              Back to Decks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Smart Study Mode
  if (view === "smart-study") {
    const cards = smartCards.length > 0 ? smartCards : (smartQueue?.cards || []);
    
    if (cards.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
          <Card className="p-8 text-center max-w-md">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground mb-4">No cards need review right now. Great job staying on top of your studies!</p>
            <Button onClick={() => setView("decks")} data-testid="button-back-decks">Back to Decks</Button>
          </Card>
        </div>
      );
    }

    const card = cards[currentCard];
    const progress = ((currentCard + 1) / cards.length) * 100;
    const stats = smartQueue?.stats;

    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        {/* Header */}
        <div className="p-4 border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`${urgencyColors[card.urgency]} text-white`}>
                {card.urgency.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Card {currentCard + 1} of {cards.length}
              </span>
              {stats && (
                <span className="text-xs text-muted-foreground">
                  ~{stats.estimatedTime} min remaining
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sessionCardIds.length > 0) {
                  getSessionSummaryMutation.mutate({ cardIds: sessionCardIds, responses: sessionResponses });
                } else {
                  setView("decks");
                }
              }}
              data-testid="button-exit-study"
            >
              {sessionCardIds.length > 0 ? "End Session" : "Exit"}
            </Button>
          </div>
          <div className="max-w-3xl mx-auto mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Main Card Area */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-6">
            {/* Priority Reason */}
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                {card.priorityReason}
              </Badge>
            </div>

            {/* Active Recall Prompt */}
            {showThinkingPrompt && !flipped && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-2 border-amber-300 dark:border-amber-700 p-6 text-center">
                <Lightbulb className="h-8 w-8 mx-auto mb-3 text-amber-500" />
                <h3 className="text-lg font-semibold mb-2">Think First!</h3>
                <p className="text-muted-foreground mb-4">
                  Before revealing the answer, try to recall it from memory. This strengthens your learning!
                </p>
                <Button 
                  onClick={() => setShowThinkingPrompt(false)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  data-testid="button-ready-answer"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  I've Thought About It
                </Button>
                <p className="text-xs text-muted-foreground mt-3">Press Space or Enter</p>
              </Card>
            )}

            {/* Flashcard */}
            {!showThinkingPrompt && (
              <>
                <div
                  className="relative min-h-[300px] cursor-pointer perspective"
                  onClick={() => setFlipped(!flipped)}
                  data-testid="flashcard-container"
                  style={{
                    perspective: "1000px",
                  }}
                >
                  <div
                    className="absolute inset-0 transition-transform duration-500 flex items-center justify-center"
                    style={{
                      transformStyle: "preserve-3d" as const,
                      transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front of card */}
                    <div
                      className="absolute inset-0 w-full"
                      style={{
                        backfaceVisibility: "hidden" as const,
                      }}
                    >
                      <Card className="h-full flex items-center justify-center glassmorphic hover-lift bg-gradient-to-br from-white/80 to-emerald-50/80 dark:from-slate-800/80 dark:to-emerald-950/80 border border-white/20 dark:border-white/10 shadow-2xl">
                        <CardContent className="p-8 text-center w-full">
                          <div className="text-sm font-semibold mb-4 text-emerald-600 dark:text-emerald-400">
                            QUESTION
                          </div>
                          <p className="text-xl md:text-2xl font-medium leading-relaxed">
                            {card.front}
                          </p>
                          <div className="mt-8">
                            <RotateCw className="h-5 w-5 mx-auto text-muted-foreground animate-spin-fast" />
                            <p className="text-xs text-muted-foreground mt-2">Click or press Space to reveal</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Back of card */}
                    <div
                      className="absolute inset-0 w-full"
                      style={{
                        backfaceVisibility: "hidden" as const,
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <Card className="h-full flex items-center justify-center glassmorphic hover-lift bg-gradient-to-br from-white/80 to-teal-50/80 dark:from-slate-800/80 dark:to-teal-950/80 border border-white/20 dark:border-white/10 shadow-2xl">
                        <CardContent className="p-8 text-center w-full">
                          <div className="text-sm font-semibold mb-4 text-teal-600 dark:text-teal-400">
                            ANSWER
                          </div>
                          <p className="text-xl md:text-2xl font-medium leading-relaxed">
                            {card.back}
                          </p>
                          <div className="mt-8">
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              <DifficultyBadge status={card.status} easeFactor={card.easeFactor} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Rating Buttons */}
                {flipped && (
                  <div className="space-y-4 animate-scale-in">
                    <p className="text-center text-sm font-medium">How well did you know this?</p>
                    <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
                      <Button
                        size="lg"
                        onClick={() => handleReview(1)}
                        disabled={reviewCardMutation.isPending}
                        className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white min-w-[80px] button-hover-scale"
                        data-testid="button-again"
                      >
                        <span className="font-semibold">Again</span>
                        <span className="text-xs ml-1 opacity-80">(1)</span>
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleReview(2)}
                        disabled={reviewCardMutation.isPending}
                        className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white min-w-[80px] button-hover-scale"
                        data-testid="button-hard"
                      >
                        <span className="font-semibold">Hard</span>
                        <span className="text-xs ml-1 opacity-80">(2)</span>
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleReview(3)}
                        disabled={reviewCardMutation.isPending}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white min-w-[80px] button-hover-scale"
                        data-testid="button-good"
                      >
                        <span className="font-semibold">Good</span>
                        <span className="text-xs ml-1 opacity-80">(3)</span>
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleReview(5)}
                        disabled={reviewCardMutation.isPending}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white min-w-[80px] button-hover-scale"
                        data-testid="button-easy"
                      >
                        <span className="font-semibold">Easy</span>
                        <span className="text-xs ml-1 opacity-80">(4)</span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Keyboard Shortcuts */}
            <div className="text-center text-xs text-muted-foreground border-t pt-4 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                Keyboard:
              </span>
              <span>Space/Enter: Flip</span>
              <span>1-4: Rate</span>
              <span>Esc: End</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Deck View
  if (view === "decks") {
    // Use real stats from the API, fallback to smartQueue stats
    const stats = flashcardStats || smartQueue?.stats;
    
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">Smart Flashcards</h1>
                <p className="text-lg opacity-90 max-w-2xl">Intelligent spaced repetition that adapts to your learning</p>
              </div>
              <Brain className="h-16 w-16 opacity-50" />
            </div>
          </div>

          {/* Quick Stats & Smart Study */}
          {stats && stats.totalCards > 0 && (
            <Card className="border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Smart Study Session
                </CardTitle>
                <CardDescription>AI-prioritized cards based on your learning patterns</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{stats?.totalCards ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Total Cards</p>
                  </div>
                  <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{stats?.dueNow ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Due Now</p>
                  </div>
                  <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats?.new ?? 0}</p>
                    <p className="text-xs text-muted-foreground">New</p>
                  </div>
                  <div className="text-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{stats?.struggling ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Struggling</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{stats?.mastered ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Mastered</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    onClick={() => startSmartStudy("smart")}
                    className="h-auto py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    data-testid="button-smart-study"
                  >
                    <div className="text-center">
                      <Brain className="h-6 w-6 mx-auto mb-1" />
                      <span className="font-semibold">Smart Mix</span>
                      <p className="text-xs opacity-80 mt-1">AI-optimized</p>
                    </div>
                  </Button>
                  <Button
                    onClick={() => startSmartStudy("due-only")}
                    variant="outline"
                    className="h-auto py-4 border-2"
                    disabled={(stats?.dueNow ?? 0) === 0}
                    data-testid="button-due-only"
                  >
                    <div className="text-center">
                      <Clock className="h-6 w-6 mx-auto mb-1 text-red-500" />
                      <span className="font-semibold">Due Cards</span>
                      <p className="text-xs text-muted-foreground mt-1">{stats?.dueNow ?? 0} cards</p>
                    </div>
                  </Button>
                  <Button
                    onClick={() => startSmartStudy("new-only")}
                    variant="outline"
                    className="h-auto py-4 border-2"
                    disabled={(stats?.new ?? 0) === 0}
                    data-testid="button-new-only"
                  >
                    <div className="text-center">
                      <Sparkles className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <span className="font-semibold">New Cards</span>
                      <p className="text-xs text-muted-foreground mt-1">{stats?.new ?? 0} cards</p>
                    </div>
                  </Button>
                  <Button
                    onClick={() => startSmartStudy("struggling")}
                    variant="outline"
                    className="h-auto py-4 border-2"
                    disabled={(stats?.struggling ?? 0) === 0}
                    data-testid="button-struggling"
                  >
                    <div className="text-center">
                      <Target className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                      <span className="font-semibold">Struggling</span>
                      <p className="text-xs text-muted-foreground mt-1">{stats?.struggling ?? 0} cards</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setView("create-deck")}
              className="h-20 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg font-semibold rounded-xl"
              data-testid="button-create-deck"
            >
              <Plus className="h-6 w-6 mr-2" />
              Create New Deck
            </Button>
            <Button
              variant="outline"
              className="h-20 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-lg font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950"
              onClick={() => setShowStudySettings(!showStudySettings)}
              data-testid="button-study-settings"
            >
              <Settings className="h-6 w-6 mr-2" />
              Study Settings
            </Button>
          </div>

          {/* Study Settings */}
          {showStudySettings && (
            <Card className="border-2 border-emerald-300 dark:border-emerald-700">
              <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Study Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer hover-elevate">
                    <div>
                      <p className="font-semibold text-sm">Active Recall Prompt</p>
                      <p className="text-xs text-muted-foreground">Show "think first" reminder before flip</p>
                    </div>
                    <Switch
                      checked={studyPreferences.showThinkingPrompt}
                      onCheckedChange={(checked) => setStudyPreferences({...studyPreferences, showThinkingPrompt: checked})}
                      data-testid="switch-thinking-prompt"
                    />
                  </label>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Session Size</Label>
                    <Select 
                      value={studyPreferences.sessionSize} 
                      onValueChange={(value) => setStudyPreferences({...studyPreferences, sessionSize: value})}
                    >
                      <SelectTrigger className="border-emerald-300 dark:border-emerald-700" data-testid="select-session-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 cards</SelectItem>
                        <SelectItem value="20">20 cards</SelectItem>
                        <SelectItem value="30">30 cards</SelectItem>
                        <SelectItem value="50">50 cards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deck List */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Decks</h2>
              {decks.length > 0 && (
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <Input
                    placeholder="Search decks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-emerald-300 dark:border-emerald-700 focus-visible:ring-emerald-500"
                    data-testid="input-search-decks"
                  />
                </div>
              )}
            </div>
            {decks.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-emerald-300 dark:border-emerald-700">
                <div className="max-w-md mx-auto">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-emerald-400 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Decks Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first flashcard deck to start learning!</p>
                  <Button onClick={() => setView("create-deck")} data-testid="button-create-first-deck">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Deck
                  </Button>
                </div>
              </Card>
            ) : filteredDecks.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-emerald-300 dark:border-emerald-700">
                <div className="max-w-md mx-auto">
                  <Search className="h-12 w-12 mx-auto mb-4 text-emerald-400 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Matching Decks</h3>
                  <p className="text-muted-foreground mb-4">Try a different search term</p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* DEFENSIVE: Ensure unique keys and prevent duplicate rendering */}
                {filteredDecks
                  .filter((deck, index, self) => 
                    index === self.findIndex((d) => d.id === deck.id)
                  )
                  .map((deck) => {
                  const progressPct = deck.cards > 0 ? (deck.mastered / deck.cards) * 100 : 0;
                  return (
                    <Card
                      key={deck.id}
                      className={`border-2 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r ${getSubjectColor(deck.subject)}`}
                      data-testid={`card-deck-${deck.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{deck.title}</CardTitle>
                            <CardDescription className="text-xs">{deck.subject || "General"}</CardDescription>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDeckId(deck.id);
                                setView("create-card");
                              }}
                              data-testid={`button-add-cards-${deck.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDeckMutation.mutate(deck.id);
                              }}
                              data-testid={`button-delete-deck-${deck.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {(() => {
                          const normalizedTags = normalizeTags(deck.tags);
                          return normalizedTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {normalizedTags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          );
                        })()}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs flex-wrap gap-1">
                            <span className="font-semibold">Mastery Progress</span>
                            <span className="text-muted-foreground">{deck.mastered} / {deck.cards}</span>
                          </div>
                          <Progress value={progressPct} className="h-2" />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-white dark:bg-slate-900 rounded text-center">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-bold text-slate-600 dark:text-slate-300">{deck.cards}</p>
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 rounded text-center">
                            <p className="text-xs text-muted-foreground">Due</p>
                            <p className="font-bold text-orange-600 dark:text-orange-400">{deck.dueToday}</p>
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 rounded text-center">
                            <p className="text-xs text-muted-foreground">Mastered</p>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">{deck.mastered}</p>
                          </div>
                        </div>

                        <Button
                          onClick={() => startSmartStudy("deck", deck.id)}
                          disabled={deck.cards === 0}
                          className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                          data-testid={`button-study-deck-${deck.id}`}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {deck.cards === 0 ? "No Cards" : "Study Deck"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "create-deck") {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Deck
              </CardTitle>
              <CardDescription>Start building your flashcard collection</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deck-title" className="font-semibold">Deck Title *</Label>
                <Input
                  id="deck-title"
                  placeholder="e.g., Spanish Vocabulary, Biology Terms"
                  value={deckForm.title}
                  onChange={(e) => setDeckForm({ ...deckForm, title: e.target.value })}
                  className="border-2 border-emerald-200 dark:border-emerald-800"
                  data-testid="input-deck-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="font-semibold">Subject/Course</Label>
                <Select value={deckForm.subject} onValueChange={(value) => setDeckForm({ ...deckForm, subject: value })}>
                  <SelectTrigger className="border-2 border-emerald-200 dark:border-emerald-800" data-testid="select-subject">
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Languages">Languages</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Literature">Literature</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Description</Label>
                <textarea
                  id="description"
                  placeholder="What is this deck about?"
                  value={deckForm.description}
                  onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
                  className="w-full p-3 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg bg-white dark:bg-slate-900"
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="font-semibold flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  placeholder="e.g., exam, important, review"
                  value={deckForm.tags}
                  onChange={(e) => setDeckForm({ ...deckForm, tags: e.target.value })}
                  className="border-2 border-emerald-200 dark:border-emerald-800"
                  data-testid="input-tags"
                />
              </div>

              <div className="flex gap-3 pt-4 flex-wrap">
                <Button
                  onClick={handleCreateDeck}
                  disabled={!deckForm.title.trim() || createDeckMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  data-testid="button-save-deck"
                >
                  {createDeckMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Deck
                </Button>
                <Button
                  onClick={() => setView("decks")}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-deck"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === "create-card") {
    const deckTitle = selectedDeck?.title || decks.find(d => d.id === selectedDeckId)?.title || "Deck";
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Button variant="ghost" onClick={() => setView("decks")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Decks
          </Button>

          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
              <CardTitle>Add Cards to "{deckTitle}"</CardTitle>
              <CardDescription>
                {selectedDeck?.cards.length || 0} cards in this deck
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="front" className="font-semibold">Front (Question) *</Label>
                <textarea
                  id="front"
                  placeholder="What should students be asked?"
                  value={cardForm.front}
                  onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
                  className="w-full p-3 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  data-testid="textarea-front"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="back" className="font-semibold">Back (Answer) *</Label>
                <textarea
                  id="back"
                  placeholder="The correct answer or explanation"
                  value={cardForm.back}
                  onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
                  className="w-full p-3 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  data-testid="textarea-back"
                />
              </div>

              {(cardForm.front || cardForm.back) && (
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">PREVIEW</p>
                  <div className="space-y-2">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border-l-4 border-emerald-500">
                      <p className="text-xs text-muted-foreground">Front</p>
                      <p className="font-medium">{cardForm.front || "..."}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border-l-4 border-teal-500">
                      <p className="text-xs text-muted-foreground">Back</p>
                      <p className="font-medium">{cardForm.back || "..."}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={handleAddCard}
                  disabled={!cardForm.front.trim() || !cardForm.back.trim() || createCardMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  data-testid="button-add-card"
                >
                  {createCardMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Card
                </Button>
                <Button
                  onClick={() => {
                    setSelectedDeckId(selectedDeckId);
                    setView("bulk-import");
                  }}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-bulk-import"
                >
                  <Upload className="h-4 w-4" />
                  Bulk Import
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedDeck?.cards && selectedDeck.cards.length > 0 && (
            <Card className="border-2 border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="text-lg">Cards in Deck ({selectedDeck.cards.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-auto">
                {selectedDeck.cards.map((card, idx) => (
                  <div key={card.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded border">
                    <p className="text-xs text-muted-foreground">Card {idx + 1}</p>
                    <p className="font-medium text-sm">{card.front}</p>
                    <p className="text-sm text-muted-foreground">{card.back}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (view === "bulk-import") {
    const importedCards = bulkImportText.trim() ? parseBulkImport() : [];
    const validCards = importedCards.filter(c => c.front && c.back);

    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <div className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={() => setView("create-card")} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Import Cards
              </CardTitle>
              <CardDescription>Import multiple cards at once</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Format:</strong> Enter one card per line using: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">Front Text | Back Text</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-input" className="font-semibold">Paste Your Cards</Label>
                <textarea
                  id="bulk-input"
                  placeholder="What is React? | A JavaScript library for building UIs&#10;What is useState? | A hook for managing component state"
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  className="w-full p-4 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg bg-white dark:bg-slate-900 font-mono text-sm"
                  rows={8}
                  data-testid="textarea-bulk-import"
                />
              </div>

              {validCards.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-semibold">{validCards.length} cards ready to import</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                      data-testid="button-toggle-preview"
                    >
                      {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showPreview ? "Hide" : "Show"} Preview
                    </Button>
                  </div>

                  {showPreview && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {validCards.slice(0, 10).map((card, index) => (
                        <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded border">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Card {index + 1}</p>
                          <p className="text-sm font-medium">Q: {card.front}</p>
                          <p className="text-sm text-muted-foreground">A: {card.back}</p>
                        </div>
                      ))}
                      {validCards.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          ... and {validCards.length - 10} more cards
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={handleBulkImport}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  disabled={validCards.length === 0 || createCardMutation.isPending}
                  data-testid="button-import-cards"
                >
                  {createCardMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import {validCards.length} Cards
                </Button>
                <Button
                  onClick={() => {
                    setView("create-card");
                    setBulkImportText("");
                  }}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-import"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
