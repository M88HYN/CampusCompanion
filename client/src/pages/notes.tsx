import { useState, useEffect, useCallback, useRef } from "react";
import { marked } from "marked";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ChevronRight, 
  Folder, 
  FolderOpen,
  FileText, 
  Plus, 
  Search, 
  MoreVertical,
  Save,
  Tag,
  CheckCircle2,
  Zap,
  Trash2,
  Edit,
  Loader2,
  X,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Code,
  List,
  ListOrdered,
  Quote,
  Sparkles,
  BookOpen,
  HelpCircle,
  Link,
  Lightbulb,
  BookMarked,
  Workflow,
  Target,
  GraduationCap,
  Eye,
  Brain,
  ListChecks,
  ClipboardList,
  Copy,
  Download,
  Edit2,
  AlertCircle,
  Underline,
  MessageSquare,
  Send,
  PanelRightClose,
  RotateCcw,
  FileQuestion,
  Wand2,
  FolderInput,
  FileDown,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
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
import { useLocation } from "wouter";
import { normalizeTags } from "@/lib/tag-utils";
import type { Note, Deck } from "@shared/schema";

interface NoteWithBlocks extends Note {
  blocks?: { id: string; type: string; content: string; order: number }[];
}

function MarkdownPreview({ content }: { content: string }) {
  const html = marked(content, {
    breaks: true,
    gfm: true,
  });

  return (
    <div
      className="prose dark:prose-invert prose-sm sm:prose-base max-w-none
        prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4
        prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-3
        prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-2
        prose-p:text-base prose-p:mb-3
        prose-li:text-base prose-li:mb-1
        prose-code:bg-slate-100 prose-code:dark:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded
        prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:italic prose-blockquote:text-slate-600 prose-blockquote:dark:text-slate-400
        prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:underline
        prose-strong:font-bold
        prose-em:italic"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function FormatButton({ 
  icon: Icon, 
  label, 
  shortcut, 
  onClick, 
  active = false,
  disabled = false
}: { 
  icon: React.ElementType; 
  label: string; 
  shortcut?: string; 
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
          disabled={disabled}
          data-testid={`button-format-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}{shortcut && <span className="ml-2 text-muted-foreground">{shortcut}</span>}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Notes() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteSubject, setNewNoteSubject] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [flashcardFront, setFlashcardFront] = useState("");
  const [flashcardBack, setFlashcardBack] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [quizExplanation, setQuizExplanation] = useState("");
  const [recallMode, setRecallMode] = useState(false);
  const [selectedNoteType, setSelectedNoteType] = useState<string>("general");
  const [showExamPrompt, setShowExamPrompt] = useState(false);
  const [examPromptType, setExamPromptType] = useState<string>("SAQ");
  const [examMarks, setExamMarks] = useState<number>(4);
  const [keyTermsInput, setKeyTermsInput] = useState("");
  const [showAutoGenerateDialog, setShowAutoGenerateDialog] = useState(false);
  const [autoGenerateType, setAutoGenerateType] = useState<"quiz" | "flashcards">("quiz");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteNoteTrigger, setDeleteNoteTrigger] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveNoteId, setMoveNoteId] = useState<string | null>(null);
  const [moveTargetFolder, setMoveTargetFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [contextNoteId, setContextNoteId] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  
  // AI Ask panel state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiResponseRef = useRef<HTMLDivElement>(null);
  
  // Exam Maker state
  const [showExamMakerDialog, setShowExamMakerDialog] = useState(false);
  const [examQuestions, setExamQuestions] = useState<{type: string; question: string; answer: string; marks: number}[]>([]);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
    retry: 1,
  });

  const { data: selectedNote } = useQuery<NoteWithBlocks>({
    queryKey: ["/api/notes", selectedNoteId],
    enabled: !!selectedNoteId,
    retry: 1,
  });

  const { data: decks = [], isLoading: decksLoading } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
    retry: 1,
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<{ id: string; title: string; subject: string | null }[]>({
    queryKey: ["/api/quizzes"],
    retry: 1,
  });

  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteSubject(selectedNote.subject || "");
      setNoteTags(normalizeTags(selectedNote.tags));
      const content = selectedNote.blocks?.map(b => b.content).join("\n\n") || "";
      setNoteContent(content);
      setIsSaved(true);
    }
  }, [selectedNote]);

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  const createNoteMutation = useMutation({
    mutationFn: async (data: { title: string; subject?: string; tags?: string[] }) => {
      console.log("[NOTES API] Sending POST /api/notes", data);
      const res = await apiRequest("POST", "/api/notes", {
        ...data,
        blocks: [{ type: "markdown", content: "" }],
      });
      console.log("[NOTES API] Response status:", res.status);
      const result = await res.json();
      console.log("[NOTES API] Response data:", result);
      return result;
    },
    onSuccess: (newNote) => {
      console.log("[NOTES] Create note SUCCESS:", newNote.id);
      // Update cache immediately with new note instead of invalidating
      queryClient.setQueryData(["/api/notes"], (oldNotes: Note[] | undefined) => {
        return oldNotes ? [...oldNotes, newNote] : [newNote];
      });
      
      setSelectedNoteId(newNote.id);
      setShowNewNoteDialog(false);
      setNewNoteTitle("");
      setNewNoteSubject("");
      toast({ title: "Note created", description: "Your new note is ready." });
    },
    onError: (error: Error) => {
      console.error("[NOTES] Create note ERROR:", error);
      toast({ title: "Error", description: error.message || "Failed to create note", variant: "destructive" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data, content }: { id: string; data: Partial<Note>; content?: string }) => {
      console.log("[NOTES API] Sending PATCH /api/notes/:id", { id, hasContent: !!content });
      const payload: any = { ...data };
      if (content !== undefined) {
        payload.blocks = [{ type: "markdown", content }];
      }
      const res = await apiRequest("PATCH", `/api/notes/${id}`, payload);
      console.log("[NOTES API] Response status:", res.status);
      const responseData = await res.json();
      console.log("[NOTES API] Response data:", responseData);
      return { response: responseData, savedContent: content, savedTitle: data.title };
    },
    onSuccess: (result) => {
      console.log("[NOTES] Update note SUCCESS");
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes", selectedNoteId] });
      if (noteContent === result.savedContent && noteTitle === result.savedTitle) {
        setIsSaved(true);
      }
      toast({ title: "Note saved", description: "Changes saved successfully." });
    },
    onError: (error: Error) => {
      console.error("[NOTES] Update note ERROR:", error);
      toast({ title: "Error", description: error.message || "Failed to save note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("[NOTES API] Sending DELETE /api/notes/:id", id);
      const res = await apiRequest("DELETE", `/api/notes/${id}`);
      console.log("[NOTES API] Response status:", res.status);
      console.log("[NOTES API] Delete SUCCESS");
    },
    onSuccess: () => {
      console.log("[NOTES] Delete note SUCCESS");
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      const remaining = notes.filter(n => n.id !== selectedNoteId);
      setSelectedNoteId(remaining[0]?.id || null);
      toast({ title: "Note deleted", description: "Note has been deleted successfully." });
    },
    onError: (error: Error) => {
      console.error("[NOTES] Delete note ERROR:", error);
      toast({ title: "Error", description: error.message || "Failed to delete note", variant: "destructive" });
    },
  });

  const createFlashcardMutation = useMutation({
    mutationFn: async (data: { deckId: string; front: string; back: string }) => {
      const res = await apiRequest("POST", `/api/decks/${data.deckId}/cards`, {
        front: data.front,
        back: data.back,
        type: "basic",
      });
      return res.json();
    },
    onSuccess: (newCard) => {
      // Update deck data in cache
      queryClient.setQueryData(["/api/decks"], (oldDecks: Deck[] | undefined) => {
        return oldDecks ? oldDecks : [];
      });
      setShowFlashcardDialog(false);
      setFlashcardFront("");
      setFlashcardBack("");
      setSelectedDeckId("");
      toast({ 
        title: "Flashcard created", 
        description: "Your flashcard has been added to the deck.",
      });
    },
    onError: (error: Error) => {
      console.error("Create flashcard error:", error);
      toast({ title: "Error", description: error.message || "Failed to create flashcard", variant: "destructive" });
    },
  });

  const createQuizQuestionMutation = useMutation({
    mutationFn: async (data: { 
      quizId: string; 
      question: string; 
      options: { text: string; isCorrect: boolean }[];
      explanation: string;
    }) => {
      const res = await apiRequest("POST", `/api/quizzes/${data.quizId}/questions`, {
        question: data.question,
        type: "mcq",
        difficulty: 3,
        marks: 1,
        order: 0,
        explanation: data.explanation || "Review this concept in your notes.",
        options: data.options,
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate quizzes to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setShowQuizDialog(false);
      setQuizQuestion("");
      setQuizOptions(["", "", "", ""]);
      setCorrectOptionIndex(0);
      setSelectedQuizId("");
      setQuizExplanation("");
      toast({ 
        title: "Quiz question created", 
        description: "Your question has been added to the quiz.",
      });
    },
    onError: (error: Error) => {
      console.error("Create quiz question error:", error);
      toast({ title: "Error", description: error.message || "Failed to create quiz question", variant: "destructive" });
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: async ({ noteId, questionCount }: { noteId: string; questionCount?: number }) => {
      console.log("[NOTES AI] Sending POST /api/notes/:id/generate-quiz", { noteId, questionCount });
      const res = await apiRequest("POST", `/api/notes/${noteId}/generate-quiz`, { questionCount });
      console.log("[NOTES AI] Response status:", res.status);
      const result = await res.json();
      console.log("[NOTES AI] Response data:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("[NOTES AI] Generate quiz SUCCESS");
      // Invalidate and refetch quizzes
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setShowAutoGenerateDialog(false);
      setIsGenerating(false);
      toast({ 
        title: "Quiz Generated!", 
        description: data.message || "Quiz created successfully from your note.",
      });
    },
    onError: (error: Error) => {
      console.error("[NOTES AI] Generate quiz ERROR:", error);
      setIsGenerating(false);
      toast({ title: "Error", description: error.message || "Failed to generate quiz from note", variant: "destructive" });
    },
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: async ({ noteId, deckId }: { noteId: string; deckId: string }) => {
      console.log("[NOTES AI] Sending POST /api/notes/:id/generate-flashcards", { noteId, deckId });
      const res = await apiRequest("POST", `/api/notes/${noteId}/generate-flashcards`, { deckId });
      console.log("[NOTES AI] Response status:", res.status);
      const result = await res.json();
      console.log("[NOTES AI] Response data:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("[NOTES AI] Generate flashcards SUCCESS");
      // Invalidate and refetch decks
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setShowAutoGenerateDialog(false);
      setIsGenerating(false);
      toast({ 
        title: "Flashcards Generated!", 
        description: data.message || "Flashcards created successfully from your note.",
      });
    },
    onError: (error: Error) => {
      console.error("[NOTES AI] Generate flashcards ERROR:", error);
      setIsGenerating(false);
      toast({ title: "Error", description: error.message || "Failed to generate flashcards from note", variant: "destructive" });
    },
  });

  const handleAutoGenerate = () => {
    console.log("[NOTES] Auto Generate button clicked - type:", autoGenerateType);
    console.log("[NOTES] Handler entered - selectedNoteId:", selectedNoteId);
    if (!selectedNoteId) {
      console.log("[NOTES] Auto Generate blocked - no note selected");
      toast({ title: "No note selected", description: "Please select a note first", variant: "destructive" });
      return;
    }
    
    const token = localStorage.getItem("token");
    console.log("[NOTES] Auth check - token exists:", !!token);
    
    setIsGenerating(true);
    
    if (autoGenerateType === "quiz") {
      console.log("[NOTES] Calling generateQuiz mutation");
      generateQuizMutation.mutate({ noteId: selectedNoteId, questionCount: 5 });
    } else {
      if (!selectedDeckId) {
        console.log("[NOTES] Auto Generate blocked - no deck selected");
        setIsGenerating(false);
        toast({ title: "Select a deck", description: "Please select a deck for the flashcards", variant: "destructive" });
        return;
      }
      console.log("[NOTES] Calling generateFlashcards mutation - deckId:", selectedDeckId);
      generateFlashcardsMutation.mutate({ noteId: selectedNoteId, deckId: selectedDeckId });
    }
  };

  const insertExamPrompt = () => {
    const annotation = `\n\n> **${examPromptType}** (${examMarks} marks)\n`;
    setNoteContent(noteContent + annotation);
    setIsSaved(false);
    setShowExamPrompt(false);
    toast({ title: "Exam prompt added", description: `Added ${examPromptType} annotation (${examMarks} marks)` });
  };

  const getRecallContent = (content: string): string => {
    if (!recallMode || !keyTermsInput) return content;
    
    const terms = keyTermsInput.split(',').map(t => t.trim()).filter(Boolean);
    let maskedContent = content;
    
    for (const term of terms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      maskedContent = maskedContent.replace(regex, '▓'.repeat(term.length));
    }
    
    return maskedContent;
  };

  const handleSave = useCallback(() => {
    if (!selectedNoteId || updateNoteMutation.isPending) return;
    updateNoteMutation.mutate({
      id: selectedNoteId,
      data: {
        title: noteTitle,
        subject: noteSubject || undefined,
        tags: noteTags.length > 0 ? noteTags : undefined,
      },
      content: noteContent,
    });
  }, [selectedNoteId, noteTitle, noteSubject, noteTags, noteContent, updateNoteMutation]);

  useEffect(() => {
    if (!isSaved && selectedNoteId && !updateNoteMutation.isPending) {
      const timer = setTimeout(() => {
        handleSave();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSaved, noteTitle, noteContent, noteSubject, noteTags, handleSave, selectedNoteId, updateNoteMutation.isPending]);

  const insertFormat = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = noteContent.substring(start, end);
    const newText = noteContent.substring(0, start) + before + selected + after + noteContent.substring(end);
    
    setNoteContent(newText);
    setIsSaved(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lineStart = noteContent.lastIndexOf('\n', start - 1) + 1;
    const newText = noteContent.substring(0, lineStart) + prefix + noteContent.substring(lineStart);
    
    setNoteContent(newText);
    setIsSaved(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertFormat('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertFormat('*', '*');
          break;
        case 'u':
          e.preventDefault();
          insertFormat('<u>', '</u>');
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
      }
    }
  };

  const getSelectedText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return "";
    return noteContent.substring(textarea.selectionStart, textarea.selectionEnd);
  };

  const openFlashcardDialog = () => {
    const selected = getSelectedText();
    setSelectedText(selected);
    setFlashcardFront(selected || noteTitle);
    setFlashcardBack("");
    setShowFlashcardDialog(true);
  };

  const openQuizDialog = () => {
    const selected = getSelectedText();
    setSelectedText(selected);
    setQuizQuestion(selected || "");
    setQuizOptions(["", "", "", ""]);
    setCorrectOptionIndex(0);
    setShowQuizDialog(true);
  };

  const askInsightScout = () => {
    const selected = getSelectedText() || noteTitle;
    setAiQuery(selected);
    setAiResponse("");
    setShowAiPanel(true);
  };

  const sendAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse("");

    try {
      const token = localStorage.getItem("token");
      const contextPrefix = noteContent
        ? `Based on the following note content:\n\n${noteContent.substring(0, 1500)}\n\n---\n\n`
        : "";
      
      const response = await fetch("/api/research/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: `${contextPrefix}${aiQuery}`,
          searchDepth: "balanced",
          responseType: "explanation",
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setAiResponse(accumulated);
              }
              if (data.error) {
                setAiResponse(prev => prev + `\n\nError: ${data.error}`);
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI request failed";
      setAiResponse(`Error: ${message}. Make sure the AI service is configured with a valid API key.`);
    } finally {
      setAiLoading(false);
    }
  };

  const generateExamQuestions = () => {
    if (!noteContent.trim()) {
      toast({ title: "No content", description: "Add some note content first to generate exam questions.", variant: "destructive" });
      return;
    }
    
    setIsGeneratingExam(true);
    setExamQuestions([]);

    // Parse note content to extract meaningful sections
    const lines = noteContent.split("\n").filter(l => l.trim().length > 10);
    const generated: {type: string; question: string; answer: string; marks: number}[] = [];

    // Extract headings and their content
    const sections: {heading: string; content: string}[] = [];
    let currentHeading = noteTitle || "General";
    let currentContent = "";

    for (const line of lines) {
      if (line.startsWith("# ") || line.startsWith("## ")) {
        if (currentContent.trim()) {
          sections.push({ heading: currentHeading, content: currentContent.trim() });
        }
        currentHeading = line.replace(/^#+\s*/, "");
        currentContent = "";
      } else {
        currentContent += line + "\n";
      }
    }
    if (currentContent.trim()) {
      sections.push({ heading: currentHeading, content: currentContent.trim() });
    }

    // If no sections found, treat entire content as one section
    if (sections.length === 0) {
      sections.push({ heading: noteTitle || "General", content: noteContent });
    }

    for (const section of sections.slice(0, 6)) {
      const contentSnippet = section.content.substring(0, 300);
      
      // Generate SAQ
      generated.push({
        type: "SAQ",
        question: `Define and explain: ${section.heading}`,
        answer: contentSnippet,
        marks: 4,
      });

      // Generate MCQ concept check
      if (section.content.length > 50) {
        generated.push({
          type: "MCQ",
          question: `Which of the following best describes ${section.heading.toLowerCase()}?`,
          answer: contentSnippet.split(/[.!?]/)[0] || contentSnippet.substring(0, 100),
          marks: 1,
        });
      }

      // Generate explain question
      if (section.content.length > 100) {
        generated.push({
          type: "Explain",
          question: `Explain the key concepts related to ${section.heading.toLowerCase()} and their significance.`,
          answer: contentSnippet,
          marks: 6,
        });
      }
    }

    setExamQuestions(generated.slice(0, 10));
    setIsGeneratingExam(false);
    setShowExamMakerDialog(true);
  };

  const autoExtractKeyTerms = () => {
    if (!noteContent.trim()) return;
    
    // Extract potential key terms from content
    const terms: string[] = [];
    
    // Extract bold text (**term**)
    const boldMatches = noteContent.match(/\*\*(.*?)\*\*/g);
    if (boldMatches) {
      boldMatches.forEach(m => terms.push(m.replace(/\*\*/g, "")));
    }
    
    // Extract text after "is a", "refers to", "defined as" patterns  
    const definitionPatterns = [
      /(\w[\w\s]{2,30})\s+(?:is a|is an|refers to|means|defined as)/gi,
      /(?:define|concept of|term)\s+["']?(\w[\w\s]{2,30})["']?/gi,
    ];
    
    for (const pattern of definitionPatterns) {
      let match;
      while ((match = pattern.exec(noteContent)) !== null) {
        const term = match[1].trim();
        if (term.length >= 3 && term.length <= 40) {
          terms.push(term);
        }
      }
    }
    
    // Extract heading text as key terms
    const headingMatches = noteContent.match(/^#+\s+(.+)$/gm);
    if (headingMatches) {
      headingMatches.forEach(h => {
        const term = h.replace(/^#+\s+/, "").trim();
        if (term.length >= 3 && term.length <= 50) {
          terms.push(term);
        }
      });
    }
    
    // Deduplicate
    const unique = [...new Set(terms.map(t => t.toLowerCase()))].map(t =>
      terms.find(orig => orig.toLowerCase() === t) || t
    );
    
    if (unique.length > 0) {
      setKeyTermsInput(unique.slice(0, 15).join(", "));
      setRecallMode(true);
      toast({ title: "Key terms extracted", description: `Found ${unique.length} key terms from your notes.` });
    } else {
      toast({ title: "No terms found", description: "Try adding **bold** terms or headings to your notes.", variant: "destructive" });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !noteTags.includes(tagInput.trim())) {
      setNoteTags([...noteTags, tagInput.trim()]);
      setTagInput("");
      setIsSaved(false);
    }
  };

  const removeTag = (tag: string) => {
    setNoteTags(noteTags.filter(t => t !== tag));
    setIsSaved(false);
  };

  const toggleSubject = (subject: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subject)) {
      newExpanded.delete(subject);
    } else {
      newExpanded.add(subject);
    }
    setExpandedSubjects(newExpanded);
  };

  const handleRenameNote = () => {
    if (!selectedNoteId || !renameTitle.trim()) {
      toast({ title: "Invalid title", description: "Please enter a valid note title", variant: "destructive" });
      return;
    }
    
    updateNoteMutation.mutate({
      id: selectedNoteId,
      data: { title: renameTitle },
    });
    
    setNoteTitle(renameTitle);
    setShowRenameDialog(false);
    setRenameTitle("");
  };

  const handleDeleteNote = () => {
    if (!selectedNoteId) return;
    setDeleteNoteTrigger(selectedNoteId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteNote = () => {
    if (!deleteNoteTrigger) return;
    deleteNoteMutation.mutate(deleteNoteTrigger);
    setShowDeleteDialog(false);
    setDeleteNoteTrigger(null);
  };

  const handleExportNote = () => {
    if (!selectedNoteId || !noteTitle) return;
    
    const content = `${noteTitle}
${noteSubject ? `Subject: ${noteSubject}` : ""}
${noteTags.length > 0 ? `Tags: ${noteTags.join(", ")}` : ""}
${"=".repeat(50)}

${noteContent}`;

    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${noteTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({ title: "Exported", description: "Note exported as text file." });
  };

  const handleExportPDF = () => {
    if (!selectedNoteId || !noteTitle) return;

    // Build a styled HTML document for printing to PDF
    const htmlContent = marked(noteContent, { breaks: true, gfm: true });
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Blocked", description: "Please allow pop-ups to export as PDF.", variant: "destructive" });
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${noteTitle}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 28px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; color: #1e40af; }
  h2 { font-size: 22px; color: #1e40af; margin-top: 24px; }
  h3 { font-size: 18px; color: #2563eb; }
  .meta { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  .meta span { margin-right: 16px; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
  pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; color: inherit; }
  blockquote { border-left: 4px solid #3b82f6; margin-left: 0; padding-left: 16px; color: #475569; font-style: italic; }
  table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
  @media print { body { margin: 0; } }
</style></head><body>
<h1>${noteTitle}</h1>
<div class="meta">
  ${noteSubject ? `<span>📚 ${noteSubject}</span>` : ""}
  ${noteTags.length > 0 ? `<span>🏷️ ${noteTags.join(", ")}</span>` : ""}
  <span>📅 ${new Date().toLocaleDateString()}</span>
</div>
${htmlContent}
</body></html>`);
    printWindow.document.close();
    
    // Wait for content to render, then trigger print dialog (Save as PDF)
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    toast({ title: "PDF Export", description: "Use 'Save as PDF' in the print dialog." });
  };

  const handleExportNoteById = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // If this is the selected note, use live content
    if (noteId === selectedNoteId) {
      handleExportNote();
      return;
    }

    // Otherwise export with what we know from the list
    const content = `${note.title}
${note.subject ? `Subject: ${note.subject}` : ""}
${"=".repeat(50)}

(Open the note to export full content)`;

    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${note.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: "Exported", description: "Note exported as text file." });
  };

  const handleMoveNote = () => {
    if (!moveNoteId) return;
    const targetFolder = moveTargetFolder === "__new__" ? newFolderName.trim() : moveTargetFolder;
    if (!targetFolder) {
      toast({ title: "Select a folder", description: "Please choose a destination folder.", variant: "destructive" });
      return;
    }

    updateNoteMutation.mutate({
      id: moveNoteId,
      data: { subject: targetFolder },
    });

    // If moving the currently selected note, update local state
    if (moveNoteId === selectedNoteId) {
      setNoteSubject(targetFolder);
    }

    setShowMoveDialog(false);
    setMoveNoteId(null);
    setMoveTargetFolder("");
    setNewFolderName("");
    toast({ title: "Note moved", description: `Moved to "${targetFolder}".` });
  };

  const openMoveDialog = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    setMoveNoteId(noteId);
    setMoveTargetFolder(note?.subject || "Uncategorized");
    setNewFolderName("");
    setShowMoveDialog(true);
  };

  const handleDeleteNoteById = (noteId: string) => {
    setDeleteNoteTrigger(noteId);
    setShowDeleteDialog(true);
  };

  // Get all unique folder/subject names for the move dropdown
  const allFolders = [...new Set(notes.map(n => n.subject || "Uncategorized"))].sort();

  const handleCopyToClipboard = async () => {
    if (!noteTitle) return;
    
    const content = `${noteTitle}
${noteContent}`;

    try {
      await navigator.clipboard.writeText(content);
      toast({ title: "Copied", description: "Note content copied to clipboard." });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({ title: "Error", description: "Failed to copy note content", variant: "destructive" });
    }
  };

  const handleDuplicateNote = () => {
    if (!selectedNoteId || !noteTitle) return;
    
    createNoteMutation.mutate({
      title: `${noteTitle} (Copy)`,
      subject: noteSubject,
      tags: noteTags,
    });
  };

  const groupedNotes = notes.reduce((acc, note) => {
    const subject = note.subject || "Uncategorized";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const filteredGroups = Object.entries(groupedNotes).reduce((acc, [subject, subjectNotes]) => {
    const filtered = subjectNotes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      normalizeTags(note.tags).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (filtered.length > 0) {
      acc[subject] = filtered;
    }
    return acc;
  }, {} as Record<string, Note[]>);

  useEffect(() => {
    if (Object.keys(filteredGroups).length > 0 && expandedSubjects.size === 0) {
      setExpandedSubjects(new Set(Object.keys(filteredGroups)));
    }
  }, [filteredGroups, expandedSubjects.size]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950">
      {/* Mobile Sidebar Toggle */}
      {isMobile && !showMobileSidebar && (
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center"
          aria-label="Show notes list"
        >
          <FileText className="h-5 w-5" />
        </button>
      )}

      {/* Sidebar - full width on mobile when visible, fixed width on desktop */}
      <div className={`${
        isMobile
          ? showMobileSidebar ? 'w-full absolute inset-0 z-40' : 'hidden'
          : 'w-72'
      } border-r border-blue-200 dark:border-blue-900 flex flex-col bg-white dark:bg-slate-900 shadow-sm`}>
        <div className="p-3 sm:p-4 border-b border-blue-100 dark:border-blue-900 space-y-3 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent flex-1">
              Notes
            </h2>
            {isMobile && (
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-800 text-blue-500"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500 focus-visible:border-blue-400"
              data-testid="input-search-notes"
            />
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white" 
            size="sm" 
            onClick={() => setShowNewNoteDialog(true)}
            data-testid="button-new-note"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {Object.keys(filteredGroups).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes found</p>
              <p className="text-xs mt-1">Create your first note!</p>
            </div>
          ) : (
            Object.entries(filteredGroups).map(([subject, subjectNotes]) => {
              const isExpanded = expandedSubjects.has(subject);
              return (
                <div key={subject} className="mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 hover-elevate group"
                    onClick={() => toggleSubject(subject)}
                    data-testid={`button-subject-${subject}`}
                  >
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      <ChevronRight className="h-4 w-4 text-blue-500" />
                    </div>
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Folder className="h-4 w-4 text-blue-400" />
                    )}
                    <span className="flex-1 text-left font-medium text-sm">{subject}</span>
                    <span className="text-xs text-muted-foreground">{subjectNotes.length}</span>
                  </Button>
                  {isExpanded && (
                    <div className="ml-4 border-l-2 border-blue-200 dark:border-blue-800 pl-2 space-y-1">
                      {subjectNotes.map((note) => {
                        const isSelected = selectedNoteId === note.id;
                        return (
                          <div key={note.id} className="flex items-center group/note">
                            <Button
                              variant={isSelected ? "secondary" : "ghost"}
                              size="sm"
                              className={`flex-1 justify-start gap-2 ${
                                isSelected
                                  ? "bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100"
                                  : ""
                              }`}
                              onClick={() => {
                                setSelectedNoteId(note.id);
                                if (isMobile) setShowMobileSidebar(false);
                              }}
                              data-testid={`button-note-${note.id}`}
                            >
                              <FileText className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                              <span className="flex-1 text-left truncate text-sm">{note.title}</span>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 flex-shrink-0 opacity-0 group-hover/note:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`button-note-actions-${note.id}`}
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  className="gap-2 text-sm"
                                  onClick={() => {
                                    setSelectedNoteId(note.id);
                                    // Focus the title input for editing
                                    setTimeout(() => {
                                      const titleInput = document.querySelector('[data-testid="input-note-title"]') as HTMLInputElement;
                                      titleInput?.focus();
                                      titleInput?.select();
                                    }, 100);
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 text-sm"
                                  onClick={() => openMoveDialog(note.id)}
                                >
                                  <FolderInput className="h-3.5 w-3.5" />
                                  Move to Folder
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 text-sm"
                                  onClick={() => handleExportNoteById(note.id)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Export
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="gap-2 text-sm text-destructive"
                                  onClick={() => handleDeleteNoteById(note.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 ${isMobile && showMobileSidebar ? 'hidden' : ''}`}>
        {selectedNoteId ? (
          <>
            {/* Header */}
            <div className="border-b border-blue-200 dark:border-blue-900 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
              <div className="flex-1 min-w-0">
                <Input
                  value={noteTitle}
                  onChange={(e) => {
                    setNoteTitle(e.target.value);
                    setIsSaved(false);
                  }}
                  className="text-lg sm:text-2xl font-bold border-0 bg-transparent focus-visible:ring-0 px-0 focus-visible:outline-none"
                  placeholder="Untitled Note"
                  data-testid="input-note-title"
                />
                <Input
                  value={noteSubject}
                  onChange={(e) => {
                    setNoteSubject(e.target.value);
                    setIsSaved(false);
                  }}
                  className="text-sm text-muted-foreground border-0 bg-transparent focus-visible:ring-0 px-0 mt-1"
                  placeholder="Subject (e.g., Computer Science)"
                  data-testid="input-note-subject"
                />
              </div>

              <div className="flex items-center gap-3 ml-4">
                {updateNoteMutation.isPending ? (
                  <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 gap-1 border-0">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </Badge>
                ) : isSaved ? (
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 gap-1 border-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Saved
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 gap-1 border-0 animate-pulse">
                    <Zap className="h-3 w-3" />
                    Unsaved
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaved || updateNoteMutation.isPending}
                  data-testid="button-save-note"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-note-options">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem 
                      className="gap-2"
                      onClick={() => {
                        setRenameTitle(noteTitle);
                        setShowRenameDialog(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Edit Note</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="gap-2"
                      onClick={handleCopyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy to Clipboard</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="gap-2"
                      onClick={handleDuplicateNote}
                      disabled={createNoteMutation.isPending}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Duplicate Note</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="gap-2"
                      onClick={handleExportNote}
                    >
                      <Download className="h-4 w-4" />
                      <span>Export as TXT</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="gap-2"
                      onClick={handleExportPDF}
                    >
                      <FileDown className="h-4 w-4" />
                      <span>Export as PDF</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="gap-2"
                      onClick={() => selectedNoteId && openMoveDialog(selectedNoteId)}
                    >
                      <FolderInput className="h-4 w-4" />
                      <span>Move to Folder</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      className="text-destructive gap-2"
                      onClick={handleDeleteNote}
                      disabled={deleteNoteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Note</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tags Bar */}
            <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-blue-100 dark:border-blue-900 flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-blue-500" />
              {noteTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  placeholder="Add tag..."
                  className="h-7 w-24 text-xs"
                  data-testid="input-add-tag"
                />
                <Button size="sm" variant="ghost" onClick={addTag} className="h-7 px-2">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="px-3 sm:px-6 py-2 border-b border-blue-100 dark:border-blue-900 flex items-center gap-1 flex-wrap bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-1">
                <FormatButton icon={Bold} label="Bold" shortcut="Ctrl+B" onClick={() => insertFormat('**', '**')} disabled={previewMode} />
                <FormatButton icon={Italic} label="Italic" shortcut="Ctrl+I" onClick={() => insertFormat('*', '*')} disabled={previewMode} />
                <FormatButton icon={Underline} label="Underline" shortcut="Ctrl+U" onClick={() => insertFormat('<u>', '</u>')} disabled={previewMode} />
              </div>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <div className="flex items-center gap-1">
                <FormatButton icon={Heading1} label="Heading 1" onClick={() => insertAtLineStart('# ')} disabled={previewMode} />
                <FormatButton icon={Heading2} label="Heading 2" onClick={() => insertAtLineStart('## ')} disabled={previewMode} />
              </div>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <div className="flex items-center gap-1">
                <FormatButton icon={List} label="Bullet List" onClick={() => insertAtLineStart('- ')} disabled={previewMode} />
                <FormatButton icon={ListOrdered} label="Numbered List" onClick={() => insertAtLineStart('1. ')} disabled={previewMode} />
                <FormatButton icon={Quote} label="Quote" onClick={() => insertAtLineStart('> ')} disabled={previewMode} />
              </div>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <div className="flex items-center gap-1">
                <FormatButton icon={Code} label="Code Block" onClick={() => insertFormat('```\n', '\n```')} disabled={previewMode} />
                <FormatButton icon={Link} label="Link" onClick={() => insertFormat('[', '](url)')} disabled={previewMode} />
              </div>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={previewMode ? "default" : "outline"}
                    size="sm"
                    className={previewMode ? "bg-purple-500 text-white" : ""}
                    onClick={() => setPreviewMode(!previewMode)}
                    data-testid="button-toggle-preview"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? "Edit" : "Preview"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle between edit and preview mode</TooltipContent>
              </Tooltip>
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                      onClick={openFlashcardDialog}
                      disabled={!selectedNoteId}
                      data-testid="button-convert-flashcard"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">Flashcard</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Convert selection to flashcard</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-fuchsia-50 dark:bg-fuchsia-950 border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900"
                      onClick={openQuizDialog}
                      disabled={!selectedNoteId}
                      data-testid="button-convert-quiz"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Quiz</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Convert selection to quiz question</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                      onClick={askInsightScout}
                      disabled={!selectedNoteId}
                      data-testid="button-ask-insight-scout"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline">Ask AI</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ask AI about your notes</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900"
                      onClick={generateExamQuestions}
                      disabled={!selectedNoteId || !noteContent.trim()}
                      data-testid="button-exam-maker"
                    >
                      <FileQuestion className="h-4 w-4" />
                      <span className="hidden sm:inline">Exam Maker</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Generate exam-style questions from note</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Smart Note Types & Learning Tools Bar */}
            <div className="px-3 sm:px-6 py-2 border-b border-blue-100 dark:border-blue-900 flex items-center gap-2 sm:gap-3 flex-wrap bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-950/30 dark:to-cyan-950/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Type:</span>
                <Select value={selectedNoteType} onValueChange={setSelectedNoteType}>
                  <SelectTrigger className="h-7 w-32 text-xs" data-testid="select-note-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" /> General
                      </div>
                    </SelectItem>
                    <SelectItem value="concept">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-3 w-3 text-yellow-500" /> Concept
                      </div>
                    </SelectItem>
                    <SelectItem value="definition">
                      <div className="flex items-center gap-2">
                        <BookMarked className="h-3 w-3 text-blue-500" /> Definition
                      </div>
                    </SelectItem>
                    <SelectItem value="process">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-3 w-3 text-green-500" /> Process
                      </div>
                    </SelectItem>
                    <SelectItem value="example">
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-orange-500" /> Example
                      </div>
                    </SelectItem>
                    <SelectItem value="exam_tip">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3 w-3 text-purple-500" /> Exam Tip
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                    onClick={() => setShowExamPrompt(!showExamPrompt)}
                    disabled={previewMode}
                    data-testid="button-add-exam-prompt"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Exam Prompt
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add exam question annotation</TooltipContent>
              </Tooltip>

              {showExamPrompt && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border rounded-lg px-2 py-1">
                  <Select value={examPromptType} onValueChange={setExamPromptType}>
                    <SelectTrigger className="h-6 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAQ">SAQ</SelectItem>
                      <SelectItem value="MCQ">MCQ</SelectItem>
                      <SelectItem value="LAQ">LAQ</SelectItem>
                      <SelectItem value="Essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={examMarks}
                    onChange={(e) => setExamMarks(parseInt(e.target.value) || 1)}
                    className="h-6 w-14 text-xs"
                    min={1}
                    max={20}
                    placeholder="Marks"
                  />
                  <span className="text-xs text-muted-foreground">marks</span>
                  <Button size="sm" className="h-6 px-2 text-xs" onClick={insertExamPrompt}>
                    Add
                  </Button>
                </div>
              )}

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span className="text-xs font-medium">Recall Mode</span>
                      <Switch
                        checked={recallMode}
                        onCheckedChange={setRecallMode}
                        data-testid="switch-recall-mode"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Hide key terms to test your memory</TooltipContent>
                </Tooltip>
              </div>

              {recallMode && (
                <div className="flex items-center gap-1">
                  <Input
                    value={keyTermsInput}
                    onChange={(e) => setKeyTermsInput(e.target.value)}
                    placeholder="Key terms (comma-separated)..."
                    className="h-7 w-48 text-xs"
                    data-testid="input-key-terms"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2 text-xs gap-1 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                        onClick={autoExtractKeyTerms}
                      >
                        <Wand2 className="h-3 w-3" />
                        Auto
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Auto-extract key terms from note content</TooltipContent>
                  </Tooltip>
                </div>
              )}

              <Separator orientation="vertical" className="h-6" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300"
                    onClick={() => {
                      setAutoGenerateType("quiz");
                      setShowAutoGenerateDialog(true);
                    }}
                    disabled={!selectedNoteId}
                    data-testid="button-auto-generate-quiz"
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    Generate Quiz
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Auto-generate quiz from this note</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300"
                    onClick={() => {
                      setAutoGenerateType("flashcards");
                      setShowAutoGenerateDialog(true);
                    }}
                    disabled={!selectedNoteId}
                    data-testid="button-auto-generate-flashcards"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Generate Cards
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Auto-generate flashcards from this note</TooltipContent>
              </Tooltip>
            </div>

            {/* Editor Area with AI Panel */}
            <div className="flex-1 flex overflow-hidden">
              {/* Main Editor */}
              <div className={`flex-1 p-8 overflow-auto ${showAiPanel ? 'border-r border-blue-100 dark:border-blue-900' : ''}`}>
                <div className="max-w-4xl mx-auto">
                  {recallMode && keyTermsInput ? (
                    <div className="space-y-4">
                      <div className="bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-purple-700 dark:text-purple-300">Recall Mode Active</span>
                        </div>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          Key terms are hidden. Try to recall them before revealing!
                        </p>
                      </div>
                      <div className="font-mono text-base leading-relaxed whitespace-pre-wrap">
                        {getRecallContent(noteContent)}
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setRecallMode(false)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Reveal All Terms
                      </Button>
                    </div>
                  ) : previewMode ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <MarkdownPreview content={noteContent} />
                    </div>
                  ) : (
                    <Textarea
                      ref={textareaRef}
                      value={noteContent}
                      onChange={(e) => {
                        setNoteContent(e.target.value);
                        setIsSaved(false);
                      }}
                      onKeyDown={handleKeyDown}
                      className="min-h-[500px] resize-none border-0 focus-visible:ring-0 font-mono text-base leading-relaxed bg-transparent focus-visible:outline-none"
                      placeholder={`Start typing your notes...

Use the formatting toolbar above or keyboard shortcuts:
• Ctrl+B for **bold**
• Ctrl+I for *italic*
• Ctrl+U for underline
• Ctrl+S to save

Markdown formatting is supported:
# Heading 1
## Heading 2
- Bullet list
1. Numbered list
> Blockquote
\`\`\`code block\`\`\``}
                      data-testid="textarea-note-content"
                    />
                  )}
                </div>
              </div>

              {/* AI Ask Panel (Side Panel) */}
              {showAiPanel && (
                <div className="w-96 flex flex-col bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900">
                  <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-sm text-amber-800 dark:text-amber-300">Ask AI</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAiPanel(false)}>
                      <PanelRightClose className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-4 space-y-3" ref={aiResponseRef}>
                    {aiResponse ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownPreview content={aiResponse} />
                      </div>
                    ) : !aiLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Ask a question about your notes</p>
                        <p className="text-xs mt-1">Select text or type a question below</p>
                      </div>
                    ) : null}
                    {aiLoading && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-amber-200 dark:border-amber-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <Textarea
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendAiQuery();
                          }
                        }}
                        placeholder="Ask about this note..."
                        className="min-h-[60px] max-h-[100px] text-sm resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={sendAiQuery}
                        disabled={aiLoading || !aiQuery.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
                      >
                        {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Send
                      </Button>
                      {aiResponse && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={async () => {
                              await navigator.clipboard.writeText(aiResponse);
                              toast({ title: "Copied", description: "AI response copied to clipboard." });
                            }}
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={() => {
                              setAiResponse("");
                              setAiQuery("");
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Clear
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="p-8 text-center max-w-md">
              <FileText className="h-16 w-16 mx-auto mb-4 text-blue-400 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Note Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a note from the sidebar or create a new one to get started.
              </p>
              <Button onClick={() => setShowNewNoteDialog(true)} data-testid="button-create-first-note">
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* New Note Dialog */}
      <Dialog open={showNewNoteDialog} onOpenChange={setShowNewNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Enter note title..."
                data-testid="input-new-note-title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject (optional)</label>
              <Input
                value={newNoteSubject}
                onChange={(e) => setNewNoteSubject(e.target.value)}
                placeholder="e.g., Computer Science, Mathematics..."
                data-testid="input-new-note-subject"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewNoteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createNoteMutation.mutate({
                title: newNoteTitle || "Untitled Note",
                subject: newNoteSubject || undefined,
              })}
              disabled={createNoteMutation.isPending}
              data-testid="button-confirm-create-note"
            >
              {createNoteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Note Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Title</label>
              <Input
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                placeholder="Enter new note title..."
                data-testid="input-rename-note-title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameNote}
              disabled={!renameTitle.trim() || updateNoteMutation.isPending}
              data-testid="button-confirm-rename-note"
            >
              {updateNoteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Note Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Note?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The note "{deleteNoteTrigger ? (notes.find(n => n.id === deleteNoteTrigger)?.title || noteTitle) : noteTitle}" will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">All associated data will be lost.</p>
          </div>
          <AlertDialogCancel className="mt-4">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteNote}
            disabled={deleteNoteMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteNoteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move to Folder Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderInput className="h-5 w-5 text-blue-600" />
              Move to Folder
            </DialogTitle>
            <DialogDescription>
              Move "{moveNoteId ? (notes.find(n => n.id === moveNoteId)?.title || "this note") : "this note"}" to a different folder (subject).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Folder</label>
              <Select value={moveTargetFolder} onValueChange={setMoveTargetFolder}>
                <SelectTrigger data-testid="select-move-folder">
                  <SelectValue placeholder="Choose a folder..." />
                </SelectTrigger>
                <SelectContent>
                  {allFolders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-blue-400" />
                        {folder}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">
                    <div className="flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5 text-green-500" />
                      Create new folder...
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {moveTargetFolder === "__new__" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">New Folder Name</label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Mathematics, History..."
                  data-testid="input-new-folder-name"
                  autoFocus
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMoveNote}
              disabled={
                updateNoteMutation.isPending ||
                (!moveTargetFolder) ||
                (moveTargetFolder === "__new__" && !newFolderName.trim())
              }
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-confirm-move-note"
            >
              {updateNoteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Move Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flashcard Dialog */}
      <Dialog open={showFlashcardDialog} onOpenChange={setShowFlashcardDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              Create Flashcard from Note
            </DialogTitle>
            <DialogDescription>
              Convert your note content into a flashcard for spaced repetition learning.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Deck</label>
              <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                <SelectTrigger data-testid="select-flashcard-deck">
                  <SelectValue placeholder="Choose a deck..." />
                </SelectTrigger>
                <SelectContent>
                  {decks.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>{deck.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {decks.length === 0 && (
                <p className="text-xs text-muted-foreground">No decks available. Create a deck first in the Flashcards section.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Front (Question/Term)</label>
              <Textarea
                value={flashcardFront}
                onChange={(e) => setFlashcardFront(e.target.value)}
                placeholder="What do you want to remember?"
                className="min-h-[80px]"
                data-testid="input-flashcard-front"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Back (Answer/Definition)</label>
              <Textarea
                value={flashcardBack}
                onChange={(e) => setFlashcardBack(e.target.value)}
                placeholder="The answer or explanation..."
                className="min-h-[80px]"
                data-testid="input-flashcard-back"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlashcardDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createFlashcardMutation.mutate({
                deckId: selectedDeckId,
                front: flashcardFront,
                back: flashcardBack,
              })}
              disabled={!selectedDeckId || !flashcardFront || !flashcardBack || createFlashcardMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-confirm-create-flashcard"
            >
              {createFlashcardMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BookOpen className="h-4 w-4 mr-2" />
              )}
              Create Flashcard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-fuchsia-600" />
              Create Quiz Question from Note
            </DialogTitle>
            <DialogDescription>
              Turn your note content into a quiz question and add it to an existing quiz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Quiz</label>
              <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                <SelectTrigger data-testid="select-quiz">
                  <SelectValue placeholder="Choose a quiz..." />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {quizzes.length === 0 && (
                <p className="text-xs text-muted-foreground">No quizzes available. Create a quiz first in the Quizzes section.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              <Textarea
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                placeholder="Enter your question..."
                className="min-h-[80px]"
                data-testid="input-quiz-question"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Options (mark the correct one)</label>
              {quizOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctOptionIndex === index}
                    onChange={() => setCorrectOptionIndex(index)}
                    className="h-4 w-4 accent-fuchsia-600"
                  />
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...quizOptions];
                      newOptions[index] = e.target.value;
                      setQuizOptions(newOptions);
                    }}
                    placeholder={`Option ${index + 1}`}
                    data-testid={`input-quiz-option-${index}`}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Explanation (optional)</label>
              <Textarea
                value={quizExplanation}
                onChange={(e) => setQuizExplanation(e.target.value)}
                placeholder="Explain the correct answer..."
                className="min-h-[60px]"
                data-testid="input-quiz-explanation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuizDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const formattedOptions = quizOptions
                  .map((text, idx) => ({
                    text: text.trim(),
                    isCorrect: idx === correctOptionIndex,
                  }))
                  .filter(opt => opt.text);
                
                if (formattedOptions.length < 2) {
                  toast({ title: "Invalid options", description: "Please provide at least 2 options", variant: "destructive" });
                  return;
                }
                
                createQuizQuestionMutation.mutate({
                  quizId: selectedQuizId,
                  question: quizQuestion,
                  options: formattedOptions,
                  explanation: quizExplanation,
                });
              }}
              disabled={!selectedQuizId || !quizQuestion.trim() || quizOptions.filter(o => o.trim()).length < 2 || !quizOptions[correctOptionIndex]?.trim() || createQuizQuestionMutation.isPending}
              className="bg-fuchsia-600 hover:bg-fuchsia-700"
              data-testid="button-confirm-create-quiz"
            >
              {createQuizQuestionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <HelpCircle className="h-4 w-4 mr-2" />
              )}
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Generate Dialog */}
      <Dialog open={showAutoGenerateDialog} onOpenChange={setShowAutoGenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {autoGenerateType === "quiz" ? (
                <>
                  <ListChecks className="h-5 w-5 text-teal-600" />
                  Generate Quiz from Note
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 text-cyan-600" />
                  Generate Flashcards from Note
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {autoGenerateType === "quiz"
                ? "Automatically create quiz questions from your note content. Questions will be generated based on key concepts."
                : "Automatically create flashcards from your note content. Each significant section becomes a flashcard."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {autoGenerateType === "flashcards" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Target Deck</label>
                <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                  <SelectTrigger data-testid="select-auto-generate-deck">
                    <SelectValue placeholder="Choose a deck..." />
                  </SelectTrigger>
                  <SelectContent>
                    {decks.map((deck) => (
                      <SelectItem key={deck.id} value={deck.id}>{deck.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {decks.length === 0 && (
                  <p className="text-xs text-muted-foreground">No decks available. Create a deck first.</p>
                )}
              </div>
            )}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">What will be generated:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {autoGenerateType === "quiz" ? (
                  <>
                    <li>• Up to 5 questions from your note content</li>
                    <li>• Questions based on concepts, definitions, and processes</li>
                    <li>• Exam prompts get priority treatment</li>
                  </>
                ) : (
                  <>
                    <li>• One flashcard per significant content block</li>
                    <li>• Front: Question based on content type</li>
                    <li>• Back: Full content from your notes</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoGenerateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAutoGenerate}
              disabled={isGenerating || (autoGenerateType === "flashcards" && !selectedDeckId)}
              className={autoGenerateType === "quiz" 
                ? "bg-teal-600 hover:bg-teal-700" 
                : "bg-cyan-600 hover:bg-cyan-700"}
              data-testid="button-confirm-auto-generate"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : autoGenerateType === "quiz" ? (
                <ListChecks className="h-4 w-4 mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : `Generate ${autoGenerateType === "quiz" ? "Quiz" : "Flashcards"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exam Maker Dialog */}
      <Dialog open={showExamMakerDialog} onOpenChange={setShowExamMakerDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-violet-600" />
              Exam-Style Questions
            </DialogTitle>
            <DialogDescription>
              Generated from your note: {noteTitle}. Copy or save these for revision.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-3 py-4">
            {isGeneratingExam ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                <span className="ml-2 text-muted-foreground">Generating questions...</span>
              </div>
            ) : examQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No questions generated. Add more content to your note.</p>
              </div>
            ) : (
              examQuestions.map((q, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2 bg-white dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={
                      q.type === "SAQ" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                      q.type === "MCQ" ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-300" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                    }>
                      {q.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{q.marks} marks</span>
                  </div>
                  <p className="font-medium text-sm">{q.question}</p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Show suggested answer
                    </summary>
                    <p className="mt-2 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded p-3 text-xs whitespace-pre-wrap">
                      {q.answer}
                    </p>
                  </details>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={async () => {
                const text = examQuestions
                  .map((q, i) => `Q${i + 1}. [${q.type} - ${q.marks} marks]\n${q.question}\n\nSuggested Answer:\n${q.answer}`)
                  .join("\n\n---\n\n");
                await navigator.clipboard.writeText(text);
                toast({ title: "Copied", description: "All exam questions copied to clipboard." });
              }}
              disabled={examQuestions.length === 0}
            >
              <Copy className="h-3 w-3" />
              Copy All
            </Button>
            <Button variant="outline" onClick={() => setShowExamMakerDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
