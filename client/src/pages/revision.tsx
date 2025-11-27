import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Plus, Trash2, DragEndEvent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
}

export default function Revision() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Review Chapter 3", status: "todo" },
    { id: "2", title: "Practice problems", status: "in-progress" },
    { id: "3", title: "Make notes", status: "done" },
  ]);
  const [whiteboard, setWhiteboard] = useState("");
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setSessionCount((s) => s + 1);
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
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-800">
            <TabsTrigger value="pomodoro">Pomodoro Timer</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="whiteboard">Whiteboard</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}
