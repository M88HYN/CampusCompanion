import { db } from "./db";
import { decks, cards } from "@shared/schema";

export async function seedFlashcards(userId: string) {
  const sampleDecks = [
    {
      id: crypto.randomUUID(),
      userId,
      title: "Data Structures Essentials",
      subject: "Computer Science",
      description: "Master fundamental data structures - arrays, linked lists, trees, and more",
      tags: ["CS", "programming", "algorithms"],
      difficulty: "medium",
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "JavaScript Core Concepts",
      subject: "Web Development",
      description: "Essential JavaScript concepts including closures, promises, and the event loop",
      tags: ["JavaScript", "web", "programming"],
      difficulty: "medium",
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "SQL & Database Fundamentals",
      subject: "Databases",
      description: "Core SQL commands and database concepts for efficient data management",
      tags: ["SQL", "database", "backend"],
      difficulty: "easy",
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "Algorithms & Big O",
      subject: "Computer Science",
      description: "Algorithm analysis, time complexity, and common algorithmic patterns",
      tags: ["algorithms", "Big O", "CS"],
      difficulty: "hard",
    },
    {
      id: crypto.randomUUID(),
      userId,
      title: "Object-Oriented Programming",
      subject: "Software Engineering",
      description: "OOP principles including encapsulation, inheritance, polymorphism, and SOLID",
      tags: ["OOP", "design", "programming"],
      difficulty: "medium",
    },
  ];

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
  ];

  const allCards = [
    ...dsCards.map(c => ({ ...c, deckId: createdDecks[0].id, type: "basic" as const, tags: ["data-structures"] })),
    ...jsCards.map(c => ({ ...c, deckId: createdDecks[1].id, type: "basic" as const, tags: ["javascript"] })),
    ...sqlCards.map(c => ({ ...c, deckId: createdDecks[2].id, type: "basic" as const, tags: ["sql", "database"] })),
    ...algoCards.map(c => ({ ...c, deckId: createdDecks[3].id, type: "basic" as const, tags: ["algorithms"] })),
    ...oopCards.map(c => ({ ...c, deckId: createdDecks[4].id, type: "basic" as const, tags: ["oop"] })),
  ];

  await db.insert(cards).values(allCards);

  return { decksCreated: createdDecks.length, cardsCreated: allCards.length };
}
