import { useState, useEffect, useCallback } from "react";
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
  X
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
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@shared/schema";

interface NoteWithBlocks extends Note {
  blocks?: { id: string; type: string; content: string; order: number }[];
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
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const { data: selectedNote } = useQuery<NoteWithBlocks>({
    queryKey: ["/api/notes", selectedNoteId],
    enabled: !!selectedNoteId,
  });

  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteSubject(selectedNote.subject || "");
      setNoteTags(selectedNote.tags || []);
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
      const res = await apiRequest("POST", "/api/notes", {
        ...data,
        blocks: [{ type: "paragraph", content: "" }],
      });
      return res.json();
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setSelectedNoteId(newNote.id);
      setShowNewNoteDialog(false);
      setNewNoteTitle("");
      setNewNoteSubject("");
      toast({ title: "Note created", description: "Your new note is ready." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data, content }: { id: string; data: Partial<Note>; content?: string }) => {
      const payload: any = { ...data };
      if (content !== undefined) {
        payload.blocks = [{ type: "paragraph", content }];
      }
      const res = await apiRequest("PATCH", `/api/notes/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes", selectedNoteId] });
      setIsSaved(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      if (selectedNoteId === notes.find(n => n.id === selectedNoteId)?.id) {
        const remaining = notes.filter(n => n.id !== selectedNoteId);
        setSelectedNoteId(remaining[0]?.id || null);
      }
      toast({ title: "Note deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    },
  });

  const handleSave = useCallback(() => {
    if (!selectedNoteId) return;
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
    if (!isSaved && selectedNoteId) {
      const timer = setTimeout(() => {
        handleSave();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSaved, noteTitle, noteContent, noteSubject, noteTags, handleSave, selectedNoteId]);

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

  const groupedNotes = notes.reduce((acc, note) => {
    const subject = note.subject || "Uncategorized";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const filteredGroups = Object.entries(groupedNotes).reduce((acc, [subject, subjectNotes]) => {
    const filtered = subjectNotes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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
      <div className="w-72 border-r border-blue-200 dark:border-blue-900 flex flex-col bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-4 border-b border-blue-100 dark:border-blue-900 space-y-3 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
              Notes
            </h2>
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
                          <Button
                            key={note.id}
                            variant={isSelected ? "secondary" : "ghost"}
                            size="sm"
                            className={`w-full justify-start gap-2 group ${
                              isSelected
                                ? "bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100"
                                : ""
                            }`}
                            onClick={() => setSelectedNoteId(note.id)}
                            data-testid={`button-note-${note.id}`}
                          >
                            <FileText className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                            <span className="flex-1 text-left truncate text-sm">{note.title}</span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                          </Button>
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

      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedNoteId ? (
          <>
            <div className="border-b border-blue-200 dark:border-blue-900 px-6 py-4 flex items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
              <div className="flex-1">
                <Input
                  value={noteTitle}
                  onChange={(e) => {
                    setNoteTitle(e.target.value);
                    setIsSaved(false);
                  }}
                  className="text-2xl font-bold border-0 bg-transparent focus-visible:ring-0 px-0 focus-visible:outline-none"
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
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="gap-2">
                      <Edit className="h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive gap-2"
                      onClick={() => selectedNoteId && deleteNoteMutation.mutate(selectedNoteId)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="px-6 py-3 border-b border-blue-100 dark:border-blue-900 flex items-center gap-2 flex-wrap">
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

            <div className="flex-1 p-8 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <Textarea
                  value={noteContent}
                  onChange={(e) => {
                    setNoteContent(e.target.value);
                    setIsSaved(false);
                  }}
                  className="min-h-[500px] resize-none border-0 focus-visible:ring-0 font-mono text-base leading-relaxed bg-transparent focus-visible:outline-none"
                  placeholder="Start typing your notes... You can use markdown formatting, code blocks, and more!"
                  data-testid="textarea-note-content"
                />
              </div>
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
    </div>
  );
}
