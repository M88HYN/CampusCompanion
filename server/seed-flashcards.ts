import { db } from "./db";
import { decks, cards } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedFlashcards(userId: string) {
  // IDEMPOTENT CHECK: Skip if user already has decks
  const existingDecks = await db.select().from(decks).where(eq(decks.userId, userId));
  if (existingDecks.length > 0) {
    console.log(`[FLASHCARD SEED] ⏭️  Skipping - User already has ${existingDecks.length} decks`);
    return { decksCreated: existingDecks.length, cardsCreated: 0 };
  }
  
  // ENFORCE CONSTRAINT: Limit to 10-15 decks (multi-subject support)
  const now = Date.now();
  const sampleDecks = [
    {
      id: crypto.randomUUID(),
      userId,
      title: "Data Structures Essentials",
      subject: "Computer Science",
      description: "Master fundamental data structures - arrays, linked lists, trees, and more",
      tags: JSON.stringify(["CS", "programming", "algorithms"]),
      difficulty: "medium",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "JavaScript Core Concepts",
      subject: "Web Development",
      description: "Essential JavaScript concepts including closures, promises, and the event loop",
      tags: JSON.stringify(["JavaScript", "web", "programming"]),
      difficulty: "medium",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "SQL & Database Fundamentals",
      subject: "Databases",
      description: "Core SQL commands and database concepts for efficient data management",
      tags: JSON.stringify(["SQL", "database", "backend"]),
      difficulty: "easy",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "Algorithms & Big O",
      subject: "Computer Science",
      description: "Algorithm analysis, time complexity, and common algorithmic patterns",
      tags: JSON.stringify(["algorithms", "Big O", "CS"]),
      difficulty: "hard",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "Object-Oriented Programming",
      subject: "Software Engineering",
      description: "OOP principles including encapsulation, inheritance, polymorphism, and SOLID",
      tags: JSON.stringify(["OOP", "design", "programming"]),
      difficulty: "medium",
      createdAt: now,
    },
    // ==================== NEW MULTI-SUBJECT DECKS ====================
    {
      id: crypto.randomUUID(),
      userId,
      title: "Calculus Essentials",
      subject: "Mathematics",
      description: "Core concepts of differentiation, integration, and limits",
      tags: JSON.stringify(["calculus", "math", "derivatives", "integrals"]),
      difficulty: "hard",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "English Grammar & Writing",
      subject: "English",
      description: "Essential grammar rules, sentence structure, and writing techniques",
      tags: JSON.stringify(["grammar", "writing", "language"]),
      difficulty: "easy",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "Physics Fundamentals",
      subject: "Physics",
      description: "Newton's laws, forces, energy, and motion principles",
      tags: JSON.stringify(["physics", "mechanics", "forces"]),
      difficulty: "medium",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "Business & Marketing Basics",
      subject: "Business Studies",
      description: "Marketing principles, the 4 Ps, and business strategy fundamentals",
      tags: JSON.stringify(["business", "marketing", "strategy"]),
      difficulty: "easy",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "Study Skills & Exam Technique",
      subject: "Study Skills",
      description: "Effective revision strategies, time management, and exam preparation",
      tags: JSON.stringify(["study-skills", "revision", "exams"]),
      difficulty: "easy",
      createdAt: now,
    },
  ];

  console.log(`[FLASHCARD SEED] Creating ${sampleDecks.length} decks for userId: ${userId}`);
  const createdDecks = await db.insert(decks).values(sampleDecks).returning();

  const dsCards = [
    { front: "What is an Array?", back: "A contiguous block of memory storing elements of the same type, accessed by index in O(1) time." },
    { front: "What is a Linked List?", back: "A linear data structure where elements (nodes) are connected via pointers. Each node contains data and a reference to the next node." },
    { front: "Stack vs Queue: Key difference?", back: "Stack: LIFO (Last In, First Out) - like a stack of plates.\nQueue: FIFO (First In, First Out) - like a line at a store." },
    { front: "What is a Binary Search Tree (BST)?", back: "A binary tree where left subtree contains only nodes with values less than the parent, and right subtree contains only nodes with values greater than the parent." },
    { front: "What is a Hash Table?", back: "A data structure that maps keys to values using a hash function. Provides O(1) average time for insert, delete, and lookup operations." },
    { front: "What is a Heap?", back: "A complete binary tree where each parent is greater (max-heap) or smaller (min-heap) than its children. Used for priority queues." },
    { front: "When would you use a Graph?", back: "When modeling relationships between objects: social networks, maps/navigation, dependency resolution, web page links, etc." },
    { front: "Array vs Linked List: When to use each?", back: "Array: Fast random access, fixed size, memory-efficient.\nLinked List: Frequent insertions/deletions, dynamic size, no wasted space." },
    { front: "What is a Trie?", back: "A tree-like data structure for storing strings where each node represents a character. Excellent for prefix-based searches and autocomplete." },
    { front: "Time complexity of common operations on a balanced BST?", back: "Search, Insert, Delete: O(log n) because the tree height is log(n) when balanced." },
    { front: "What is a Priority Queue?", back: "An abstract data type where elements are associated with priorities. Elements with higher priority are served before lower priority elements. Implemented using heaps." },
    { front: "Explain collision handling in Hash Tables.", back: "Chaining: Each bucket stores a list of entries with the same hash.\nOpen Addressing: Find another empty bucket (linear probing, quadratic probing, double hashing)." },
    { front: "What is a Doubly Linked List?", back: "A linked list where each node has pointers to both the next and previous nodes. Allows traversal in both directions but uses more memory." },
    { front: "Time and space complexity of common data structures?", back: "Array: O(1) access, O(n) insert/delete\nLinked List: O(n) access, O(1) insert/delete\nHash Table: O(1) avg all ops\nBST: O(log n) avg, O(n) worst" },
    { front: "What is an AVL Tree?", back: "A self-balancing BST that maintains balance through rotations. Height difference between left and right subtrees is at most 1. Guarantees O(log n) operations." },
    { front: "Difference between Set and Array?", back: "Set: Unordered, unique elements only, O(1) lookup, used for membership testing.\nArray: Ordered, allows duplicates, O(n) lookup by value." },
    { front: "What is a Skip List?", back: "A probabilistic data structure providing O(log n) search, insertion, and deletion. Simpler to implement than balanced trees but slightly slower in practice." },
    { front: "Explain the concept of Adjacency List vs Adjacency Matrix.", back: "List: Space-efficient O(V+E), better for sparse graphs.\nMatrix: O(V²) space, fast lookup O(1) for edge existence, better for dense graphs." },
    { front: "What is Hashing and why is it important?", back: "Converting input data into fixed-size hash codes for quick lookup. Used in hash tables, checksums, caching. Properties: deterministic, uniform distribution, avalanche effect." },
    { front: "What is a Segment Tree?", back: "A binary tree data structure for efficient range queries and updates on arrays. Each node represents an interval. Supports O(log n) range sum/min/max queries." },
    { front: "Difference between Stack and Heap memory?", back: "Stack: LIFO, fast, limited size, automatic cleanup, stores primitives and references.\nHeap: Dynamic allocation, slower, larger capacity, manual/garbage collected, stores objects." },
    { front: "What is a B-Tree?", back: "A self-balancing tree optimized for disk-based storage. All leaves at same level. Minimizes disk I/O by storing multiple keys per node. Used in databases and file systems." },
    { front: "Explain the concept of Space Complexity.", back: "Measure of memory an algorithm uses relative to input size. Includes auxiliary space (temporary variables, recursion stack). Important for large-scale applications." },
    { front: "What is a Circular Linked List?", back: "A linked list where the last node points back to the first node, forming a circle. No null reference. Useful for round-robin scheduling and circular buffers." },
    { front: "Define a Sparse Matrix and how to represent it efficiently.", back: "Matrix with mostly zeros. Efficient representations: COO (coordinate list), CSR (compressed sparse row), storing only non-zero elements to save space." },
    { front: "What is the difference between Static and Dynamic arrays?", back: "Static: Fixed size, allocated at compile time, faster allocation.\nDynamic: Resizable, allocated at runtime, flexible but slower growth (amortized O(1) insertion)." },
    { front: "Explain the concept of Tree Traversal methods.", back: "Preorder: Root-Left-Right\nInorder: Left-Root-Right (BST in sorted order)\nPostorder: Left-Right-Root\nLevel-order: BFS by levels" },
    { front: "What is a Multiset/Multimap?", back: "Like a Set/Map but allows duplicate keys. Maintains count of occurrences. Useful for frequency counting and duplicate handling." },
  ];

  const jsCards = [
    { front: "What is a Closure?", back: "A function that 'remembers' variables from its outer scope even after the outer function has returned. Creates private state." },
    { front: "What is the Event Loop?", back: "JavaScript's mechanism for handling async operations. Continuously checks the call stack and task queue, moving callbacks to the stack when it's empty." },
    { front: "var vs let vs const", back: "var: function-scoped, hoisted\nlet: block-scoped, can be reassigned\nconst: block-scoped, cannot be reassigned (but objects can be mutated)" },
    { front: "What is a Promise?", back: "An object representing the eventual completion or failure of an async operation. Has states: pending, fulfilled, or rejected." },
    { front: "What does 'this' refer to in JavaScript?", back: "Depends on how a function is called:\n- Method: the object\n- Function: global/undefined\n- Arrow function: inherited from enclosing scope\n- Constructor: new instance" },
    { front: "What is Hoisting?", back: "JavaScript's behavior of moving declarations to the top of their scope during compilation. Functions are fully hoisted; var is hoisted but not initialized." },
    { front: "Difference between == and ===?", back: "== performs type coercion before comparison\n=== strict equality, no type coercion\nAlways prefer === for predictable comparisons." },
    { front: "What is async/await?", back: "Syntactic sugar over Promises. 'async' marks a function as returning a Promise. 'await' pauses execution until a Promise resolves." },
    { front: "What is the Spread Operator (...)?", back: "Expands an iterable into individual elements.\nArrays: [...arr1, ...arr2]\nObjects: {...obj1, ...obj2}\nFunction args: fn(...args)" },
    { front: "What is Destructuring?", back: "Syntax for unpacking values from arrays or properties from objects:\nconst [a, b] = [1, 2]\nconst {name, age} = person" },
    { front: "Explain Prototype and Prototypal Inheritance.", back: "Every JavaScript object has a [[Prototype]]. Prototypal inheritance: objects inherit from other objects through the prototype chain. 'prototype' property on functions." },
    { front: "What is a Callback?", back: "A function passed as argument to another function, executed after some operation. Used for async operations before Promises/async-await. Can lead to callback hell." },
    { front: "What is the call(), apply(), and bind() method?", back: "All methods allow explicit 'this' binding.\ncall(thisArg, args): Invoke immediately with individual args\napply(thisArg, [args]): Invoke with array of args\nbind(thisArg): Returns new function with bound this" },
    { front: "What is Currying?", back: "Transforming a function with multiple arguments into a sequence of functions with single arguments. f(a,b,c) → f(a)(b)(c). Enables partial application." },
    { front: "Explain the difference between .map(), .filter(), and .reduce().", back: ".map(): Transform each element, return new array of same length\n.filter(): Keep elements matching condition, shorter array\n.reduce(): Accumulate values into single result" },
    { front: "What is the 'new' keyword in JavaScript?", back: "Creates a new object, sets its [[Prototype]] to constructor.prototype, calls constructor with 'this' bound to new object, returns the object." },
    { front: "What is Memoization?", back: "Optimization technique storing results of expensive function calls. Return cached result for same inputs. Trade-off: memory for speed." },
    { front: "Explain Temporal Dead Zone (TDZ).", back: "Time between entering scope and declaration of let/const variables. References throw ReferenceError. var doesn't have TDZ (hoisted and initialized with undefined)." },
    { front: "What is a Generator function?", back: "Function yielding multiple values over time using 'yield' keyword. Returns Iterator object. Lazy evaluation, memory efficient for large sequences." },
    { front: "What is Set and how does it differ from Array?", back: "Set: Unique values only, O(1) lookup/add/delete, insertion order preserved, no duplicates.\nArray: Allows duplicates, O(n) indexOf, good for ordered data." },
    { front: "Explain WeakMap and WeakSet.", back: "Weak collections holding weak references to objects. Objects can be garbage collected even if in WeakMap/WeakSet. No iteration, no size property. Used for private data." },
    { front: "What is the Symbol type?", back: "Primitive type for unique identifiers. Each Symbol is unique even with same description. Used for object property keys, well-known symbols (Symbol.iterator)." },
    { front: "What is Proxy and Reflect API?", back: "Proxy: Intercept and customize operations on objects (get, set, delete, etc).\nReflect: Provides methods for metaprogramming operations (reflect.get, reflect.set)." },
    { front: "Explain Microtasks vs Macrotasks.", back: "Microtasks (higher priority): Promise callbacks, process.nextTick, queueMicrotask\nMacrotasks (lower priority): setTimeout, setInterval, I/O\nAll microtasks run before next macrotask." },
    { front: "What is the Optional Chaining operator (?.) and Nullish Coalescing (??)?", back: "Optional Chaining: obj?.prop?.method?.() - safely access nested properties\nNullish Coalescing: value ?? default - returns right if left is null/undefined (not falsy)" },
    { front: "Explain Event Delegation.", back: "Technique adding single event listener to parent handling events from multiple children. Reduces listeners, enables handling dynamic elements. Uses event.target." },
    { front: "What is the difference between Object.freeze() and Object.seal()?", back: "freeze(): No property modification, addition, deletion\nseal(): No property addition/deletion, but can modify existing properties" },
    { front: "Explain Module Pattern and ES6 Modules.", back: "Module Pattern: IIFE wrapping code creating private scope with exported API.\nES6 Modules: Import/export syntax, static analysis, better tree-shaking, async loading." },
  ];

  const sqlCards = [
    { front: "SELECT statement syntax", back: "SELECT column1, column2\nFROM table_name\nWHERE condition\nORDER BY column\nLIMIT n;" },
    { front: "What is a PRIMARY KEY?", back: "A column (or set of columns) that uniquely identifies each row in a table. Cannot be NULL and must be unique." },
    { front: "INNER JOIN vs LEFT JOIN", back: "INNER JOIN: Returns only matching rows from both tables\nLEFT JOIN: Returns all rows from left table + matching rows from right (NULLs for no match)" },
    { front: "What is an INDEX?", back: "A database structure that improves query speed by creating a sorted reference to table data. Trade-off: faster reads, slower writes." },
    { front: "What is Normalization?", back: "Process of organizing database tables to reduce redundancy and improve data integrity. Common forms: 1NF, 2NF, 3NF." },
    { front: "GROUP BY clause", back: "Groups rows with the same values into summary rows. Often used with aggregate functions (COUNT, SUM, AVG, MAX, MIN)." },
    { front: "What is a FOREIGN KEY?", back: "A column that creates a link between two tables by referencing the PRIMARY KEY of another table. Enforces referential integrity." },
    { front: "HAVING vs WHERE", back: "WHERE: Filters rows before grouping\nHAVING: Filters groups after GROUP BY\nExample: HAVING COUNT(*) > 5" },
    { front: "What is a Transaction?", back: "A sequence of database operations treated as a single unit. Either all succeed (COMMIT) or all fail (ROLLBACK). Ensures ACID properties." },
    { front: "ACID properties", back: "Atomicity: All or nothing\nConsistency: Valid state to valid state\nIsolation: Transactions don't interfere\nDurability: Committed data persists" },
    { front: "Explain RIGHT JOIN and FULL OUTER JOIN.", back: "RIGHT JOIN: All rows from right table + matching from left (opposite of LEFT)\nFULL OUTER JOIN: All rows from both tables (combines LEFT and RIGHT)" },
    { front: "What is a View?", back: "Virtual table based on SELECT query result. Stored in database schema but doesn't store data. Used for security (limit columns), simplicity, and reusability." },
    { front: "Difference between DISTINCT and GROUP BY.", back: "DISTINCT: Returns unique rows, simple\nGROUP BY: Groups rows, requires aggregate function for other columns, more powerful." },
    { front: "What is a Subquery?", back: "Query nested inside another query. Can be in SELECT, FROM, WHERE, HAVING clauses. Correlated subquery references outer query columns." },
    { front: "Explain UNION and UNION ALL.", back: "UNION: Combines results from multiple queries, removes duplicates, slower\nUNION ALL: Combines results keeping duplicates, faster" },
    { front: "What is a Trigger?", back: "Database object executing automatically on specific events (INSERT, UPDATE, DELETE). Used for enforcing business logic, auditing, maintaining calculated columns." },
    { front: "What is a Stored Procedure?", back: "Precompiled SQL code stored in database. Can accept parameters, control flow, return values. Used for complex operations, security, performance." },
    { front: "Explain Denormalization and when to use it.", back: "Combining normalized tables to reduce joins and improve read performance. Trade-off: faster reads, slower writes, data redundancy, update complexity." },
    { front: "What is a Composite Key?", back: "PRIMARY KEY composed of multiple columns. Each column can be non-unique, but combination must be unique. Example: (student_id, course_id)." },
    { front: "Explain LIKE and wildcard patterns.", back: "LIKE 'pattern' for string matching.\n%: Any number of characters\n_: Single character\nExample: WHERE name LIKE 'J%' finds names starting with J" },
    { front: "What is CASCADE in Foreign Keys?", back: "Option to automatically delete/update child records when parent record is deleted/updated. Maintains referential integrity automatically." },
    { front: "Explain the difference between COUNT(*), COUNT(column), and COUNT(DISTINCT column).", back: "COUNT(*): Total rows including NULLs\nCOUNT(column): Non-NULL values in column\nCOUNT(DISTINCT column): Unique non-NULL values" },
    { front: "What is a Cross Join?", back: "Cartesian product of two tables. Returns all combinations of rows. Result size: rows1 × rows2. Rarely used intentionally." },
    { front: "Explain Query Optimization techniques.", back: "Use indexes, avoid SELECT *, write efficient WHERE clauses, use JOINs over subqueries, denormalize strategically, analyze query execution plans." },
    { front: "What is Database Sharding?", back: "Partitioning data across multiple database instances (shards). Each shard holds subset of data. Enables horizontal scaling for large datasets." },
    { front: "Explain the difference between Clustered and Non-Clustered Index.", back: "Clustered: Determines physical order of rows, one per table, usually PRIMARY KEY.\nNon-Clustered: Separate structure pointing to data, multiple per table, used for faster lookups." },
    { front: "What is a Window Function?", back: "Performs calculations across related rows. Functions: ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD(), SUM() OVER (...). Useful for analytics." },
    { front: "Explain CASE statement in SQL.", back: "Conditional logic: CASE WHEN condition1 THEN result1 WHEN condition2 THEN result2 ELSE result3 END. Used in SELECT, WHERE, ORDER BY clauses." },
  ];

  const algoCards = [
    { front: "What is Big O Notation?", back: "A way to describe algorithm efficiency as input grows. Describes worst-case time/space complexity. Common: O(1), O(log n), O(n), O(n log n), O(n²)" },
    { front: "Time complexity of Binary Search", back: "O(log n) - halves the search space with each comparison. Requires sorted input." },
    { front: "Time complexity of common sorting algorithms", back: "Bubble/Selection/Insertion: O(n²)\nMerge Sort/Quick Sort (avg): O(n log n)\nCounting/Radix Sort: O(n+k)" },
    { front: "What is Recursion?", back: "A function that calls itself with a smaller input until reaching a base case. Stack-based. Every recursive solution has an iterative equivalent." },
    { front: "What is Dynamic Programming?", back: "Solving complex problems by breaking them into overlapping subproblems and storing solutions to avoid redundant computation. Memoization or tabulation." },
    { front: "BFS vs DFS", back: "BFS (Breadth-First): Uses queue, explores level by level, finds shortest path\nDFS (Depth-First): Uses stack/recursion, explores as far as possible first" },
    { front: "What is a Greedy Algorithm?", back: "Makes the locally optimal choice at each step, hoping to find a global optimum. Fast but doesn't always find the best solution." },
    { front: "Time complexity of accessing an element in a Hash Table", back: "Average: O(1)\nWorst case: O(n) when many collisions occur" },
    { front: "What is the Two Pointer technique?", back: "Using two pointers to traverse data, typically from both ends or at different speeds. Useful for sorted arrays, linked lists, and finding pairs." },
    { front: "Space complexity of Merge Sort vs Quick Sort", back: "Merge Sort: O(n) - needs auxiliary array\nQuick Sort: O(log n) - in-place, only stack space for recursion" },
    { front: "What is Divide and Conquer?", back: "Algorithm paradigm: divide problem into subproblems, solve independently, combine solutions. Examples: Merge Sort, Quick Sort, Binary Search." },
    { front: "Explain Linear Search vs Binary Search.", back: "Linear: O(n) time, works on unsorted data, simple.\nBinary: O(log n) time, requires sorted data, much faster for large datasets." },
    { front: "What is the Master Theorem?", back: "Method for analyzing divide-and-conquer algorithms. Determines time complexity T(n) = aT(n/b) + f(n). Three cases based on f(n) relative to n^(log_b a)." },
    { front: "Explain Backtracking.", back: "Technique exploring all possible solutions by incrementally building candidates, abandoning those failing constraints. Used for puzzles, permutations, combinatorics." },
    { front: "What is Memoization vs Tabulation?", back: "Memoization: Top-down DP, recursion with caching, easier to understand.\nTabulation: Bottom-up DP, iteration with array, more efficient, avoids recursion overhead." },
    { front: "Time complexity of Bubble Sort and when to use it.", back: "O(n²) worst/average, O(n) best. Simple but slow. Use only for: nearly sorted data, small arrays, educational purposes." },
    { front: "Explain the concept of Amortized Time Complexity.", back: "Average time per operation over sequence of operations, not individual operation. Example: Dynamic array append O(n) occasionally, but O(1) amortized." },
    { front: "What is a Sliding Window algorithm?", back: "Efficient technique for problems involving subarrays/substrings. Maintain fixed-size window, slide across data, update window in O(1). Examples: max subarray sum." },
    { front: "Explain Interval Scheduling and Greedy approach.", back: "Greedy: Sort by end time, select non-overlapping intervals. Optimal solution guaranteed. Used for room allocation, meeting scheduling." },
    { front: "What is the Traveling Salesman Problem (TSP)?", back: "NP-hard problem finding shortest route visiting each city once. No known polynomial solution. Solvable with DP (exponential), heuristics (approximations)." },
    { front: "Explain Topological Sorting.", back: "Linear ordering of DAG (Directed Acyclic Graph) vertices where every edge u→v has u before v. Used for: task scheduling, dependency resolution." },
    { front: "What is the Longest Common Subsequence (LCS) problem?", back: "Find longest sequence appearing in same order in two strings. Solved with DP O(m×n). Related: edit distance, sequence alignment." },
    { front: "Explain the Floyd-Warshall Algorithm.", back: "All-pairs shortest path algorithm. Time: O(n³), Space: O(n²). Works with negative weights (no negative cycles). Returns shortest path matrix." },
    { front: "What is Dijkstra's Algorithm?", back: "Single-source shortest path algorithm. Time: O(E log V) with min-heap. Greedy approach. Cannot handle negative edge weights. Used in GPS, routing." },
    { front: "Explain the concept of NP-Completeness.", back: "NP-Complete problems: verifiable in polynomial time, as hard as any NP problem. If one solved in polynomial time, all solved. Examples: 3-SAT, TSP, Hamiltonian Cycle." },
    { front: "What is the Knapsack Problem?", back: "Given items with weights and values, pack maximum value into limited capacity. 0/1 variant solved with DP O(nW). Pseudo-polynomial, not strongly polynomial." },
    { front: "Explain Rabin-Karp Algorithm for string matching.", back: "Pattern matching using rolling hash. Time: O(n+m) average, O(nm) worst. Efficient for multiple pattern search, plagiarism detection." },
    { front: "What is a Huffman Coding?", back: "Greedy algorithm for optimal prefix-free encoding. Frequently occurring characters get shorter codes. Used for compression. Builds binary tree bottom-up." },
  ];

  const oopCards = [
    { front: "What is Encapsulation?", back: "Bundling data and methods that operate on that data within a single unit (class), hiding internal state from outside access. Use getters/setters for controlled access." },
    { front: "What is Inheritance?", back: "A mechanism where a new class (child) derives properties and behaviors from an existing class (parent). Promotes code reuse and establishes an 'is-a' relationship." },
    { front: "What is Polymorphism?", back: "The ability to treat objects of different classes through a common interface. Same method name, different implementations. Enables flexibility and extensibility." },
    { front: "What is Abstraction?", back: "Hiding complex implementation details and showing only essential features. Achieved through abstract classes and interfaces. Simplifies interaction with objects." },
    { front: "What is the Single Responsibility Principle?", back: "A class should have only one reason to change. Each class should do one thing well. Part of SOLID principles." },
    { front: "Open/Closed Principle", back: "Software entities should be open for extension but closed for modification. Add new functionality through new code, not by changing existing code." },
    { front: "What is an Interface?", back: "A contract that defines methods a class must implement, without providing implementation. Enables polymorphism and loose coupling." },
    { front: "Composition vs Inheritance", back: "Composition: 'has-a' relationship, more flexible, combine behaviors\nInheritance: 'is-a' relationship, can lead to tight coupling\nPrefer composition over inheritance." },
    { front: "What is the Dependency Inversion Principle?", back: "High-level modules should not depend on low-level modules. Both should depend on abstractions. Enables easier testing and swapping implementations." },
    { front: "What is a Design Pattern?", back: "A reusable solution to common software design problems. Categories: Creational (Factory, Singleton), Structural (Adapter, Decorator), Behavioral (Observer, Strategy)." },
    { front: "Explain the Liskov Substitution Principle.", back: "Objects of subclass should be substitutable for objects of superclass without breaking functionality. Maintain contract of parent class. Prevents incorrect inheritance hierarchies." },
    { front: "What is the Interface Segregation Principle?", back: "Clients shouldn't depend on interfaces they don't use. Split large interfaces into smaller, specific ones. Reduces coupling, improves flexibility." },
    { front: "What is the Singleton Pattern?", back: "Ensures only one instance of class exists. Provides global access point. Useful for: loggers, database connections, configuration managers. Thread-safe implementation important." },
    { front: "What is the Factory Pattern?", back: "Creational pattern creating objects without specifying exact classes. Factory method hides object creation logic. Useful when object creation is complex or class varies." },
    { front: "What is the Observer Pattern?", back: "Behavioral pattern where observers register with subject to receive notifications of changes. Decouples subject from observers. Used in: event systems, MVC, reactive programming." },
    { front: "What is the Strategy Pattern?", back: "Behavioral pattern defining family of algorithms, encapsulating each, making interchangeable. Eliminates conditional statements. Example: different sorting algorithms." },
    { front: "What is the Decorator Pattern?", back: "Structural pattern dynamically adding functionality to objects without modifying class. Alternative to subclassing. Example: adding features to I/O streams." },
    { front: "Explain Method Overloading vs Method Overriding.", back: "Overloading: Same method name, different parameters, compile-time (static) polymorphism.\nOverriding: Same method signature, different implementation, runtime (dynamic) polymorphism." },
    { front: "What is the Template Method Pattern?", back: "Behavioral pattern defining algorithm skeleton, letting subclasses override specific steps. Enforces algorithm structure while allowing variation." },
    { front: "What is the Adapter Pattern?", back: "Structural pattern converting interface of class to another interface clients expect. Used to make incompatible interfaces work together." },
    { front: "What is the Builder Pattern?", back: "Creational pattern constructing complex objects step-by-step. Separates object construction from representation. Useful for objects with many parameters." },
    { front: "Explain Cohesion and Coupling.", back: "High Cohesion: Elements within module are strongly related. Desirable.\nLow Coupling: Minimal dependencies between modules. Desirable. Goal: high cohesion, low coupling." },
    { front: "What is the MVC Pattern?", back: "Model: Data and business logic\nView: Presentation layer\nController: Handles user input\nSeparates concerns, enables independent development and testing." },
    { front: "What is the Facade Pattern?", back: "Structural pattern providing simplified interface to complex subsystem. Hides complexity, provides convenient API. Improves usability." },
    { front: "Explain the concept of Immutability.", back: "Objects cannot be modified after creation. Benefits: thread-safety, predictability, caching. Example: strings in many languages are immutable." },
    { front: "What is the Proxy Pattern?", back: "Structural pattern providing surrogate/placeholder for another object. Controls access, adds functionality (logging, caching). Example: lazy loading, access control." },
    { front: "What are Access Modifiers?", back: "public: Accessible everywhere\nprivate: Accessible only within class\nprotected: Accessible in class and subclasses\npackage/internal: Within same package" },
  ];

  // ==================== NEW MULTI-SUBJECT CARD ARRAYS ====================
  
  const calculusCards = [
    { front: "What is a derivative?", back: "The instantaneous rate of change of a function. Geometrically, it's the slope of the tangent line at a point. Formula: f'(x) = lim(h→0) [f(x+h) - f(x)] / h" },
    { front: "Power Rule for derivatives", back: "If f(x) = xⁿ, then f'(x) = nxⁿ⁻¹. Example: d/dx(x³) = 3x²" },
    { front: "What does an integral represent?", back: "The area under a curve. Also the antiderivative - reversing differentiation. Definite integral gives exact area, indefinite integral gives function + C." },
    { front: "Fundamental Theorem of Calculus", back: "Connects derivatives and integrals: ∫ₐᵇ f(x)dx = F(b) - F(a) where F'(x) = f(x). Shows integration and differentiation are inverse operations." },
    { front: "Product Rule", back: "If f(x) = u(x)·v(x), then f'(x) = u'v + uv'. Example: d/dx[x²·sin(x)] = 2x·sin(x) + x²·cos(x)" },
    { front: "Chain Rule", back: "If f(x) = g(h(x)), then f'(x) = g'(h(x))·h'(x). Derivative of outer × derivative of inner. Example: d/dx[sin(x²)] = cos(x²)·2x" },
    { front: "What is a limit?", back: "The value a function approaches as input approaches some value. Foundation of calculus. lim(x→a) f(x) = L means f(x) gets arbitrarily close to L as x approaches a." },
    { front: "L'Hôpital's Rule", back: "For indeterminate forms 0/0 or ∞/∞: lim(x→a) f(x)/g(x) = lim(x→a) f'(x)/g'(x). Take derivatives of top and bottom separately." },
    { front: "Quotient Rule", back: "If f(x) = u/v, then f'(x) = (u'v - uv')/v². Lo d-Hi minus Hi d-Lo over Lo-Lo." },
    { front: "Critical Points", back: "Where f'(x) = 0 or f'(x) doesn't exist. Potential locations for local maxima, minima, or inflection points. Test with first or second derivative." },
    { front: "Integration by Substitution", back: "Reverse chain rule. Let u = g(x), then du = g'(x)dx. Transform ∫f(g(x))g'(x)dx into ∫f(u)du. Example: ∫2x·cos(x²)dx, let u=x²" },
    { front: "Integral of 1/x", back: "∫(1/x)dx = ln|x| + C. One of the most important integrals. Absolute value needed because ln only defined for positive numbers." },
    { front: "Second Derivative Test", back: "At critical point x=c: If f''(c) > 0, local minimum. If f''(c) < 0, local maximum. If f''(c) = 0, test is inconclusive." },
    { front: "Mean Value Theorem", back: "If f is continuous on [a,b] and differentiable on (a,b), there exists c where f'(c) = [f(b)-f(a)]/(b-a). Guarantees a point with slope equal to average slope." },
    { front: "Derivative of e^x", back: "d/dx[e^x] = e^x. The function equals its own derivative. This makes e^x unique and central to calculus." },
  ];

  const englishCards = [
    { front: "Subject vs Object Pronouns", back: "Subject (do action): I, you, he, she, it, we, they\nObject (receive action): me, you, him, her, it, us, them. Example: 'She gave it to me'" },
    { front: "Active vs Passive Voice", back: "Active: Subject does the action ('John wrote the letter')\nPassive: Subject receives the action ('The letter was written by John'). Active is clearer and more direct." },
    { front: "Independent vs Dependent Clause", back: "Independent: Complete thought, can stand alone ('I went to the store')\nDependent: Incomplete, needs main clause ('because I was hungry')" },
    { front: "Comma Splice Error", back: "Incorrectly joining two independent clauses with only a comma. Wrong: 'I went home, I was tired.' Fix: use semicolon, period, or conjunction." },
    { front: "Its vs It's", back: "Its = possessive ('The dog wagged its tail')\nIt's = contraction of 'it is' or 'it has' ('It's raining'). No apostrophe for possessive with 'it'!" },
    { front: "Who vs Whom", back: "Who = subject ('Who called?')\nWhom = object ('To whom did you speak?'). If you can replace with he/she, use 'who'. If him/her works, use 'whom'." },
    { front: "Affect vs Effect", back: "Affect = verb meaning to influence ('The weather affects mood')\nEffect = noun meaning result ('The effect was dramatic'). Rare: effect as verb means to cause." },
    { front: "Present Perfect Tense", back: "Has/have + past participle. Shows action started in past, continues to present or has present relevance. 'I have lived here for 5 years.'" },
    { front: "Parallel Structure", back: "Items in a series should have the same grammatical form. Wrong: 'I like running, swimming, and to bike.' Right: 'I like running, swimming, and biking.'" },
    { front: "Modifier Placement", back: "Place modifiers next to what they modify. Misplaced: 'I saw a dog on my way to work that was huge.' Better: 'On my way to work, I saw a huge dog.'" },
    { front: "Thesis Statement", back: "Central argument of an essay, usually at end of introduction. Should be specific, debatable, and preview main points. Guides entire paper." },
    { front: "Topic Sentence", back: "First sentence of paragraph stating main idea. All other sentences in paragraph should support it. Helps readers follow structure." },
    { front: "Transitions", back: "Words/phrases connecting ideas: however, therefore, furthermore, in contrast, as a result. Improve flow and show relationships between ideas." },
    { front: "Run-on Sentence", back: "Two or more independent clauses improperly joined without punctuation or conjunction. Fix with period, semicolon, comma + conjunction, or subordination." },
    { front: "Apostrophe Rules", back: "Possession: add 's (John's book)\nPlural possession: add s' (students' desks)\nContractions: replace missing letters (can't, won't)\nNever use for plural!" },
  ];

  const physicsCards = [
    { front: "Newton's First Law", back: "Law of Inertia: An object at rest stays at rest, an object in motion stays in motion with constant velocity unless acted upon by external force." },
    { front: "Newton's Second Law", back: "F = ma. Force equals mass times acceleration. Greater force or less mass results in greater acceleration. Units: Newtons (N) = kg·m/s²" },
    { front: "Newton's Third Law", back: "For every action, there is an equal and opposite reaction. Forces always come in pairs. Example: rocket pushes gas down, gas pushes rocket up." },
    { front: "Kinetic Energy Formula", back: "KE = ½mv². Energy of motion. Depends on mass and velocity squared. Doubling velocity quadruples kinetic energy." },
    { front: "Potential Energy Formula", back: "PE = mgh. Gravitational potential energy. m = mass, g = gravity (9.8 m/s²), h = height. Energy due to position." },
    { front: "Conservation of Energy", back: "Energy cannot be created or destroyed, only transformed. Total energy in isolated system remains constant. KE + PE = constant." },
    { front: "Work Formula", back: "W = F·d·cos(θ). Work = force × displacement × cos(angle). Only force component parallel to motion does work. Units: Joules (J)" },
    { front: "Power Definition", back: "P = W/t or P = F·v. Rate of doing work or transferring energy. Units: Watts (W) = Joules/second. 1 horsepower = 746 watts." },
    { front: "Momentum", back: "p = mv. Product of mass and velocity. Vector quantity. Conserved in all collisions. Heavy slow object can have same momentum as light fast object." },
    { front: "Conservation of Momentum", back: "Total momentum before collision = total momentum after collision. Applies to all collisions (elastic and inelastic) in isolated systems." },
    { front: "Elastic vs Inelastic Collision", back: "Elastic: KE conserved (billiard balls)\nInelastic: KE not conserved, some becomes heat/sound (car crash)\nBoth conserve momentum!" },
    { front: "Acceleration Due to Gravity", back: "g = 9.8 m/s² or ≈10 m/s² on Earth. All objects fall at same rate (ignoring air resistance). Galileo proved this." },
    { front: "Velocity vs Speed", back: "Speed: scalar, magnitude only\nVelocity: vector, magnitude AND direction. Constant speed ≠ constant velocity if direction changes." },
    { front: "Friction Types", back: "Static: prevents motion (μₛ, larger)\nKinetic: opposes motion (μₖ, smaller)\nF = μN where N is normal force. Always opposes motion." },
    { front: "Centripetal Force", back: "Force directed toward center causing circular motion. F = mv²/r. Not a new type of force - tension, gravity, friction can provide it." },
  ];

  const businessCards = [
    { front: "The 4 Ps of Marketing", back: "Product (what you sell), Price (how much), Place (where sold), Promotion (how advertised). Core marketing mix for strategy development." },
    { front: "Market Segmentation", back: "Dividing market into smaller groups with similar characteristics/needs. Types: demographic, geographic, psychographic, behavioral. Enables targeted marketing." },
    { front: "USP (Unique Selling Proposition)", back: "Distinctive feature that makes product stand out from competitors. Clear reason for customers to choose you. Example: 'Fastest delivery' or 'Lowest price guaranteed'" },
    { front: "Primary vs Secondary Research", back: "Primary: NEW data collected firsthand (surveys, interviews)\nSecondary: EXISTING data from published sources (reports, studies). Primary is specific but expensive." },
    { front: "SWOT Analysis", back: "Strengths (internal advantages), Weaknesses (internal disadvantages), Opportunities (external chances), Threats (external risks). Strategic planning tool." },
    { front: "Supply and Demand", back: "Supply: quantity producers willing to sell at price\nDemand: quantity consumers willing to buy at price\nEquilibrium: where supply = demand, determines market price." },
    { front: "Price Elasticity of Demand", back: "How demand changes when price changes. Elastic: big change in demand (luxuries). Inelastic: small change in demand (necessities). Affects pricing strategy." },
    { front: "Penetration Pricing", back: "Setting LOW initial price to gain market share quickly, then raise later. Good for competitive markets. Risk: hard to raise prices, low profit initially." },
    { front: "Skimming Pricing", back: "Setting HIGH initial price, then lower over time. Good for new innovative products. Maximizes profit from early adopters before competition enters." },
    { front: "Profit Formula", back: "Profit = Revenue - Costs. Revenue = Price × Quantity Sold. Increase profit by raising price, selling more, or cutting costs." },
    { front: "Fixed vs Variable Costs", back: "Fixed: Don't change with output (rent, salaries)\nVariable: Change with output (raw materials, packaging). Total Cost = Fixed + Variable." },
    { front: "Break-Even Point", back: "Level of sales where total revenue = total costs. No profit, no loss. Below = loss, above = profit. Formula: Fixed Costs ÷ (Price - Variable Cost per unit)" },
    { front: "Product Life Cycle", back: "Introduction (launch), Growth (sales rise), Maturity (peak sales), Decline (sales fall). Different strategies needed at each stage." },
    { front: "Promotional Mix", back: "Advertising (paid announcements), Sales Promotion (discounts, coupons), Personal Selling (face-to-face), Public Relations (image management). Integrated approach works best." },
    { front: "Branding Benefits", back: "Recognition, differentiation, customer loyalty, premium pricing, easier product launches. Strong brands are company's most valuable asset." },
  ];

  const studySkillsCards  = [
    { front: "Pomodoro Technique", back: "25 minutes focused work, 5 minute break. After 4 cycles, take 15-30 minute break. Prevents burnout, maintains focus, creates urgency." },
    { front: "Active Recall", back: "Testing yourself WITHOUT notes. Forces brain to retrieve information, strengthening memory. Much more effective than re-reading. Use flashcards, practice questions." },
    { front: "Spaced Repetition", back: "Reviewing material at increasing intervals (1 day, 3 days, 1 week, 1 month). Fights forgetting curve. Review just before you'd forget for maximum efficiency." },
    { front: "Feynman Technique", back: "Explain concept in simple terms as if teaching a child. Identifies gaps in understanding. Forces you to truly comprehend, not just memorize." },
    { front: "SQ3R Reading Method", back: "Survey (skim), Question (ask what you'll learn), Read (actively), Recite (summarize aloud), Review (go over key points). Improves comprehension and retention." },
    { front: "Cornell Note-Taking", back: "Divide page: notes (right), cues/questions (left), summary (bottom). During class: take notes. After: add questions, write summary. Best for lectures." },
    { front: "Mind Mapping", back: "Visual diagram with central concept, branching ideas. Uses colors, images, keywords. Engages right brain, shows connections, easier to remember than lists." },
    { front: "Chunking Information", back: "Breaking large amounts of info into smaller groups. Brain handles 7±2 chunks at once. Example: remembering phone numbers in groups, not 10 separate digits." },
    { front: "Interleaving Practice", back: "Mixing different topics/skills in one session rather than blocking. Harder initially but improves retention and transfer. Example: math - do mixed problems, not all one type." },
    { front: "Testing Effect", back: "Taking practice tests improves learning more than re-studying. Forces retrieval, identifies weak areas, reduces test anxiety, improves actual exam performance." },
    { front: "Sleep and Memory", back: "Sleep consolidates memories from short-term to long-term. All-nighters are counterproductive. Study, sleep, remember. REM sleep especially important for retention." },
    { front: "Elaborative Rehearsal", back: "Connecting new info to existing knowledge. Ask 'why' and 'how'. Create meaningful associations. Example: link new concept to personal experience." },
    { front: "Metacognition", back: "Thinking about your thinking. Monitor your understanding. Ask: 'Do I really get this?' Adjust study strategies based on what works. Self-awareness improves learning." },
    { front: "Growth Mindset", back: "Believing abilities can improve with effort. Embrace challenges, persist despite setbacks, view failure as learning opportunity. Opposite: fixed mindset ('I'm just not good at math')." },
    { front: "Pre-Exam Strategy", back: "Night before: Light review, organize materials, sleep 7-8 hours. Morning: Eat protein breakfast, arrive early. First 5 min: Read all questions, plan time, start with easiest." },
  ];

  // Helper function to generate realistic learning states
  const getRandomLearningState = () => {
    const rand = Math.random();
    const now = new Date();
    
    // 30% mastered cards (reviewed many times, long intervals)
    if (rand < 0.30) {
      return {
        reviewCount: 10 + Math.floor(Math.random() * 10),
        easeFactor: 2.2 + Math.random() * 0.6,
        interval: 40 + Math.floor(Math.random() * 40),
        dueAt: new Date(now.getTime() + (30 + Math.floor(Math.random() * 60)) * 24 * 60 * 60 * 1000),
        status: "mastered" as const,
      };
    }
    // 25% learning cards (moderate reviews, short intervals)
    else if (rand < 0.55) {
      return {
        reviewCount: 3 + Math.floor(Math.random() * 4),
        easeFactor: 1.8 + Math.random() * 0.5,
        interval: 3 + Math.floor(Math.random() * 10),
        dueAt: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Some overdue
        status: "learning" as const,
      };
    }
    // 20% struggling cards (few reviews, very short intervals, low ease)
    else if (rand < 0.75) {
      return {
        reviewCount: 1 + Math.floor(Math.random() * 3),
        easeFactor: 1.3 + Math.random() * 0.4,
        interval: 1 + Math.floor(Math.random() * 3),
        dueAt: new Date(now.getTime() - (1 + Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000), // Overdue
        status: "learning" as const,
      };
    }
    // 25% new cards (no reviews)
    else {
      return {
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
        dueAt: now,
        status: "new" as const,
      };
    }
  };

  // Prepare card data by deck
  const cardsByDeck = [
    { cards: dsCards, deckId: createdDecks[0].id, tags: JSON.stringify(["data-structures"]) },
    { cards: jsCards, deckId: createdDecks[1].id, tags: JSON.stringify(["javascript"]) },
    { cards: sqlCards, deckId: createdDecks[2].id, tags: JSON.stringify(["sql", "database"]) },
    { cards: algoCards, deckId: createdDecks[3].id, tags: JSON.stringify(["algorithms"]) },
    { cards: oopCards, deckId: createdDecks[4].id, tags: JSON.stringify(["oop"]) },
    // New multi-subject decks
    { cards: calculusCards, deckId: createdDecks[5].id, tags: JSON.stringify(["calculus", "math"]) },
    { cards: englishCards, deckId: createdDecks[6].id, tags: JSON.stringify(["grammar", "writing"]) },
    { cards: physicsCards, deckId: createdDecks[7].id, tags: JSON.stringify(["physics", "mechanics"]) },
    { cards: businessCards, deckId: createdDecks[8].id, tags: JSON.stringify(["business", "marketing"]) },
    { cards: studySkillsCards, deckId: createdDecks[9].id, tags: JSON.stringify(["study-skills", "revision"]) },
  ];

  // First pass: Insert base card data with required fields
  const baseCards = cardsByDeck.flatMap(({ cards, deckId, tags }) =>
    cards.map(c => ({
      id: crypto.randomUUID(),
      ...c,
      deckId,
      type: "basic" as const,
      tags,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueAt: now,
      status: "new" as const,
      createdAt: now,
    }))
  );

  // Insert all cards
  const insertedCards = await db.insert(cards).values(baseCards).returning();

  // Second pass: Update cards with varied learning states (30% mastered, 25% learning, 20% struggling, 25% new)
  const cardsWithStates = insertedCards.map(card => {
    const state = getRandomLearningState();
    return {
      id: card.id,
      repetitions: state.reviewCount,
      easeFactor: state.easeFactor,
      interval: state.interval,
      dueAt: state.dueAt.getTime(), // Convert to timestamp
      status: state.status,
      lastReviewedAt: state.reviewCount > 0 ? state.dueAt.getTime() - (state.interval * 24 * 60 * 60 * 1000) : null,
    };
  });

  // Update all cards with learning state
  for (const cardUpdate of cardsWithStates) {
    await db.update(cards)
      .set({
        repetitions: cardUpdate.repetitions,
        easeFactor: cardUpdate.easeFactor,
        interval: cardUpdate.interval,
        dueAt: cardUpdate.dueAt,
        status: cardUpdate.status,
        lastReviewedAt: cardUpdate.lastReviewedAt,
      })
      .where(eq(cards.id, cardUpdate.id));
  }

  // VALIDATION: Check constraints
  const finalDecks = await db.select().from(decks).where(eq(decks.userId, userId));
  const finalCards = await db.select().from(cards);
  
  console.log(`[FLASHCARD SEED] ✅ Seed complete. Created ${createdDecks.length} decks, ${insertedCards.length} cards`);
  
  if (finalDecks.length > 10) {
    console.warn(`[FLASHCARD SEED] ⚠️  WARNING: User has ${finalDecks.length} decks (max should be 10)`);
  } else if (finalDecks.length < 5) {
    console.warn(`[FLASHCARD SEED] ⚠️  WARNING: User has ${finalDecks.length} decks (min should be 5)`);
  }
  
  // Verify each deck has 10-30 cards
  for (const deck of finalDecks) {
    const deckCards = finalCards.filter(c => c.deckId === deck.id);
    if (deckCards.length < 10 || deckCards.length > 30) {
      console.warn(`[FLASHCARD SEED] ⚠️  WARNING: Deck "${deck.title}" has ${deckCards.length} cards (should be 10-30)`);
    }
  }

  return { decksCreated: createdDecks.length, cardsCreated: insertedCards.length };
}
