import { storage } from "./storage";
import { db } from "./db";
import { users, decks, quizzes, notes } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { seedQuizzes } from "./seed-quizzes";
import { hashPassword } from "./auth";
import { randomUUID } from "crypto";

export async function seedComputerScienceData(userId: string) {
  try {
    console.log(`[CS SEED] Starting Computer Science data seed for userId: ${userId}`);
    
    // Try to ensure user exists, but don't fail if DB connection fails
    try {
      const existingUser = await db.select().from(users).where(eq(users.id, userId));
      if (existingUser.length === 0) {
        // Create a user if it doesn't exist - use userId as unique email
        const hashedPassword = await hashPassword("demo-user"); // Default demo password
        await db.insert(users).values({
          id: userId,
          email: `user-${userId}@studymate.local`,
          username: "demo-user",
          passwordHash: hashedPassword,
          firstName: "Demo",
          lastName: "User",
          createdAt: Date.now() as any,
          updatedAt: Date.now() as any
        });
        console.log(`[CS SEED] 📝 Created demo user: demo-user (password: demo-user)`);
      }
    } catch (userError) {
      // Silently ignore if user already exists (likely duplicate email)
    }
    
    // IDEMPOTENT CHECK: Skip if user already has data
    const existingDecks = await db.select({ id: decks.id }).from(decks).where(eq(decks.userId, userId));
    const existingQuizzes = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.userId, userId));
    
    if (existingDecks.length > 0 || existingQuizzes.length > 0) {
      console.log(`[CS SEED] ⏭️  Skipping - User already has ${existingDecks.length} decks, ${existingQuizzes.length} quizzes`);
      return true;
    }

    // ==================== RICH NOTES WITH CONTENT ====================
    const now = Date.now();
    const noteData = [
      {
        id: randomUUID(),
        title: "Array Operations & Complexity",
        subject: "Data Structures",
        tags: JSON.stringify(["arrays", "complexity", "big-o"]),
        content: [
          { type: "heading", content: "# Array Operations & Complexity Analysis" },
          { type: "paragraph", content: "An **array** is a contiguous block of memory storing elements of the same type, accessed by index in **O(1)** time. Arrays are the most fundamental data structure in computer science." },
          { type: "heading", content: "## Core Operations" },
          { type: "paragraph", content: "**Access by Index** — O(1): Direct memory address calculation using base address + (index × element size).\n\n**Search (Linear)** — O(n): Must check each element sequentially in the worst case.\n\n**Binary Search** — O(log n): Only works on sorted arrays; halves search space each step.\n\n**Insertion at End** — O(1) amortized: If space available, just place element. Dynamic arrays occasionally resize (doubling strategy).\n\n**Insertion at Index** — O(n): Must shift all subsequent elements right.\n\n**Deletion at Index** — O(n): Must shift all subsequent elements left to fill the gap." },
          { type: "heading", content: "## Static vs Dynamic Arrays" },
          { type: "paragraph", content: "**Static arrays** have a fixed size determined at compile time. They are faster to allocate but inflexible.\n\n**Dynamic arrays** (e.g., `ArrayList` in Java, `vector` in C++) automatically resize when capacity is exceeded. The resizing strategy typically **doubles the capacity**, giving O(1) amortized insertion." },
          { type: "heading", content: "## Common Patterns" },
          { type: "paragraph", content: "1. **Two Pointer** — Use two indices to traverse from both ends inward (e.g., palindrome check, pair sum)\n2. **Sliding Window** — Maintain a window of fixed or variable size (e.g., max subarray sum)\n3. **Prefix Sum** — Precompute cumulative sums for O(1) range sum queries\n4. **Kadane's Algorithm** — Find maximum subarray sum in O(n)" },
          { type: "paragraph", content: "**Key Exam Tip**: Always state both time AND space complexity. For arrays, space is O(n) for storage + O(1) auxiliary for most in-place operations." },
        ],
      },
      {
        id: randomUUID(),
        title: "SOLID Principles in OOP",
        subject: "Software Engineering",
        tags: JSON.stringify(["oop", "design-patterns", "solid"]),
        content: [
          { type: "heading", content: "# SOLID Principles of Object-Oriented Design" },
          { type: "paragraph", content: "**SOLID** is an acronym for five design principles that make software more understandable, flexible, and maintainable. These principles were promoted by **Robert C. Martin** (Uncle Bob)." },
          { type: "heading", content: "## S — Single Responsibility Principle" },
          { type: "paragraph", content: "A class should have **only one reason to change**. Each class should do one thing well. This reduces coupling and makes code easier to test and maintain.\n\n**Example**: A `UserService` should handle user logic, NOT email sending. Create a separate `EmailService`." },
          { type: "heading", content: "## O — Open/Closed Principle" },
          { type: "paragraph", content: "Software entities should be **open for extension but closed for modification**. Add new functionality through new code (inheritance, composition), not by changing existing code.\n\n**Example**: Use strategy pattern instead of adding `if/else` branches for new payment methods." },
          { type: "heading", content: "## L — Liskov Substitution Principle" },
          { type: "paragraph", content: "Objects of a subclass should be **substitutable** for objects of the superclass without breaking the program. If `Bird` has `fly()`, then `Penguin extends Bird` violates LSP because penguins can't fly.\n\n**Fix**: Restructure the hierarchy — make `FlyingBird` a subclass of `Bird`." },
          { type: "heading", content: "## I — Interface Segregation Principle" },
          { type: "paragraph", content: "Clients should not be forced to depend on interfaces they don't use. **Split large interfaces** into smaller, specific ones.\n\n**Example**: Instead of one `IWorker` interface with `work()`, `eat()`, `sleep()`, split into `IWorkable`, `IFeedable`, `IRestable`." },
          { type: "heading", content: "## D — Dependency Inversion Principle" },
          { type: "paragraph", content: "High-level modules should not depend on low-level modules. Both should depend on **abstractions**. This enables easier testing (mock injection) and swapping implementations.\n\n**Example**: `OrderService` depends on `IPaymentGateway` interface, not on `StripePayment` directly." },
        ],
      },
      {
        id: randomUUID(),
        title: "SQL Joins Explained",
        subject: "Databases",
        tags: JSON.stringify(["sql", "joins", "databases"]),
        content: [
          { type: "heading", content: "# SQL Joins — Complete Guide" },
          { type: "paragraph", content: "A **JOIN** combines rows from two or more tables based on a related column. Understanding joins is fundamental to relational database queries." },
          { type: "heading", content: "## INNER JOIN" },
          { type: "paragraph", content: "Returns only rows where there is a **match in both tables**.\n\n```sql\nSELECT s.name, c.title\nFROM students s\nINNER JOIN enrollments e ON s.id = e.student_id\nINNER JOIN courses c ON e.course_id = c.id;\n```\n\nStudents with no enrollments and courses with no students are excluded." },
          { type: "heading", content: "## LEFT (OUTER) JOIN" },
          { type: "paragraph", content: "Returns **all rows from the left table** and matching rows from the right. Non-matching right-side columns are filled with NULL.\n\n```sql\nSELECT s.name, e.course_id\nFROM students s\nLEFT JOIN enrollments e ON s.id = e.student_id;\n```\n\nThis shows ALL students, even those not enrolled in any course." },
          { type: "heading", content: "## RIGHT (OUTER) JOIN" },
          { type: "paragraph", content: "Returns **all rows from the right table** and matching rows from the left. Opposite of LEFT JOIN. Less commonly used — you can usually restructure as LEFT JOIN." },
          { type: "heading", content: "## FULL OUTER JOIN" },
          { type: "paragraph", content: "Returns all rows when there is a match in **either** table. Combines LEFT and RIGHT JOIN results. NULLs fill unmatched columns from both sides." },
          { type: "heading", content: "## CROSS JOIN" },
          { type: "paragraph", content: "Produces the **Cartesian product** — every row from table A paired with every row from table B. Result size: rows(A) × rows(B). Rarely used intentionally.\n\n```sql\nSELECT * FROM sizes CROSS JOIN colors;\n```" },
          { type: "heading", content: "## Performance Tips" },
          { type: "paragraph", content: "1. Always **index join columns** (foreign keys)\n2. Use **EXPLAIN ANALYZE** to check query plans\n3. Avoid `SELECT *` — specify only needed columns\n4. Consider **denormalization** for frequently joined tables in read-heavy systems" },
        ],
      },
      {
        id: randomUUID(),
        title: "React Hooks — Complete Guide",
        subject: "Web Development",
        tags: JSON.stringify(["react", "hooks", "frontend"]),
        content: [
          { type: "heading", content: "# React Hooks — Complete Guide" },
          { type: "paragraph", content: "**React Hooks** (introduced in React 16.8) let you use state and lifecycle features in functional components. They replace class-based patterns with a simpler, composable API." },
          { type: "heading", content: "## useState" },
          { type: "paragraph", content: "Adds local state to a functional component.\n\n```tsx\nconst [count, setCount] = useState(0);\nconst [user, setUser] = useState<User | null>(null);\n```\n\n**Key rules**: State updates are **asynchronous** and trigger re-renders. Use the callback form `setCount(prev => prev + 1)` when the new value depends on the previous." },
          { type: "heading", content: "## useEffect" },
          { type: "paragraph", content: "Runs side effects after render. Replaces `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount`.\n\n```tsx\nuseEffect(() => {\n  fetchData();\n  return () => cleanup(); // cleanup on unmount\n}, [dependency]); // re-runs when dependency changes\n```\n\n**Empty deps `[]`** = run once on mount. **No deps** = run on every render. **With deps** = run when deps change." },
          { type: "heading", content: "## useCallback & useMemo" },
          { type: "paragraph", content: "**useCallback** memoizes a function reference (prevents unnecessary re-renders of child components).\n\n**useMemo** memoizes a computed value (expensive calculations).\n\n```tsx\nconst handleClick = useCallback(() => doSomething(id), [id]);\nconst sortedList = useMemo(() => items.sort(compareFn), [items]);\n```\n\n**Only use when necessary** — premature memoization adds complexity without benefit." },
          { type: "heading", content: "## Custom Hooks" },
          { type: "paragraph", content: "Extract reusable stateful logic into custom hooks. Name must start with `use`.\n\n```tsx\nfunction useWindowSize() {\n  const [size, setSize] = useState({ width: 0, height: 0 });\n  useEffect(() => {\n    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });\n    window.addEventListener('resize', handler);\n    return () => window.removeEventListener('resize', handler);\n  }, []);\n  return size;\n}\n```" },
          { type: "heading", content: "## Rules of Hooks" },
          { type: "paragraph", content: "1. Only call hooks **at the top level** — never inside loops, conditions, or nested functions\n2. Only call hooks from **React function components** or **custom hooks**\n3. The order of hook calls must be **consistent** across renders (React relies on call order internally)" },
        ],
      },
      {
        id: randomUUID(),
        title: "Process Scheduling Algorithms",
        subject: "Operating Systems",
        tags: JSON.stringify(["os", "scheduling", "processes"]),
        content: [
          { type: "heading", content: "# CPU Scheduling Algorithms" },
          { type: "paragraph", content: "The **CPU scheduler** selects which process from the ready queue gets CPU time next. The goal is to maximize CPU utilization, throughput, and fairness while minimizing waiting time and response time." },
          { type: "heading", content: "## First-Come, First-Served (FCFS)" },
          { type: "paragraph", content: "Processes are executed in **arrival order**. Simple but suffers from the **convoy effect** — short processes wait behind long ones.\n\n**Pros**: Simple, fair (no starvation)\n**Cons**: High average waiting time, poor for interactive systems" },
          { type: "heading", content: "## Shortest Job First (SJF)" },
          { type: "paragraph", content: "Selects the process with the **shortest burst time** next. Provably optimal for minimizing average waiting time.\n\n**Preemptive SJF** (SRTF): If a new process arrives with shorter remaining time, it preempts the current process.\n\n**Problem**: Requires knowing burst time in advance (usually estimated). Can cause **starvation** of long processes." },
          { type: "heading", content: "## Round Robin (RR)" },
          { type: "paragraph", content: "Each process gets a fixed **time quantum** (e.g., 10ms). After the quantum expires, the process is preempted and moved to the back of the queue.\n\n**Key insight**: Performance depends heavily on quantum size:\n- Too small → excessive context switching overhead\n- Too large → degrades to FCFS\n- **Rule of thumb**: 80% of bursts should be shorter than the quantum" },
          { type: "heading", content: "## Priority Scheduling" },
          { type: "paragraph", content: "Each process is assigned a **priority number**. The CPU is allocated to the highest-priority process. Can be preemptive or non-preemptive.\n\n**Starvation risk**: Low-priority processes may never execute. **Solution**: **Aging** — gradually increase priority of waiting processes." },
          { type: "heading", content: "## Multilevel Feedback Queue (MLFQ)" },
          { type: "paragraph", content: "Uses **multiple queues** with different priorities and scheduling algorithms. Processes move between queues based on behavior:\n\n1. New processes enter the highest-priority queue\n2. If a process uses its full quantum, it moves DOWN\n3. If a process gives up CPU early (I/O), it stays or moves UP\n\nThis automatically separates **interactive** (short bursts) from **batch** (long bursts) processes." },
        ],
      },
      {
        id: randomUUID(),
        title: "Graph Algorithms & Traversal",
        subject: "Data Structures",
        tags: JSON.stringify(["graphs", "bfs", "dfs", "algorithms"]),
        content: [
          { type: "heading", content: "# Graph Algorithms & Traversal" },
          { type: "paragraph", content: "A **graph** G = (V, E) consists of vertices (nodes) and edges (connections). Graphs model relationships: social networks, maps, dependencies, web links." },
          { type: "heading", content: "## Representations" },
          { type: "paragraph", content: "**Adjacency Matrix** — 2D array of size V×V. `matrix[i][j] = 1` if edge exists. O(1) edge lookup, O(V²) space. Best for dense graphs.\n\n**Adjacency List** — Array of lists. `list[i]` contains neighbors of vertex i. O(V+E) space. Best for sparse graphs (most real-world graphs)." },
          { type: "heading", content: "## Breadth-First Search (BFS)" },
          { type: "paragraph", content: "Explores vertices **level by level** using a queue. Guarantees shortest path in unweighted graphs.\n\n**Time**: O(V + E) | **Space**: O(V)\n\n**Applications**: Shortest path (unweighted), level-order traversal, finding connected components, web crawling." },
          { type: "heading", content: "## Depth-First Search (DFS)" },
          { type: "paragraph", content: "Explores as **deep as possible** before backtracking. Uses stack (explicit or recursion).\n\n**Time**: O(V + E) | **Space**: O(V)\n\n**Applications**: Topological sorting, cycle detection, maze solving, strongly connected components." },
          { type: "heading", content: "## Dijkstra's Algorithm" },
          { type: "paragraph", content: "Finds **shortest path** from a source to all other vertices in a **weighted graph** (non-negative weights).\n\nUses a **priority queue** (min-heap). Time: O((V + E) log V).\n\n**Cannot handle negative edge weights** — use Bellman-Ford for that." },
          { type: "heading", content: "## Topological Sort" },
          { type: "paragraph", content: "Linear ordering of vertices in a **DAG** (Directed Acyclic Graph) such that for every edge u → v, u comes before v.\n\n**Algorithm**: Repeatedly remove vertices with no incoming edges (Kahn's) or use DFS post-order.\n\n**Applications**: Task scheduling, build systems, course prerequisites." },
        ],
      },
      {
        id: randomUUID(),
        title: "HTTP & RESTful API Design",
        subject: "Web Development",
        tags: JSON.stringify(["http", "rest", "api", "web"]),
        content: [
          { type: "heading", content: "# HTTP & RESTful API Design" },
          { type: "paragraph", content: "**REST** (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs use HTTP methods to perform CRUD operations on resources." },
          { type: "heading", content: "## HTTP Methods" },
          { type: "paragraph", content: "**GET** — Retrieve a resource. Safe and idempotent. Should never modify data.\n\n**POST** — Create a new resource. Not idempotent (calling twice creates two resources).\n\n**PUT** — Replace an entire resource. Idempotent.\n\n**PATCH** — Partially update a resource. Not necessarily idempotent.\n\n**DELETE** — Remove a resource. Idempotent." },
          { type: "heading", content: "## Status Codes" },
          { type: "paragraph", content: "**2xx Success**: 200 OK, 201 Created, 204 No Content\n**3xx Redirect**: 301 Moved Permanently, 304 Not Modified\n**4xx Client Error**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity\n**5xx Server Error**: 500 Internal Server Error, 503 Service Unavailable" },
          { type: "heading", content: "## Best Practices" },
          { type: "paragraph", content: "1. Use **nouns** for resources, not verbs: `/users` not `/getUsers`\n2. Use **plural** resource names: `/users/123` not `/user/123`\n3. Use **query params** for filtering: `/users?role=admin&active=true`\n4. Include **pagination**: `?page=2&limit=20`\n5. Version your API: `/api/v1/users`\n6. Use **HATEOAS** for discoverability\n7. Return consistent **error format**: `{ error: { code, message, details } }`" },
        ],
      },
      {
        id: randomUUID(),
        title: "Big O Notation Cheat Sheet",
        subject: "Algorithms",
        tags: JSON.stringify(["big-o", "complexity", "algorithms"]),
        content: [
          { type: "heading", content: "# Big O Notation — Quick Reference" },
          { type: "paragraph", content: "**Big O** describes the upper bound of an algorithm's growth rate as input size approaches infinity. It answers: *How does the runtime/space scale with input size?*" },
          { type: "heading", content: "## Common Complexities (Best → Worst)" },
          { type: "paragraph", content: "| Complexity | Name | Example |\n|---|---|---|\n| O(1) | Constant | Array access, hash table lookup |\n| O(log n) | Logarithmic | Binary search |\n| O(n) | Linear | Linear search, array traversal |\n| O(n log n) | Linearithmic | Merge sort, quick sort (avg) |\n| O(n²) | Quadratic | Bubble sort, nested loops |\n| O(2ⁿ) | Exponential | Recursive Fibonacci, power set |\n| O(n!) | Factorial | Permutations, traveling salesman brute force |" },
          { type: "heading", content: "## Rules for Analysis" },
          { type: "paragraph", content: "1. **Drop constants**: O(2n) → O(n)\n2. **Drop lower-order terms**: O(n² + n) → O(n²)\n3. **Different inputs = different variables**: Two arrays → O(a × b), not O(n²)\n4. **Sequential steps add**: O(a + b)\n5. **Nested steps multiply**: O(a × b)" },
          { type: "heading", content: "## Space Complexity" },
          { type: "paragraph", content: "Measures **extra memory** used by an algorithm (excluding input).\n\n- **In-place algorithms**: O(1) extra space (e.g., insertion sort)\n- **Recursive algorithms**: O(depth) stack space\n- **Merge sort**: O(n) auxiliary array\n- **Hash table**: O(n) space for n entries" },
        ],
      },
    ];

    // Insert notes and their blocks
    for (const note of noteData) {
      const noteId = note.id;
      const createdOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days
      const noteCreatedAt = now - createdOffset;
      const noteUpdatedAt = noteCreatedAt + Math.floor(Math.random() * 3600000); // Updated slightly after creation

      try {
        await db.insert(notes).values({
          id: noteId,
          title: note.title,
          subject: note.subject,
          userId,
          tags: note.tags,
          createdAt: noteCreatedAt,
          updatedAt: noteUpdatedAt,
        });

        // Insert note blocks with content
        for (let i = 0; i < note.content.length; i++) {
          const block = note.content[i];
          db.run(sql`
            INSERT INTO note_blocks (id, note_id, type, content, "order", note_type)
            VALUES (${randomUUID()}, ${noteId}, ${block.type}, ${block.content}, ${i}, 'general')
          `);
        }
      } catch (err) {
        console.log(`[CS SEED] Note creation error: ${err}`);
      }
    }
    console.log(`[CS SEED] 📝 Created ${noteData.length} notes with rich content`);

    // ==================== FLASHCARDS ====================
    const { seedFlashcards } = await import("./seed-flashcards");
    await seedFlashcards(userId);
    
    // ==================== QUIZZES ====================
    await seedQuizzes(userId);

    // ==================== STUDY SESSIONS ====================
    await seedStudySessions(userId);

    console.log("[CS SEED] ✅ Computer Science sample data seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding data:", error);
    return false;
  }
}

/**
 * Seed realistic study sessions for dashboard metrics.
 * Creates sessions spread across the last 7 days.
 */
async function seedStudySessions(userId: string) {
  const now = Date.now();
  const sessions = [
    // Today
    { type: "flashcards", dur: 25, items: 30, correct: 24, hoursAgo: 2 },
    { type: "quiz", dur: 18, items: 12, correct: 9, hoursAgo: 4 },
    // Yesterday
    { type: "flashcards", dur: 20, items: 25, correct: 20, hoursAgo: 26 },
    { type: "notes", dur: 35, items: 0, correct: 0, hoursAgo: 28 },
    // 2 days ago
    { type: "quiz", dur: 22, items: 12, correct: 10, hoursAgo: 50 },
    { type: "flashcards", dur: 15, items: 18, correct: 14, hoursAgo: 52 },
    // 3 days ago
    { type: "flashcards", dur: 30, items: 35, correct: 28, hoursAgo: 74 },
    { type: "notes", dur: 40, items: 0, correct: 0, hoursAgo: 76 },
    { type: "quiz", dur: 20, items: 12, correct: 8, hoursAgo: 78 },
    // 4 days ago
    { type: "flashcards", dur: 20, items: 22, correct: 18, hoursAgo: 98 },
    // 5 days ago
    { type: "quiz", dur: 25, items: 12, correct: 11, hoursAgo: 122 },
    { type: "flashcards", dur: 15, items: 15, correct: 12, hoursAgo: 124 },
    // 6 days ago
    { type: "notes", dur: 45, items: 0, correct: 0, hoursAgo: 146 },
    { type: "flashcards", dur: 20, items: 20, correct: 16, hoursAgo: 148 },
  ];

  for (const s of sessions) {
    const startedAt = now - (s.hoursAgo * 60 * 60 * 1000);
    try {
      db.run(sql`
        INSERT INTO study_sessions (id, user_id, session_type, duration_minutes, items_reviewed, correct_answers, started_at)
        VALUES (${randomUUID()}, ${userId}, ${s.type}, ${s.dur}, ${s.items}, ${s.correct}, ${startedAt})
      `);
    } catch (err) {
      // ignore
    }
  }
  console.log(`[CS SEED] 📊 Created ${sessions.length} study sessions for dashboard`);
}
