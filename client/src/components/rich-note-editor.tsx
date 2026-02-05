import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bold, Italic, Code, Heading2, Tag, Save, Clock, PenTool } from "lucide-react";

interface RichNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lastSaved?: Date;
  wordCount: number;
  readingTime: number;
}

interface RichNoteEditorProps {
  note: RichNote;
  onSave: (note: RichNote) => void;
  autoSave?: boolean;
}

export function RichNoteEditor({
  note,
  onSave,
  autoSave = true,
}: RichNoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags.join(", "));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(note.lastSaved);

  const calculateStats = (text: string) => {
    const wordCount = text.trim().split(/\s+/).length;
    // Average reading speed: 200 words per minute
    const readingTime = Math.ceil(wordCount / 200);
    return { wordCount, readingTime };
  };

  const { wordCount, readingTime } = calculateStats(content);

  useEffect(() => {
    if (!autoSave) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, title]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      onSave({
        ...note,
        title,
        content,
        tags: tagArray,
        lastSaved: new Date(),
        wordCount,
        readingTime,
      });

      setLastSaved(new Date());
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const applyFormatting = (before: string, after: string = "") => {
    const textarea = document.getElementById("note-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (!selectedText) return;

    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newContent);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "Never";
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(lastSaved).getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="glassmorphic">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            <Input
              placeholder="Note Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold h-10 border-0 bg-transparent p-0"
            />

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags (comma-separated)
              </label>
              <Input
                placeholder="e.g., important, review, exam"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="text-sm"
              />
              {tags && (
                <div className="flex gap-2 flex-wrap">
                  {tags.split(",").map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex gap-4">
                <span>📝 {wordCount} words</span>
                <span>⏱️ {readingTime} min read</span>
              </div>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Saved {formatLastSaved()}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Editor */}
      <Card className="glassmorphic">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Editor
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting("**", "**")}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting("_", "_")}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting("`", "`")}
                title="Code"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting("## ", "")}
                title="Heading"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your note... You can use markdown formatting like **bold**, _italic_, `code`, etc."
            className="w-full h-96 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Saving..." : "Save Note"}
      </Button>

      {/* Auto-save indicator */}
      {autoSave && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
          ✓ Auto-saving enabled
        </p>
      )}
    </div>
  );
}
