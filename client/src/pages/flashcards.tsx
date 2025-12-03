import { useState } from "react";
import { Plus, Play, RotateCw, Calendar, TrendingUp, Upload, X, Edit2, Trash2, Eye, EyeOff, Tags, Settings } from "lucide-react";
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

interface Deck {
  id: string;
  title: string;
  subject: string;
  description: string;
  cards: number;
  mastered: number;
  learning: number;
  new: number;
  dueToday: number;
  lastStudied?: string;
  nextReview?: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

interface Flashcard {
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
}

type ViewState = "decks" | "create-deck" | "create-card" | "studying" | "bulk-import";

export default function Flashcards() {
  const [view, setView] = useState<ViewState>("decks");
  const [flipped, setFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");

  // Form states
  const [deckForm, setDeckForm] = useState({
    title: "",
    subject: "",
    description: "",
    tags: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
  });

  const [cardForm, setCardForm] = useState({
    front: "",
    back: "",
  });

  const [bulkImportText, setBulkImportText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showStudySettings, setShowStudySettings] = useState(false);
  
  // Study preferences
  const [studyPreferences, setStudyPreferences] = useState({
    shuffleCards: true,
    answerDelay: "3" as "0" | "3" | "5" | "10",
    autoAdvance: false,
    autoAdvanceDelay: "3",
    showProgress: true,
  });

  const decks: Deck[] = [
    {
      id: "1",
      title: "React Hooks",
      subject: "Computer Science",
      description: "Essential React Hooks for modern development",
      cards: 24,
      mastered: 18,
      learning: 4,
      new: 2,
      dueToday: 5,
      lastStudied: "2 hours ago",
      nextReview: "Tomorrow",
      difficulty: "medium",
      tags: ["react", "javascript", "frontend"],
    },
    {
      id: "2",
      title: "Calculus Formulas",
      subject: "Mathematics",
      description: "Important calculus formulas and theorems",
      cards: 35,
      mastered: 12,
      learning: 15,
      new: 8,
      dueToday: 12,
      lastStudied: "Yesterday",
      nextReview: "Today",
      difficulty: "hard",
      tags: ["math", "calculus", "exam"],
    },
    {
      id: "3",
      title: "Biology Terms",
      subject: "Biology",
      description: "Key biological terms and definitions",
      cards: 50,
      mastered: 45,
      learning: 3,
      new: 2,
      dueToday: 6,
      lastStudied: "3 days ago",
      nextReview: "Today",
      difficulty: "easy",
      tags: ["biology", "vocabulary"],
    },
  ];

  const sampleCards = [
    {
      front: "What is useState?",
      back: "A React Hook that lets you add state to functional components. Returns an array with the current state value and a function to update it.",
      interval: 7,
      easeFactor: 2.5,
    },
    {
      front: "What is useEffect?",
      back: "A React Hook that lets you perform side effects in functional components. It runs after render and can optionally clean up.",
      interval: 3,
      easeFactor: 2.3,
    },
  ];

  const handleCreateDeck = () => {
    console.log("Creating deck:", deckForm);
    setDeckForm({ title: "", subject: "", description: "", tags: "", difficulty: "medium" });
    setView("decks");
  };

  const handleAddCard = () => {
    console.log("Adding card:", cardForm);
    setCardForm({ front: "", back: "" });
  };

  const parseBulkImport = () => {
    const lines = bulkImportText.split("\n").filter(line => line.trim());
    return lines.map(line => {
      const [front, back] = line.split("|").map(s => s.trim());
      return { front: front || "", back: back || "" };
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 border-green-300 dark:border-green-700";
      case "medium":
        return "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 border-yellow-300 dark:border-yellow-700";
      case "hard":
        return "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900 dark:to-rose-900 border-red-300 dark:border-red-700";
      default:
        return "";
    }
  };

  // Decks View
  if (view === "decks") {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Flashcards</h1>
            <p className="text-lg opacity-90 max-w-2xl">Master topics with spaced repetition learning</p>
          </div>

          {/* Create Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setView("create-deck")}
              className="h-24 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg font-semibold rounded-xl"
              data-testid="button-create-deck"
            >
              <Plus className="h-6 w-6 mr-2" />
              Create New Deck
            </Button>
            <Button
              onClick={() => setView("bulk-import")}
              className="h-24 bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-lg font-semibold rounded-xl"
              data-testid="button-bulk-import"
            >
              <Upload className="h-6 w-6 mr-2" />
              Bulk Import
            </Button>
            <Button
              variant="outline"
              className="h-24 border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 text-lg font-semibold rounded-xl hover:bg-green-50 dark:hover:bg-green-950"
              data-testid="button-import-from-quiz"
            >
              <TrendingUp className="h-6 w-6 mr-2" />
              From Quiz Mistakes
            </Button>
          </div>

          {/* Study Preferences */}
          <Card className="border-2 border-green-300 dark:border-green-700">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 cursor-pointer" onClick={() => setShowStudySettings(!showStudySettings)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>Study Mode Preferences</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">Customize your learning</Badge>
              </div>
            </CardHeader>
            {showStudySettings && (
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover-elevate">
                      <div>
                        <p className="font-semibold text-sm">Shuffle Cards</p>
                        <p className="text-xs text-muted-foreground">Randomize card order during study</p>
                      </div>
                      <Switch
                        checked={studyPreferences.shuffleCards}
                        onCheckedChange={(checked) => 
                          setStudyPreferences({...studyPreferences, shuffleCards: checked})
                        }
                        data-testid="switch-shuffle-cards"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <p className="font-semibold text-sm mb-2">Answer Reveal Delay</p>
                      <Select 
                        value={studyPreferences.answerDelay} 
                        onValueChange={(value) => 
                          setStudyPreferences({...studyPreferences, answerDelay: value as any})
                        }
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
                      <p className="text-xs text-muted-foreground mt-1">Delay before showing answer (forces thinking time)</p>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover-elevate">
                      <div>
                        <p className="font-semibold text-sm">Auto-Advance Cards</p>
                        <p className="text-xs text-muted-foreground">Move to next card automatically</p>
                      </div>
                      <Switch
                        checked={studyPreferences.autoAdvance}
                        onCheckedChange={(checked) => 
                          setStudyPreferences({...studyPreferences, autoAdvance: checked})
                        }
                        data-testid="switch-auto-advance"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <p className="font-semibold text-sm mb-2">Auto-Advance Delay</p>
                      <Select 
                        value={studyPreferences.autoAdvanceDelay}
                        onValueChange={(value) => 
                          setStudyPreferences({...studyPreferences, autoAdvanceDelay: value})
                        }
                        disabled={!studyPreferences.autoAdvance}
                      >
                        <SelectTrigger className="border-green-300 dark:border-green-700" data-testid="select-auto-advance-delay">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 seconds</SelectItem>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="8">8 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Wait time before moving to next card</p>
                    </label>
                  </div>
                </div>

                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg border border-green-300 dark:border-green-700">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    💡 Tip: Enable "Shuffle" and longer answer delays to improve retention and reduce memorization of card order.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Decks Grid */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Your Decks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <Card
                  key={deck.id}
                  className={`border-2 cursor-pointer hover:shadow-lg transition-shadow ${getDifficultyColor(deck.difficulty)}`}
                  data-testid={`card-deck-${deck.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{deck.title}</CardTitle>
                        <CardDescription className="text-xs">{deck.subject}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setView("create-card")}
                          data-testid={`button-edit-deck-${deck.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600"
                          data-testid={`button-delete-deck-${deck.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{deck.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {deck.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold">Progress</span>
                        <span className="text-muted-foreground">{deck.mastered + deck.learning} / {deck.cards}</span>
                      </div>
                      <Progress value={((deck.mastered + deck.learning) / deck.cards) * 100} className="h-2" />
                    </div>

                    {/* Status Badges */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded text-center">
                        <p className="text-xs text-muted-foreground">Mastered</p>
                        <p className="font-bold text-green-600 dark:text-green-400">{deck.mastered}</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded text-center">
                        <p className="text-xs text-muted-foreground">Learning</p>
                        <p className="font-bold text-yellow-600 dark:text-yellow-400">{deck.learning}</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded text-center">
                        <p className="text-xs text-muted-foreground">New</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400">{deck.new}</p>
                      </div>
                    </div>

                    {/* Study Info */}
                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                      <p>📚 Due Today: <span className="font-semibold text-orange-600">{deck.dueToday}</span></p>
                      <p>⏱️ Last Studied: {deck.lastStudied || "Never"}</p>
                      <p>🔄 Next Review: {deck.nextReview}</p>
                    </div>

                    {/* Study Button */}
                    <Button
                      onClick={() => {
                        setSelectedDeckId(deck.id);
                        setView("studying");
                        setCurrentCard(0);
                        setFlipped(false);
                      }}
                      className="w-full mt-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      data-testid={`button-study-deck-${deck.id}`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Studying
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Deck View
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="difficulty" className="font-semibold">Difficulty Level</Label>
                  <Select value={deckForm.difficulty} onValueChange={(value) => setDeckForm({ ...deckForm, difficulty: value as "easy" | "medium" | "hard" })}>
                    <SelectTrigger className="border-2 border-green-200 dark:border-green-800" data-testid="select-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy (Beginner)</SelectItem>
                      <SelectItem value="medium">Medium (Intermediate)</SelectItem>
                      <SelectItem value="hard">Hard (Advanced)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Description</Label>
                <textarea
                  id="description"
                  placeholder="What is this deck about?"
                  value={deckForm.description}
                  onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
                  className="w-full p-3 border-2 border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-slate-900"
                  rows={4}
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
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  data-testid="button-save-deck"
                >
                  <Plus className="h-4 w-4 mr-2" />
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

  // Create/Edit Card View
  if (view === "create-card") {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
              <CardTitle>Add Cards to Deck</CardTitle>
              <CardDescription>Create flashcards for your study session</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="front" className="font-semibold">Front (Question/Prompt) *</Label>
                <textarea
                  id="front"
                  placeholder="What should students be asked?"
                  value={cardForm.front}
                  onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
                  className="w-full p-3 border-2 border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500"
                  rows={3}
                  data-testid="textarea-front"
                />
                <p className="text-xs text-muted-foreground">Tip: Keep questions concise and clear</p>
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
                <p className="text-xs text-muted-foreground">Tip: Provide detailed but concise answers</p>
              </div>

              {/* Preview */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground mb-2">PREVIEW</p>
                <div className="space-y-2">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded border-l-4 border-green-500">
                    <p className="text-xs text-muted-foreground">Front</p>
                    <p className="font-medium">{cardForm.front || "Your question will appear here..."}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded border-l-4 border-emerald-500">
                    <p className="text-xs text-muted-foreground">Back</p>
                    <p className="font-medium">{cardForm.back || "Your answer will appear here..."}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddCard}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  data-testid="button-add-card"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
                <Button
                  onClick={() => setView("decks")}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-done-adding"
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Bulk Import View
  if (view === "bulk-import") {
    const importedCards = bulkImportText.trim() ? parseBulkImport() : [];
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="max-w-4xl mx-auto p-6">
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
                  <strong>Format:</strong> Enter one card per line using the format: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">Front Text | Back Text</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-input" className="font-semibold">Paste Your Cards</Label>
                <textarea
                  id="bulk-input"
                  placeholder="What is React? | A JavaScript library for building UIs&#10;What is useState? | A hook for managing component state&#10;Define memoization? | Optimization technique to cache function results"
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  className="w-full p-4 border-2 border-green-200 dark:border-green-800 rounded-lg bg-white dark:bg-slate-900 font-mono text-sm"
                  rows={8}
                  data-testid="textarea-bulk-import"
                />
              </div>

              {importedCards.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Preview: {importedCards.length} cards ready to import</p>
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
                      {importedCards.slice(0, 10).map((card, index) => (
                        <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Card {index + 1}</p>
                          <p className="text-sm font-medium mb-1">Q: {card.front}</p>
                          <p className="text-sm text-muted-foreground">A: {card.back}</p>
                        </div>
                      ))}
                      {importedCards.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          ... and {importedCards.length - 10} more cards
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    console.log("Importing", importedCards.length, "cards");
                    setView("decks");
                    setBulkImportText("");
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  disabled={importedCards.length === 0}
                  data-testid="button-import-cards"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import {importedCards.length} Cards
                </Button>
                <Button
                  onClick={() => {
                    setView("decks");
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

  // Studying View
  if (view === "studying") {
    const card = sampleCards[currentCard];
    const progress = ((currentCard + 1) / sampleCards.length) * 100;

    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Card {currentCard + 1} of {sampleCards.length}
              </span>
              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100">
                Next review: {card.interval}d
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
              onClick={() => {
                if (currentCard < sampleCards.length - 1) {
                  setCurrentCard(currentCard + 1);
                  setFlipped(false);
                }
              }}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
              data-testid="button-difficulty-hard"
            >
              <span className="font-semibold">Again</span>
              <span className="text-xs ml-2 opacity-80">1d</span>
            </Button>
            <Button
              size="lg"
              onClick={() => {
                if (currentCard < sampleCards.length - 1) {
                  setCurrentCard(currentCard + 1);
                  setFlipped(false);
                }
              }}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
              data-testid="button-difficulty-medium"
            >
              <span className="font-semibold">Hard</span>
              <span className="text-xs ml-2 opacity-80">3d</span>
            </Button>
            <Button
              size="lg"
              onClick={() => {
                if (currentCard < sampleCards.length - 1) {
                  setCurrentCard(currentCard + 1);
                  setFlipped(false);
                }
              }}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
              data-testid="button-difficulty-medium-good"
            >
              <span className="font-semibold">Good</span>
              <span className="text-xs ml-2 opacity-80">10d</span>
            </Button>
            <Button
              size="lg"
              onClick={() => {
                if (currentCard < sampleCards.length - 1) {
                  setCurrentCard(currentCard + 1);
                  setFlipped(false);
                }
              }}
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
