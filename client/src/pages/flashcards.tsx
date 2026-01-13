import { useState } from "react";
import { Plus, Play, RotateCw, Upload, Edit2, Trash2, Eye, EyeOff, Tags, Settings, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type ViewState = "decks" | "create-deck" | "create-card" | "studying" | "bulk-import";

export default function Flashcards() {
  const [view, setView] = useState<ViewState>("decks");
  const [flipped, setFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [showStudySettings, setShowStudySettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");

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
    shuffleCards: true,
    answerDelay: "3" as "0" | "3" | "5" | "10",
    autoAdvance: false,
    autoAdvanceDelay: "3",
    showProgress: true,
  });

  const { data: decks = [], isLoading: isLoadingDecks } = useQuery<DeckWithStats[]>({
    queryKey: ["/api/decks"],
  });

  const { data: selectedDeck } = useQuery<DeckWithCards>({
    queryKey: ["/api/decks", selectedDeckId],
    enabled: !!selectedDeckId && (view === "studying" || view === "create-card" || view === "bulk-import"),
  });

  const createDeckMutation = useMutation({
    mutationFn: async (data: { title: string; subject?: string; description?: string; tags?: string[] }) => {
      const res = await apiRequest("POST", "/api/decks", data);
      return res.json();
    },
    onSuccess: (newDeck) => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setSelectedDeckId(newDeck.id);
      setView("create-card");
      setDeckForm({ title: "", subject: "", description: "", tags: "" });
      toast({ title: "Deck created!", description: "Now add some flashcards." });
    },
    onError: () => {
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
      const res = await apiRequest("POST", "/api/cards", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", selectedDeckId] });
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setCardForm({ front: "", back: "" });
      toast({ title: "Card added!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add card", variant: "destructive" });
    },
  });

  const reviewCardMutation = useMutation({
    mutationFn: async ({ cardId, quality }: { cardId: string; quality: number }) => {
      const res = await apiRequest("POST", `/api/cards/${cardId}/review`, { quality });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", selectedDeckId] });
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
    },
  });

  const handleCreateDeck = () => {
    const tags = deckForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    createDeckMutation.mutate({
      title: deckForm.title,
      subject: deckForm.subject || undefined,
      description: deckForm.description || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  const handleAddCard = () => {
    if (!cardForm.front.trim() || !cardForm.back.trim()) {
      toast({ title: "Error", description: "Both front and back are required", variant: "destructive" });
      return;
    }
    createCardMutation.mutate({
      deckId: selectedDeckId,
      front: cardForm.front.trim(),
      back: cardForm.back.trim(),
    });
  };

  const handleReview = (quality: number) => {
    if (!selectedDeck?.cards || selectedDeck.cards.length === 0) return;
    const card = selectedDeck.cards[currentCard];
    reviewCardMutation.mutate({ cardId: card.id, quality });
    
    if (currentCard < selectedDeck.cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setFlipped(false);
    } else {
      toast({ title: "Session complete!", description: "You've reviewed all cards." });
      setView("decks");
      setCurrentCard(0);
      setFlipped(false);
    }
  };

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
    return colors[subject || ""] || "from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 border-green-300 dark:border-green-700";
  };

  if (isLoadingDecks) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (view === "decks") {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Flashcards</h1>
            <p className="text-lg opacity-90 max-w-2xl">Master topics with spaced repetition learning</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setView("create-deck")}
              className="h-24 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg font-semibold rounded-xl"
              data-testid="button-create-deck"
            >
              <Plus className="h-6 w-6 mr-2" />
              Create New Deck
            </Button>
            <Button
              variant="outline"
              className="h-24 border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 text-lg font-semibold rounded-xl hover:bg-green-50 dark:hover:bg-green-950"
              onClick={() => setShowStudySettings(!showStudySettings)}
              data-testid="button-study-settings"
            >
              <Settings className="h-6 w-6 mr-2" />
              Study Settings
            </Button>
          </div>

          {showStudySettings && (
            <Card className="border-2 border-green-300 dark:border-green-700">
              <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Study Mode Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover-elevate">
                    <div>
                      <p className="font-semibold text-sm">Shuffle Cards</p>
                      <p className="text-xs text-muted-foreground">Randomize card order</p>
                    </div>
                    <Switch
                      checked={studyPreferences.shuffleCards}
                      onCheckedChange={(checked) => setStudyPreferences({...studyPreferences, shuffleCards: checked})}
                      data-testid="switch-shuffle-cards"
                    />
                  </label>
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Answer Reveal Delay</Label>
                    <Select 
                      value={studyPreferences.answerDelay} 
                      onValueChange={(value) => setStudyPreferences({...studyPreferences, answerDelay: value as any})}
                    >
                      <SelectTrigger className="border-green-300 dark:border-green-700" data-testid="select-answer-delay">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Instant</SelectItem>
                        <SelectItem value="3">3 seconds</SelectItem>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Your Decks</h2>
            {decks.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-green-300 dark:border-green-700">
                <div className="max-w-md mx-auto">
                  <Plus className="h-12 w-12 mx-auto mb-4 text-green-400 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Decks Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first flashcard deck to start learning!</p>
                  <Button onClick={() => setView("create-deck")} data-testid="button-create-first-deck">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Deck
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck) => {
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
                          <div className="flex gap-1 flex-shrink-0">
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
                        {deck.description && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">{deck.description}</p>
                        )}
                        {deck.tags && deck.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {deck.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold">Progress</span>
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
                            <p className="font-bold text-green-600 dark:text-green-400">{deck.mastered}</p>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedDeckId(deck.id);
                            setView("studying");
                            setCurrentCard(0);
                            setFlipped(false);
                          }}
                          disabled={deck.cards === 0}
                          className="w-full mt-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                          data-testid={`button-study-deck-${deck.id}`}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {deck.cards === 0 ? "No Cards" : "Start Studying"}
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
      <div className="flex-1 overflow-auto bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
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
                  className="border-2 border-green-200 dark:border-green-800"
                  data-testid="input-deck-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="font-semibold">Subject/Course</Label>
                <Select value={deckForm.subject} onValueChange={(value) => setDeckForm({ ...deckForm, subject: value })}>
                  <SelectTrigger className="border-2 border-green-200 dark:border-green-800" data-testid="select-subject">
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
                  className="w-full p-3 border-2 border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-slate-900"
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
                  className="border-2 border-green-200 dark:border-green-800"
                  data-testid="input-tags"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateDeck}
                  disabled={!deckForm.title.trim() || createDeckMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
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
      <div className="flex-1 overflow-auto bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Button variant="ghost" onClick={() => setView("decks")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Decks
          </Button>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
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
                  className="w-full p-3 border-2 border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500"
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
                  className="w-full p-3 border-2 border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500"
                  rows={3}
                  data-testid="textarea-back"
                />
              </div>

              {(cardForm.front || cardForm.back) && (
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">PREVIEW</p>
                  <div className="space-y-2">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border-l-4 border-green-500">
                      <p className="text-xs text-muted-foreground">Front</p>
                      <p className="font-medium">{cardForm.front || "..."}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border-l-4 border-emerald-500">
                      <p className="text-xs text-muted-foreground">Back</p>
                      <p className="font-medium">{cardForm.back || "..."}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleAddCard}
                  disabled={!cardForm.front.trim() || !cardForm.back.trim() || createCardMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
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
            <Card className="border-2 border-green-200 dark:border-green-800">
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
      <div className="flex-1 overflow-auto bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={() => setView("create-card")} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
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
                  className="w-full p-4 border-2 border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-slate-900 font-mono text-sm"
                  rows={8}
                  data-testid="textarea-bulk-import"
                />
              </div>

              {validCards.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
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

              <div className="flex gap-3">
                <Button
                  onClick={handleBulkImport}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
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

  if (view === "studying") {
    const cards = selectedDeck?.cards || [];
    
    if (cards.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <Card className="p-8 text-center max-w-md">
            <h3 className="text-xl font-semibold mb-2">No Cards to Study</h3>
            <p className="text-muted-foreground mb-4">Add some cards to this deck first.</p>
            <Button onClick={() => setView("decks")}>Back to Decks</Button>
          </Card>
        </div>
      );
    }

    const card = cards[currentCard];
    const progress = ((currentCard + 1) / cards.length) * 100;

    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Card {currentCard + 1} of {cards.length}
              </span>
              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100">
                {selectedDeck?.title}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setView("decks");
                setCurrentCard(0);
                setFlipped(false);
              }}
              data-testid="button-exit-study"
            >
              Exit
            </Button>
          </div>

          <Progress value={progress} className="h-2" />

          <div
            className="relative h-96 cursor-pointer perspective-1000"
            onClick={() => setFlipped(!flipped)}
            data-testid="flashcard-container"
          >
            <Card className="absolute inset-0 flex items-center justify-center transition-all hover-elevate bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border-2 border-green-300 dark:border-green-700">
              <CardContent className="p-8 text-center">
                <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-4">
                  {flipped ? "ANSWER" : "QUESTION"}
                </div>
                <p className="text-2xl font-medium leading-relaxed">
                  {flipped ? card.back : card.front}
                </p>
                <div className="mt-8">
                  <RotateCw className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-2">Click to flip</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            <Button
              size="lg"
              onClick={() => handleReview(1)}
              disabled={reviewCardMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
              data-testid="button-difficulty-hard"
            >
              <span className="font-semibold">Again</span>
              <span className="text-xs ml-2 opacity-80">1d</span>
            </Button>
            <Button
              size="lg"
              onClick={() => handleReview(2)}
              disabled={reviewCardMutation.isPending}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
              data-testid="button-difficulty-medium"
            >
              <span className="font-semibold">Hard</span>
              <span className="text-xs ml-2 opacity-80">3d</span>
            </Button>
            <Button
              size="lg"
              onClick={() => handleReview(3)}
              disabled={reviewCardMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
              data-testid="button-difficulty-medium-good"
            >
              <span className="font-semibold">Good</span>
              <span className="text-xs ml-2 opacity-80">10d</span>
            </Button>
            <Button
              size="lg"
              onClick={() => handleReview(5)}
              disabled={reviewCardMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              data-testid="button-difficulty-easy"
            >
              <span className="font-semibold">Easy</span>
              <span className="text-xs ml-2 opacity-80">21d</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
