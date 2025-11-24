import { useState } from "react";
import { Plus, Play, RotateCw, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Deck {
  id: string;
  title: string;
  subject: string;
  cards: number;
  mastered: number;
  learning: number;
  new: number;
  dueToday: number;
  lastStudied?: string;
  nextReview?: string;
}

export default function Flashcards() {
  const [view, setView] = useState<"decks" | "studying">("decks");
  const [flipped, setFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  const decks: Deck[] = [
    {
      id: "1",
      title: "React Hooks",
      subject: "Computer Science",
      cards: 24,
      mastered: 18,
      learning: 4,
      new: 2,
      dueToday: 5,
      lastStudied: "2 hours ago",
      nextReview: "Tomorrow",
    },
    {
      id: "2",
      title: "Calculus Formulas",
      subject: "Mathematics",
      cards: 35,
      mastered: 12,
      learning: 15,
      new: 8,
      dueToday: 12,
      lastStudied: "Yesterday",
      nextReview: "Today",
    },
    {
      id: "3",
      title: "Biology Terms",
      subject: "Biology",
      cards: 50,
      mastered: 45,
      learning: 3,
      new: 2,
      dueToday: 6,
      lastStudied: "3 days ago",
      nextReview: "Today",
    },
    {
      id: "4",
      title: "Spanish Vocabulary",
      subject: "Languages",
      cards: 100,
      mastered: 67,
      learning: 28,
      new: 5,
      dueToday: 0,
      nextReview: "In 2 days",
    },
  ];

  const sampleCards = [
    {
      front: "What is useState?",
      back: "A React Hook that lets you add state to functional components. Returns an array with the current state value and a function to update it.",
      interval: 7, // days until next review
      easeFactor: 2.5,
    },
    {
      front: "What is useEffect?",
      back: "A React Hook that lets you perform side effects in functional components. It runs after render and can optionally clean up.",
      interval: 3,
      easeFactor: 2.3,
    },
  ];

  if (view === "studying") {
    const card = sampleCards[currentCard];
    const progress = ((currentCard + 1) / sampleCards.length) * 100;

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Card {currentCard + 1} of {sampleCards.length}
              </span>
              <Badge variant="secondary" className="text-xs">
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
            <Card className="absolute inset-0 flex items-center justify-center transition-all hover-elevate">
              <CardContent className="p-8 text-center">
                <div className="text-sm text-muted-foreground mb-4">
                  {flipped ? "Back" : "Front"}
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

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                console.log("Marked as Hard - will review in 1 day");
                if (currentCard < sampleCards.length - 1) {
                  setCurrentCard(currentCard + 1);
                  setFlipped(false);
                }
              }}
              data-testid="button-difficulty-hard"
            >
              <span className="text-red-600 font-semibold">Hard</span>
              <span className="text-xs text-muted-foreground ml-2">1d</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                console.log("Marked as Medium - will review in 3 days");
                if (currentCard < sampleCards.length - 1) {
                  setCurrentCard(currentCard + 1);
                  setFlipped(false);
                }
              }}
              data-testid="button-difficulty-medium"
            >
              <span className="text-yellow-600 font-semibold">Medium</span>
              <span className="text-xs text-muted-foreground ml-2">3d</span>
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                console.log("Marked as Easy - will review in 7 days");
                if (currentCard < sampleCards.length - 1) {
                  setCurrentCard(currentCard + 1);
                  setFlipped(false);
                } else {
                  setView("decks");
                  setCurrentCard(0);
                  setFlipped(false);
                }
              }}
              data-testid="button-difficulty-easy"
            >
              <span className="font-semibold">Easy</span>
              <span className="text-xs ml-2">7d</span>
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Rate how well you knew this card - affects next review timing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Flashcards</h1>
            <p className="text-muted-foreground mt-2">Master concepts with spaced repetition</p>
          </div>
          <Button data-testid="button-create-deck">
            <Plus className="h-4 w-4 mr-2" />
            Create Deck
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Due Today</CardTitle>
                <Calendar className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {decks.reduce((sum, deck) => sum + deck.dueToday, 0)}
              </div>
              <p className="text-sm text-white/80 mt-1">cards to review</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Total Cards</CardTitle>
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {decks.reduce((sum, deck) => sum + deck.cards, 0)}
              </div>
              <p className="text-sm text-white/80 mt-1">across all decks</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Mastery Rate</CardTitle>
                <RotateCw className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {Math.round(
                  (decks.reduce((sum, deck) => sum + deck.mastered, 0) /
                    decks.reduce((sum, deck) => sum + deck.cards, 0)) *
                    100
                )}%
              </div>
              <p className="text-sm text-white/80 mt-1">cards mastered</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => {
            const progress = (deck.mastered / deck.cards) * 100;
            const hasDueCards = deck.dueToday > 0;

            return (
              <Card
                key={deck.id}
                className={`hover-elevate ${hasDueCards ? "border-2 border-green-500" : ""}`}
                data-testid={`card-deck-${deck.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">{deck.subject}</Badge>
                    {hasDueCards && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                        {deck.dueToday} due
                      </Badge>
                    )}
                  </div>
                  <CardTitle>{deck.title}</CardTitle>
                  <CardDescription className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{deck.mastered}</div>
                        <div className="text-muted-foreground">Mastered</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-yellow-600">{deck.learning}</div>
                        <div className="text-muted-foreground">Learning</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{deck.new}</div>
                        <div className="text-muted-foreground">New</div>
                      </div>
                    </div>
                    {deck.lastStudied && (
                      <div className="text-xs flex items-center justify-between pt-2 border-t">
                        <span className="text-muted-foreground">Last studied {deck.lastStudied}</span>
                      </div>
                    )}
                    {deck.nextReview && (
                      <div className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Next: {deck.nextReview}</span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <Button
                    variant={hasDueCards ? "default" : "outline"}
                    className="w-full"
                    onClick={() => {
                      setView("studying");
                      console.log(`Studying deck: ${deck.title}`);
                    }}
                    data-testid={`button-study-deck-${deck.id}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {hasDueCards ? `Study ${deck.dueToday} Cards` : "Study Deck"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
