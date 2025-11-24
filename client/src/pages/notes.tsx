import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  FileText, 
  Plus, 
  Search, 
  MoreVertical,
  Save,
  Tag,
  CheckCircle2,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderItem {
  id: string;
  name: string;
  type: "folder" | "note";
  children?: FolderItem[];
  color?: string;
}

export default function Notes() {
  const [selectedNote, setSelectedNote] = useState("note-1");
  const [noteTitle, setNoteTitle] = useState("Introduction to React Hooks");
  const [noteContent, setNoteContent] = useState(
    "React Hooks are functions that let you use state and other React features without writing a class.\n\nKey hooks:\n- useState: Manage component state\n- useEffect: Handle side effects\n- useContext: Access context values\n- useReducer: Complex state management"
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["folder-1"]));
  const [isSaved, setIsSaved] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const folders: FolderItem[] = [
    {
      id: "folder-1",
      name: "Computer Science",
      type: "folder",
      color: "from-blue-400 to-blue-600",
      children: [
        { id: "note-1", name: "Introduction to React Hooks", type: "note" },
        { id: "note-2", name: "Data Structures", type: "note" },
      ],
    },
    {
      id: "folder-2",
      name: "Mathematics",
      type: "folder",
      color: "from-indigo-400 to-indigo-600",
      children: [
        { id: "note-3", name: "Calculus Notes", type: "note" },
        { id: "note-4", name: "Linear Algebra", type: "note" },
      ],
    },
    {
      id: "folder-3",
      name: "Physics",
      type: "folder",
      color: "from-cyan-400 to-cyan-600",
      children: [
        { id: "note-5", name: "Quantum Mechanics", type: "note" },
      ],
    },
  ];

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderTree = (items: FolderItem[], level: number = 0) => {
    return items.map((item) => {
      if (item.type === "folder") {
        const isExpanded = expandedFolders.has(item.id);
        return (
          <div key={item.id}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 hover-elevate group transition-all duration-200"
              style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
              onClick={() => toggleFolder(item.id)}
              data-testid={`button-folder-${item.id}`}
            >
              <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                <ChevronRight className="h-4 w-4 text-blue-500 group-hover:text-blue-600" />
              </div>
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-400" />
              ) : (
                <Folder className="h-4 w-4 text-blue-400" />
              )}
              <span className="flex-1 text-left font-medium text-sm group-hover:text-blue-600 transition-colors">{item.name}</span>
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {item.children?.length || 0}
              </span>
            </Button>
            {isExpanded && item.children && (
              <div className="border-l-2 border-blue-200 dark:border-blue-900 ml-2">
                {renderFolderTree(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      } else {
        const isSelected = selectedNote === item.id;
        return (
          <Button
            key={item.id}
            variant={isSelected ? "secondary" : "ghost"}
            size="sm"
            className={`w-full justify-start gap-2 hover-elevate group transition-all duration-200 ${
              isSelected
                ? "bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-l-4 border-l-blue-500"
                : "border-l-4 border-l-transparent"
            }`}
            style={{ paddingLeft: `${level * 1 + 1.5}rem` }}
            onClick={() => {
              setSelectedNote(item.id);
              setNoteTitle(item.name);
              console.log(`Selected note: ${item.name}`);
            }}
            data-testid={`button-note-${item.id}`}
          >
            <FileText className={`h-4 w-4 transition-colors ${
              isSelected 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-slate-400 group-hover:text-blue-500"
            }`} />
            <span className="flex-1 text-left truncate text-sm">{item.name}</span>
            {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
          </Button>
        );
      }
    });
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div className="w-64 border-r border-blue-200 dark:border-blue-900 flex flex-col bg-white dark:bg-slate-900 shadow-sm">
        {/* Sidebar Header */}
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
            data-testid="button-new-note"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        {/* Folder Tree */}
        <div className="flex-1 overflow-auto p-2">
          {folders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No folders yet</p>
            </div>
          ) : (
            renderFolderTree(folders)
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {/* Toolbar */}
        <div className="border-b border-blue-200 dark:border-blue-900 px-6 py-4 flex items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex-1">
            <Input
              value={noteTitle}
              onChange={(e) => {
                setNoteTitle(e.target.value);
                setIsSaved(false);
              }}
              className="text-2xl font-bold border-0 bg-transparent focus-visible:ring-0 px-0 placeholder-slate-400 dark:placeholder-slate-500 focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-b-blue-500"
              placeholder="Untitled Note"
              data-testid="input-note-title"
            />
          </div>

          {/* Status and Actions */}
          <div className="flex items-center gap-3 ml-4">
            {isSaved ? (
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 gap-1 border-0">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </Badge>
            ) : (
              <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 gap-1 border-0 animate-pulse">
                <Zap className="h-3 w-3" />
                Saving...
              </Badge>
            )}

            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950 dark:to-slate-900 gap-1 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
            >
              <Tag className="h-3 w-3" />
              React
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover-elevate text-slate-600 dark:text-slate-400"
                  data-testid="button-note-options"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-2">
                  <Tag className="h-4 w-4" />
                  Add Tag
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Folder className="h-4 w-4" />
                  Move to Folder
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Save className="h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive gap-2">
                  <FileText className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <Textarea
              value={noteContent}
              onChange={(e) => {
                setNoteContent(e.target.value);
                setIsSaved(false);
              }}
              className="min-h-96 resize-none border-0 focus-visible:ring-0 font-mono text-base leading-relaxed bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus-visible:outline-none"
              placeholder="Start typing your notes... You can use markdown formatting, code blocks, and more!"
              data-testid="textarea-note-content"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
