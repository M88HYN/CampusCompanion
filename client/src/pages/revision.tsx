import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Plus, Trash2, BarChart3, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
}

interface Note {
  id: string;
  category: string;
  content: string;
}

interface SessionStat {
  date: string;
  sessions: number;
  totalMinutes: number;
}

export default function Revision() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Review Chapter 3", status: "todo" },
    { id: "2", title: "Practice problems", status: "in-progress" },
    { id: "3", title: "Make notes", status: "done" },
  ]);
  const [whiteboard, setWhiteboard] = useState("");
  const [newTask, setNewTask] = useState("");
  const [notes, setNotes] = useState<Note[]>([
    { id: "1", category: "Math", content: "Remember: chain rule for derivatives" },
    { id: "2", category: "Biology", content: "Mitochondria: powerhouse of cell" },
  ]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("General");
  const [sessionStats] = useState<SessionStat[]>([
    { date: "Today", sessions: 3, totalMinutes: 75 },
    { date: "Yesterday", sessions: 5, totalMinutes: 125 },
    { date: "2 days ago", sessions: 4, totalMinutes: 100 },
  ]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setSessionCount((s) => s + 1);
          setTotalSessionTime((t) => t + 25);
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: String(Date.now()), title: newTask, status: "todo" }]);
      setNewTask("");
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleChangeStatus = (id: string, status: "todo" | "in-progress" | "done") => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const statusColor = {
    todo: "bg-slate-100 dark:bg-slate-800",
    "in-progress": "bg-blue-100 dark:bg-blue-900",
    done: "bg-green-100 dark:bg-green-900",
  };

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-b from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Revision Help</h1>
              <p className="text-lg opacity-90">Pomodoro timer, task management & creative space</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pomodoro" className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-1 bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-800 p-1">
            <TabsTrigger value="pomodoro" className="text-xs sm:text-sm">Pomodoro</TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs sm:text-sm">Kanban</TabsTrigger>
            <TabsTrigger value="whiteboard" className="text-xs sm:text-sm">Whiteboard</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="pomodoro" className="space-y-6">
            <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900">
                <CardTitle>Pomodoro Session</CardTitle>
                <CardDescription>25-minute focused work sessions</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="flex flex-col items-center space-y-6">
                  <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-3xl p-12 text-white shadow-xl">
                    <div className="font-mono text-8xl font-bold text-center">
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      size="lg"
                      onClick={() => setIsRunning(!isRunning)}
                      className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
                      data-testid="button-pomodoro-toggle"
                    >
                      {isRunning ? (
                        <>
                          <Pause className="h-5 w-5 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setTimeLeft(25 * 60);
                        setIsRunning(false);
                      }}
                      data-testid="button-pomodoro-reset"
                    >
                      <RotateCcw className="h-5 w-5 mr-2" />
                      Reset
                    </Button>
                  </div>

                  <Badge className="bg-amber-500 text-white px-4 py-2 text-sm" data-testid="badge-sessions">
                    Sessions Completed: {sessionCount}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kanban" className="space-y-6">
            <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
                <CardTitle>Task Board</CardTitle>
                <CardDescription>Organize your revision tasks</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Add a new task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                    className="flex-1 border-2 border-blue-200 dark:border-blue-800"
                    data-testid="input-new-task"
                  />
                  <Button onClick={handleAddTask} className="bg-blue-500 hover:bg-blue-600 text-white" data-testid="button-add-task">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Todo Column */}
                  <div className={`rounded-lg p-4 min-h-96 space-y-3 ${statusColor.todo}`}>
                    <h3 className="font-bold text-sm mb-4">To Do</h3>
                    {todoTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm cursor-move hover-elevate border-l-4 border-gray-400"
                        onClick={() => handleChangeStatus(task.id, "in-progress")}
                        data-testid={`task-${task.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium flex-1">{task.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            data-testid={`button-delete-${task.id}`}
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* In Progress Column */}
                  <div className={`rounded-lg p-4 min-h-96 space-y-3 ${statusColor["in-progress"]}`}>
                    <h3 className="font-bold text-sm mb-4">In Progress</h3>
                    {inProgressTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm cursor-move hover-elevate border-l-4 border-blue-500"
                        onClick={() => handleChangeStatus(task.id, "done")}
                        data-testid={`task-${task.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium flex-1">{task.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            data-testid={`button-delete-${task.id}`}
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Done Column */}
                  <div className={`rounded-lg p-4 min-h-96 space-y-3 ${statusColor.done}`}>
                    <h3 className="font-bold text-sm mb-4">Done</h3>
                    {doneTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm cursor-move hover-elevate border-l-4 border-green-500 opacity-75"
                        onClick={() => handleChangeStatus(task.id, "in-progress")}
                        data-testid={`task-${task.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium flex-1 line-through">{task.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            data-testid={`button-delete-${task.id}`}
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whiteboard" className="space-y-6">
            <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                <CardTitle>Virtual Whiteboard</CardTitle>
                <CardDescription>Brainstorm and sketch ideas</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={whiteboard}
                  onChange={(e) => setWhiteboard(e.target.value)}
                  placeholder="Write down your ideas, sketches, formulas, diagrams... Let your creativity flow!"
                  className="min-h-96 p-4 rounded-lg font-mono text-sm border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400"
                  data-testid="textarea-whiteboard"
                />
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{whiteboard.length} characters</span>
                  <Button
                    variant="outline"
                    onClick={() => setWhiteboard("")}
                    data-testid="button-clear-whiteboard"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
                <CardTitle>Quick Notes</CardTitle>
                <CardDescription>Capture key insights and important facts</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-3 mb-6">
                  <Input
                    placeholder="Category (e.g., Math, Biology)"
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value)}
                    className="flex-shrink-0 w-32 border-2 border-green-200 dark:border-green-800"
                    data-testid="input-note-category"
                  />
                  <Textarea
                    placeholder="Write a quick note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="border-2 border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400 min-h-16"
                    data-testid="textarea-new-note"
                  />
                  <Button
                    onClick={() => {
                      if (newNoteContent.trim()) {
                        setNotes([...notes, { id: String(Date.now()), category: newNoteCategory, content: newNoteContent }]);
                        setNewNoteContent("");
                      }
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0 h-16"
                    data-testid="button-add-note"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border-l-4 border-green-500 flex justify-between items-start group hover-elevate"
                      data-testid={`note-${note.id}`}
                    >
                      <div className="flex-1">
                        <Badge className="bg-green-500 text-white mb-2" data-testid={`badge-category-${note.id}`}>
                          {note.category}
                        </Badge>
                        <p className="text-sm font-medium text-foreground">{note.content}</p>
                      </div>
                      <button
                        onClick={() => setNotes(notes.filter((n) => n.id !== note.id))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-delete-note-${note.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-900 dark:to-violet-900">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Focus Statistics
                </CardTitle>
                <CardDescription>Track your productivity and focus sessions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-300" data-testid="stat-sessions">
                        {sessionCount}
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Completed Sessions</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-purple-700 dark:text-purple-300" data-testid="stat-time">
                        {totalSessionTime + 180}
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Total Minutes</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-orange-700 dark:text-orange-300" data-testid="stat-avg">
                        {Math.round((totalSessionTime + 180) / (sessionCount || 1))}
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Avg Min/Session</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm">Session History</h3>
                  {sessionStats.map((stat, idx) => (
                    <div key={idx} className="space-y-2" data-testid={`history-${idx}`}>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{stat.date}</span>
                        <span className="text-xs text-muted-foreground">
                          {stat.sessions} sessions • {stat.totalMinutes}m
                        </span>
                      </div>
                      <Progress value={(stat.totalMinutes / 150) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
