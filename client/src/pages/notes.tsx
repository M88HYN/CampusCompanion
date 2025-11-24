import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  Plus, 
  Search, 
  MoreVertical,
  Save,
  Tag
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
}

export default function Notes() {
  const [selectedNote, setSelectedNote] = useState("note-1");
  const [noteTitle, setNoteTitle] = useState("Introduction to React Hooks");
  const [noteContent, setNoteContent] = useState(
    "React Hooks are functions that let you use state and other React features without writing a class.\n\nKey hooks:\n- useState: Manage component state\n- useEffect: Handle side effects\n- useContext: Access context values\n- useReducer: Complex state management"
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["folder-1"]));

  const folders: FolderItem[] = [
    {
      id: "folder-1",
      name: "Computer Science",
      type: "folder",
      children: [
        { id: "note-1", name: "Introduction to React Hooks", type: "note" },
        { id: "note-2", name: "Data Structures", type: "note" },
      ],
    },
    {
      id: "folder-2",
      name: "Mathematics",
      type: "folder",
      children: [
        { id: "note-3", name: "Calculus Notes", type: "note" },
        { id: "note-4", name: "Linear Algebra", type: "note" },
      ],
    },
    {
      id: "folder-3",
      name: "Physics",
      type: "folder",
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
              className="w-full justify-start gap-2 hover-elevate"
              style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
              onClick={() => toggleFolder(item.id)}
              data-testid={`button-folder-${item.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4" />
              <span className="flex-1 text-left">{item.name}</span>
            </Button>
            {isExpanded && item.children && (
              <div>{renderFolderTree(item.children, level + 1)}</div>
            )}
          </div>
        );
      } else {
        return (
          <Button
            key={item.id}
            variant={selectedNote === item.id ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 hover-elevate"
            style={{ paddingLeft: `${level * 1 + 2}rem` }}
            onClick={() => {
              setSelectedNote(item.id);
              setNoteTitle(item.name);
              console.log(`Selected note: ${item.name}`);
            }}
            data-testid={`button-note-${item.id}`}
          >
            <FileText className="h-4 w-4" />
            <span className="flex-1 text-left truncate">{item.name}</span>
          </Button>
        );
      }
    });
  };

  return (
    <div className="flex h-full">
      <div className="w-64 border-r flex flex-col bg-card">
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-9"
              data-testid="input-search-notes"
            />
          </div>
          <Button className="w-full" size="sm" data-testid="button-new-note">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {renderFolderTree(folders)}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center justify-between gap-4">
          <Input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="text-2xl font-bold border-0 focus-visible:ring-0 px-0"
            placeholder="Untitled Note"
            data-testid="input-note-title"
          />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              React
            </Badge>
            <Button variant="ghost" size="icon">
              <Save className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-note-options">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Add Tag</DropdownMenuItem>
                <DropdownMenuItem>Move to Folder</DropdownMenuItem>
                <DropdownMenuItem>Export</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex-1 p-6">
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-full resize-none border-0 focus-visible:ring-0 font-mono text-base leading-relaxed"
            placeholder="Start typing your notes..."
            data-testid="textarea-note-content"
          />
        </div>
      </div>
    </div>
  );
}
