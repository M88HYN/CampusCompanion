import { useState } from "react";
import { Plus, Play, RotateCw } from "lucide-react";
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
  lastStudied?: string;
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
      lastStudied: "2 hours ago",
    },
    {
      id: "2",
      title: "Calculus Formulas",
      subject: "Mathematics",
      cards: 35,
      mastered: 12,
      lastStudied: "Yesterday",
    },
    {
      id: "3",
      title: "Biology Terms",
      subject: "Biology",
      cards: 50,
      mastered: 45,
      lastStudied: "3 days ago",
    },
    {
      id: "4",
      title: "Spanish Vocabulary",
      subject: "Languages",
      cards: 100,
      mastered: 67,
    },
  ];

  const sampleCards = [
    {
      front: "What is useState?",
      back: "A React Hook that lets you add state to functional components. Returns an array with the current state value and a function to update it.",
    },
    {
      front: "What is useEffect?",
      back: "A React Hook that lets you perform side effects in functional components. It runs after render and can optionally clean up.",
    },
  ];

  if (view === "studying") {
    const card = sampleCards[currentCard];
    const progress = ((currentCard + 1) / sampleCards.length) * 100;

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Card {currentCard + 1} of {sampleCards.length}
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
                console.log("Marked as Hard");
                if (currentCard < sampleCards.length - 1) {
                  setCurrentCard(currentCard + 1);
                  setFlipped(false);
                }
              }}
              data-testid="button-difficulty-hard"
            >
              Hard
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                console.log("Marked as Medium");
                if (currentCard < sampleCards.length - 1) {
                  setCurrentCard(currentCard + 1);
                  setFlipped(false);
                }
              }}
              data-testid="button-difficulty-medium"
            >
              Medium
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                console.log("Marked as Easy");
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
              Easy
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Rate how well you knew this card
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => {
            const progress = (deck.mastered / deck.cards) * 100;
            return (
              <Card key={deck.id} className="hover-elevate" data-testid={`card-deck-${deck.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">{deck.subject}</Badge>
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(progress)}%
                    </div>
                  </div>
                  <CardTitle>{deck.title}</CardTitle>
                  <CardDescription>
                    {deck.cards} cards • {deck.mastered} mastered
                    {deck.lastStudied && (
                      <div className="text-xs mt-1">Last studied {deck.lastStudied}</div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={progress} className="h-2" />
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      setView("studying");
                      console.log(`Studying deck: ${deck.title}`);
                    }}
                    data-testid={`button-study-deck-${deck.id}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Study Now
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
