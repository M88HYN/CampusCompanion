import { db } from "./db";
import { quizzes, quizQuestions, quizOptions, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const sampleQuizzes = [
  {
    title: "Data Structures Fundamentals",
    subject: "Computer Science",
    description: "Test your knowledge of arrays, linked lists, stacks, queues, trees, and graphs",
    mode: "practice",
    passingScore: 70,
    questions: [
      {
        type: "mcq",
        question: "What is the time complexity of accessing an element by index in an array?",
        difficulty: 1,
        marks: 1,
        explanation: "Arrays provide constant-time O(1) access because elements are stored in contiguous memory locations, allowing direct calculation of any element's address.",
        options: [
          { text: "O(1)", isCorrect: true },
          { text: "O(n)", isCorrect: false },
          { text: "O(log n)", isCorrect: false },
          { text: "O(n²)", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which data structure uses LIFO (Last In, First Out) principle?",
        difficulty: 1,
        marks: 1,
        explanation: "A stack follows LIFO - the last element pushed onto the stack is the first one to be popped off. Think of a stack of plates.",
        options: [
          { text: "Queue", isCorrect: false },
          { text: "Stack", isCorrect: true },
          { text: "Linked List", isCorrect: false },
          { text: "Array", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the worst-case time complexity of inserting at the beginning of a singly linked list?",
        difficulty: 2,
        marks: 1,
        explanation: "Inserting at the head of a linked list only requires updating the head pointer - no shifting of elements is needed, making it O(1).",
        options: [
          { text: "O(n)", isCorrect: false },
          { text: "O(log n)", isCorrect: false },
          { text: "O(1)", isCorrect: true },
          { text: "O(n log n)", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "In a binary search tree, what is the time complexity of searching for an element in the average case?",
        difficulty: 3,
        marks: 2,
        explanation: "In a balanced BST, each comparison eliminates half of the remaining nodes, resulting in O(log n) average case. However, worst case (skewed tree) is O(n).",
        options: [
          { text: "O(1)", isCorrect: false },
          { text: "O(log n)", isCorrect: true },
          { text: "O(n)", isCorrect: false },
          { text: "O(n log n)", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which traversal of a binary tree visits nodes in the order: Left, Root, Right?",
        difficulty: 2,
        marks: 1,
        explanation: "Inorder traversal visits left subtree first, then the root, then the right subtree. For a BST, this produces elements in sorted order.",
        options: [
          { text: "Preorder", isCorrect: false },
          { text: "Postorder", isCorrect: false },
          { text: "Inorder", isCorrect: true },
          { text: "Level-order", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What data structure would you use to implement a browser's back button functionality?",
        difficulty: 2,
        marks: 1,
        explanation: "A stack is perfect for browser history - when you visit a new page, it's pushed onto the stack. When you click back, the current page is popped and you return to the previous one.",
        options: [
          { text: "Queue", isCorrect: false },
          { text: "Stack", isCorrect: true },
          { text: "Hash Table", isCorrect: false },
          { text: "Binary Tree", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the maximum number of children a node can have in a binary tree?",
        difficulty: 1,
        marks: 1,
        explanation: "By definition, a binary tree node can have at most two children, typically referred to as left and right children.",
        options: [
          { text: "1", isCorrect: false },
          { text: "2", isCorrect: true },
          { text: "3", isCorrect: false },
          { text: "Unlimited", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which data structure is used for implementing priority queues efficiently?",
        difficulty: 3,
        marks: 2,
        explanation: "A heap (specifically a binary heap) provides O(log n) insertion and O(log n) extraction of the min/max element, making it ideal for priority queues.",
        options: [
          { text: "Array", isCorrect: false },
          { text: "Linked List", isCorrect: false },
          { text: "Heap", isCorrect: true },
          { text: "Stack", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the space complexity of storing n elements in a hash table?",
        difficulty: 2,
        marks: 1,
        explanation: "A hash table requires O(n) space to store n elements, plus some additional space for the underlying array structure.",
        options: [
          { text: "O(1)", isCorrect: false },
          { text: "O(log n)", isCorrect: false },
          { text: "O(n)", isCorrect: true },
          { text: "O(n²)", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "In graph theory, what is the degree of a vertex?",
        difficulty: 3,
        marks: 2,
        explanation: "The degree of a vertex is the number of edges connected to it. In directed graphs, we distinguish between in-degree and out-degree.",
        options: [
          { text: "The number of edges connected to it", isCorrect: true },
          { text: "The distance from the root", isCorrect: false },
          { text: "The number of vertices in the graph", isCorrect: false },
          { text: "The weight of the heaviest edge", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which algorithm is used to find the shortest path in an unweighted graph?",
        difficulty: 4,
        marks: 2,
        explanation: "BFS explores nodes level by level, so the first time it reaches a node, it has found the shortest path (in terms of number of edges) to that node.",
        options: [
          { text: "Depth-First Search (DFS)", isCorrect: false },
          { text: "Breadth-First Search (BFS)", isCorrect: true },
          { text: "Dijkstra's Algorithm", isCorrect: false },
          { text: "Prim's Algorithm", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is a balanced binary tree?",
        difficulty: 3,
        marks: 2,
        explanation: "A balanced binary tree ensures that the height difference between left and right subtrees of any node is at most 1 (or some constant), maintaining O(log n) operations.",
        options: [
          { text: "A tree where all leaves are at the same level", isCorrect: false },
          { text: "A tree where the height difference between subtrees is bounded", isCorrect: true },
          { text: "A tree with exactly two children per node", isCorrect: false },
          { text: "A tree sorted in ascending order", isCorrect: false },
        ],
      },
    ],
  },
  {
    title: "Algorithms & Complexity",
    subject: "Computer Science",
    description: "Master sorting algorithms, searching techniques, and Big O notation",
    mode: "practice",
    passingScore: 70,
    questions: [
      {
        type: "mcq",
        question: "What is the best-case time complexity of QuickSort?",
        difficulty: 3,
        marks: 2,
        explanation: "QuickSort's best case occurs when the pivot divides the array into two equal halves each time, resulting in O(n log n) complexity.",
        options: [
          { text: "O(n)", isCorrect: false },
          { text: "O(n log n)", isCorrect: true },
          { text: "O(n²)", isCorrect: false },
          { text: "O(log n)", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which sorting algorithm has the best worst-case time complexity?",
        difficulty: 4,
        marks: 2,
        explanation: "Merge Sort guarantees O(n log n) in all cases (best, average, worst) because it always divides the array in half and merges in linear time.",
        options: [
          { text: "QuickSort", isCorrect: false },
          { text: "Merge Sort", isCorrect: true },
          { text: "Bubble Sort", isCorrect: false },
          { text: "Selection Sort", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the time complexity of binary search?",
        difficulty: 2,
        marks: 1,
        explanation: "Binary search halves the search space with each comparison, resulting in O(log n) time complexity. It requires the input to be sorted.",
        options: [
          { text: "O(n)", isCorrect: false },
          { text: "O(log n)", isCorrect: true },
          { text: "O(n log n)", isCorrect: false },
          { text: "O(1)", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which of the following represents exponential time complexity?",
        difficulty: 2,
        marks: 1,
        explanation: "O(2ⁿ) represents exponential growth where the number of operations doubles with each additional input element. This is typically seen in brute-force solutions to NP-hard problems.",
        options: [
          { text: "O(n²)", isCorrect: false },
          { text: "O(n!)", isCorrect: false },
          { text: "O(2ⁿ)", isCorrect: true },
          { text: "O(n log n)", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the space complexity of Merge Sort?",
        difficulty: 3,
        marks: 2,
        explanation: "Merge Sort requires O(n) auxiliary space for the temporary arrays used during merging. This is one of its drawbacks compared to in-place algorithms.",
        options: [
          { text: "O(1)", isCorrect: false },
          { text: "O(log n)", isCorrect: false },
          { text: "O(n)", isCorrect: true },
          { text: "O(n²)", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which algorithmic paradigm does QuickSort use?",
        difficulty: 2,
        marks: 1,
        explanation: "QuickSort uses divide and conquer - it divides the array around a pivot, recursively sorts the subarrays, and conquers by combining the results.",
        options: [
          { text: "Greedy", isCorrect: false },
          { text: "Dynamic Programming", isCorrect: false },
          { text: "Divide and Conquer", isCorrect: true },
          { text: "Backtracking", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the purpose of the Master Theorem?",
        difficulty: 4,
        marks: 2,
        explanation: "The Master Theorem provides a formulaic approach to solve recurrence relations of the form T(n) = aT(n/b) + f(n), common in divide and conquer algorithms.",
        options: [
          { text: "To prove algorithm correctness", isCorrect: false },
          { text: "To analyze recurrence relations", isCorrect: true },
          { text: "To optimize memory usage", isCorrect: false },
          { text: "To generate test cases", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which sorting algorithm is most efficient for nearly sorted data?",
        difficulty: 3,
        marks: 2,
        explanation: "Insertion Sort is highly efficient for nearly sorted data with O(n) best case, as it only needs to make minimal swaps when elements are close to their correct positions.",
        options: [
          { text: "QuickSort", isCorrect: false },
          { text: "Merge Sort", isCorrect: false },
          { text: "Insertion Sort", isCorrect: true },
          { text: "Heap Sort", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What does 'in-place' mean for a sorting algorithm?",
        difficulty: 2,
        marks: 1,
        explanation: "An in-place algorithm uses only O(1) extra space, sorting the array by swapping elements within the original array without requiring additional storage proportional to input size.",
        options: [
          { text: "It runs in constant time", isCorrect: false },
          { text: "It uses O(1) extra space", isCorrect: true },
          { text: "It doesn't modify the original array", isCorrect: false },
          { text: "It's stable", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which algorithm finds the minimum spanning tree of a weighted graph?",
        difficulty: 4,
        marks: 2,
        explanation: "Both Kruskal's and Prim's algorithms find the minimum spanning tree. Kruskal's sorts edges by weight and adds them if they don't form a cycle.",
        options: [
          { text: "Dijkstra's Algorithm", isCorrect: false },
          { text: "Kruskal's Algorithm", isCorrect: true },
          { text: "Floyd-Warshall Algorithm", isCorrect: false },
          { text: "Bellman-Ford Algorithm", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is amortized time complexity?",
        difficulty: 4,
        marks: 2,
        explanation: "Amortized analysis averages the time over a sequence of operations, showing that expensive operations are rare and the average cost per operation is low.",
        options: [
          { text: "The worst-case time divided by input size", isCorrect: false },
          { text: "The average time per operation over many operations", isCorrect: true },
          { text: "The best-case time for a single operation", isCorrect: false },
          { text: "The time complexity ignoring constants", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What problem does dynamic programming solve more efficiently than naive recursion?",
        difficulty: 3,
        marks: 2,
        explanation: "DP excels at problems with overlapping subproblems - instead of recomputing the same subproblems, it stores results for reuse (memoization or tabulation).",
        options: [
          { text: "Problems requiring backtracking", isCorrect: false },
          { text: "Problems with overlapping subproblems", isCorrect: true },
          { text: "Graph traversal problems", isCorrect: false },
          { text: "String matching problems", isCorrect: false },
        ],
      },
    ],
  },
  {
    title: "Object-Oriented Programming",
    subject: "Computer Science",
    description: "Explore classes, inheritance, polymorphism, and design patterns",
    mode: "practice",
    passingScore: 70,
    questions: [
      {
        type: "mcq",
        question: "What is encapsulation in OOP?",
        difficulty: 2,
        marks: 1,
        explanation: "Encapsulation bundles data (attributes) and methods that operate on that data within a single unit (class), hiding internal details and controlling access through interfaces.",
        options: [
          { text: "Inheriting properties from a parent class", isCorrect: false },
          { text: "Bundling data and methods that operate on that data", isCorrect: true },
          { text: "Having multiple forms of the same method", isCorrect: false },
          { text: "Creating objects from classes", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "Which keyword is used to inherit from a parent class in most OOP languages?",
        difficulty: 1,
        marks: 1,
        explanation: "The 'extends' keyword is commonly used in languages like Java, TypeScript, and JavaScript to establish inheritance between classes.",
        options: [
          { text: "implements", isCorrect: false },
          { text: "inherits", isCorrect: false },
          { text: "extends", isCorrect: true },
          { text: "super", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is polymorphism?",
        difficulty: 2,
        marks: 1,
        explanation: "Polymorphism allows objects of different classes to be treated as objects of a common parent class. The same method call can behave differently based on the actual object type.",
        options: [
          { text: "A class having multiple constructors", isCorrect: false },
          { text: "Objects of different types responding to the same method call", isCorrect: true },
          { text: "Hiding implementation details", isCorrect: false },
          { text: "Breaking a class into smaller classes", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the difference between an abstract class and an interface?",
        difficulty: 3,
        marks: 2,
        explanation: "Abstract classes can have both implemented and abstract methods, while interfaces traditionally only define method signatures. Abstract classes support single inheritance; interfaces allow multiple implementation.",
        options: [
          { text: "There is no difference", isCorrect: false },
          { text: "Abstract classes can have implemented methods; interfaces traditionally cannot", isCorrect: true },
          { text: "Interfaces can be instantiated; abstract classes cannot", isCorrect: false },
          { text: "Abstract classes don't support inheritance", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the Singleton design pattern?",
        difficulty: 3,
        marks: 2,
        explanation: "Singleton ensures a class has only one instance and provides a global access point to it. Useful for logging, configuration, or connection pools.",
        options: [
          { text: "A pattern where objects are created through a factory", isCorrect: false },
          { text: "A pattern ensuring only one instance of a class exists", isCorrect: true },
          { text: "A pattern for creating deep copies of objects", isCorrect: false },
          { text: "A pattern for composing objects into tree structures", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is method overloading?",
        difficulty: 2,
        marks: 1,
        explanation: "Method overloading allows multiple methods with the same name but different parameter lists (different number or types of parameters) in the same class.",
        options: [
          { text: "Redefining a parent class method in a child class", isCorrect: false },
          { text: "Having multiple methods with the same name but different parameters", isCorrect: true },
          { text: "Calling a method on itself", isCorrect: false },
          { text: "Making a method run faster", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What does the 'super' keyword refer to?",
        difficulty: 2,
        marks: 1,
        explanation: "The 'super' keyword refers to the parent class and is used to access parent class methods, constructors, and properties from within a child class.",
        options: [
          { text: "The current class", isCorrect: false },
          { text: "The parent class", isCorrect: true },
          { text: "A static method", isCorrect: false },
          { text: "An interface", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the purpose of the Factory design pattern?",
        difficulty: 3,
        marks: 2,
        explanation: "Factory pattern provides an interface for creating objects without specifying their concrete classes, allowing for more flexible and decoupled code.",
        options: [
          { text: "To ensure only one instance exists", isCorrect: false },
          { text: "To create objects without specifying exact class", isCorrect: true },
          { text: "To add new behavior to objects dynamically", isCorrect: false },
          { text: "To compose objects into tree structures", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is composition in OOP?",
        difficulty: 3,
        marks: 2,
        explanation: "Composition is a 'has-a' relationship where a class contains instances of other classes as its members. It's often preferred over inheritance for flexibility.",
        options: [
          { text: "A class inheriting from multiple parents", isCorrect: false },
          { text: "A class containing instances of other classes", isCorrect: true },
          { text: "Overriding parent class methods", isCorrect: false },
          { text: "Creating abstract methods", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the SOLID principle 'S' (Single Responsibility)?",
        difficulty: 4,
        marks: 2,
        explanation: "Single Responsibility Principle states that a class should have only one reason to change, meaning it should have only one job or responsibility.",
        options: [
          { text: "A class should implement only one interface", isCorrect: false },
          { text: "A class should have only one method", isCorrect: false },
          { text: "A class should have only one reason to change", isCorrect: true },
          { text: "A program should have only one class", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the Observer design pattern?",
        difficulty: 4,
        marks: 2,
        explanation: "Observer pattern defines a one-to-many dependency where when one object (subject) changes state, all its dependents (observers) are notified automatically.",
        options: [
          { text: "A pattern for creating object copies", isCorrect: false },
          { text: "A pattern where objects are notified of state changes", isCorrect: true },
          { text: "A pattern for accessing elements sequentially", isCorrect: false },
          { text: "A pattern for encapsulating requests as objects", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the difference between method overriding and overloading?",
        difficulty: 3,
        marks: 2,
        explanation: "Overriding replaces a parent method in a child class (same signature, different implementation). Overloading creates multiple methods with the same name but different parameters in the same class.",
        options: [
          { text: "They are the same thing", isCorrect: false },
          { text: "Overriding is in child classes; overloading is in the same class", isCorrect: true },
          { text: "Overloading requires inheritance; overriding doesn't", isCorrect: false },
          { text: "Overriding changes return type; overloading changes method name", isCorrect: false },
        ],
      },
    ],
  },
  {
    title: "Database Systems",
    subject: "Computer Science",
    description: "SQL queries, normalization, transactions, and database design",
    mode: "practice",
    passingScore: 70,
    questions: [
      {
        type: "mcq",
        question: "What does SQL stand for?",
        difficulty: 1,
        marks: 1,
        explanation: "SQL stands for Structured Query Language, the standard language for managing and manipulating relational databases.",
        options: [
          { text: "Structured Query Language", isCorrect: true },
          { text: "Simple Query Language", isCorrect: false },
          { text: "Standard Query Logic", isCorrect: false },
          { text: "Sequential Query Language", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is a primary key?",
        difficulty: 1,
        marks: 1,
        explanation: "A primary key is a column (or combination of columns) that uniquely identifies each row in a table. It must contain unique values and cannot be NULL.",
        options: [
          { text: "A key that unlocks the database", isCorrect: false },
          { text: "A column that uniquely identifies each row", isCorrect: true },
          { text: "The first column in a table", isCorrect: false },
          { text: "A column that references another table", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the purpose of a foreign key?",
        difficulty: 2,
        marks: 1,
        explanation: "A foreign key creates a link between two tables by referencing the primary key of another table, establishing relationships and maintaining referential integrity.",
        options: [
          { text: "To encrypt sensitive data", isCorrect: false },
          { text: "To create a relationship between tables", isCorrect: true },
          { text: "To improve query performance", isCorrect: false },
          { text: "To allow NULL values", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What does ACID stand for in database transactions?",
        difficulty: 3,
        marks: 2,
        explanation: "ACID ensures reliable transactions: Atomicity (all or nothing), Consistency (valid state), Isolation (independent transactions), Durability (permanent commits).",
        options: [
          { text: "Atomicity, Consistency, Isolation, Durability", isCorrect: true },
          { text: "Access, Control, Integrity, Data", isCorrect: false },
          { text: "Automatic, Controlled, Indexed, Distributed", isCorrect: false },
          { text: "Authentication, Compression, Indexing, Distribution", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is database normalization?",
        difficulty: 3,
        marks: 2,
        explanation: "Normalization organizes database structure to reduce redundancy and dependency by dividing tables and defining relationships. It helps maintain data integrity.",
        options: [
          { text: "Making all data uppercase", isCorrect: false },
          { text: "Organizing data to reduce redundancy", isCorrect: true },
          { text: "Encrypting the database", isCorrect: false },
          { text: "Backing up data regularly", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the difference between WHERE and HAVING clauses?",
        difficulty: 3,
        marks: 2,
        explanation: "WHERE filters rows before grouping; HAVING filters groups after aggregation. HAVING is used with GROUP BY for aggregate conditions.",
        options: [
          { text: "There is no difference", isCorrect: false },
          { text: "WHERE filters before grouping; HAVING filters after", isCorrect: true },
          { text: "WHERE is for SELECT; HAVING is for UPDATE", isCorrect: false },
          { text: "HAVING is faster than WHERE", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What type of JOIN returns all rows from both tables?",
        difficulty: 2,
        marks: 1,
        explanation: "FULL OUTER JOIN returns all rows from both tables, matching where possible and filling NULLs where there's no match in either table.",
        options: [
          { text: "INNER JOIN", isCorrect: false },
          { text: "LEFT JOIN", isCorrect: false },
          { text: "FULL OUTER JOIN", isCorrect: true },
          { text: "CROSS JOIN", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is an index in a database?",
        difficulty: 2,
        marks: 1,
        explanation: "An index is a data structure that improves query speed by providing quick lookups without scanning the entire table. It's like a book's index.",
        options: [
          { text: "A primary key constraint", isCorrect: false },
          { text: "A structure to speed up data retrieval", isCorrect: true },
          { text: "A way to encrypt columns", isCorrect: false },
          { text: "A type of backup", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is First Normal Form (1NF)?",
        difficulty: 4,
        marks: 2,
        explanation: "1NF requires that each column contains only atomic (indivisible) values, and each row is unique. No repeating groups or arrays in a single column.",
        options: [
          { text: "No duplicate rows exist", isCorrect: false },
          { text: "Each column contains atomic values only", isCorrect: true },
          { text: "All columns depend on the primary key", isCorrect: false },
          { text: "No transitive dependencies exist", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is a deadlock in databases?",
        difficulty: 4,
        marks: 2,
        explanation: "A deadlock occurs when two or more transactions are waiting for each other to release locks, creating a cycle where none can proceed.",
        options: [
          { text: "When a query takes too long", isCorrect: false },
          { text: "When the database runs out of memory", isCorrect: false },
          { text: "When transactions wait for each other indefinitely", isCorrect: true },
          { text: "When data becomes corrupted", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the difference between DELETE and TRUNCATE?",
        difficulty: 3,
        marks: 2,
        explanation: "DELETE removes rows one by one, can have WHERE clause, and is logged (can be rolled back). TRUNCATE removes all rows quickly, cannot have WHERE, and is minimally logged.",
        options: [
          { text: "They are identical", isCorrect: false },
          { text: "DELETE is row-by-row; TRUNCATE removes all rows at once", isCorrect: true },
          { text: "TRUNCATE can use WHERE clause; DELETE cannot", isCorrect: false },
          { text: "DELETE is faster than TRUNCATE", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is a stored procedure?",
        difficulty: 3,
        marks: 2,
        explanation: "A stored procedure is a prepared SQL code that you save and can reuse. It can accept parameters, perform operations, and return results.",
        options: [
          { text: "A backup of the database", isCorrect: false },
          { text: "A saved, reusable set of SQL statements", isCorrect: true },
          { text: "A type of index", isCorrect: false },
          { text: "A constraint on a table", isCorrect: false },
        ],
      },
    ],
  },
  {
    title: "Web Development Fundamentals",
    subject: "Computer Science",
    description: "HTML, CSS, JavaScript, HTTP, and modern web architecture",
    mode: "practice",
    passingScore: 70,
    questions: [
      {
        type: "mcq",
        question: "What does HTTP stand for?",
        difficulty: 1,
        marks: 1,
        explanation: "HTTP (HyperText Transfer Protocol) is the foundation of data communication on the web, defining how messages are formatted and transmitted.",
        options: [
          { text: "HyperText Transfer Protocol", isCorrect: true },
          { text: "High Tech Transfer Protocol", isCorrect: false },
          { text: "HyperText Transport Protocol", isCorrect: false },
          { text: "Home Tool Transfer Protocol", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the purpose of CSS?",
        difficulty: 1,
        marks: 1,
        explanation: "CSS (Cascading Style Sheets) controls the presentation and layout of HTML documents, including colors, fonts, spacing, and responsive design.",
        options: [
          { text: "To structure web content", isCorrect: false },
          { text: "To add interactivity", isCorrect: false },
          { text: "To style and layout web pages", isCorrect: true },
          { text: "To store data", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the DOM?",
        difficulty: 2,
        marks: 1,
        explanation: "The Document Object Model is a programming interface for web documents. It represents the page as a tree of objects that can be manipulated with JavaScript.",
        options: [
          { text: "A database management system", isCorrect: false },
          { text: "A programming interface for web documents", isCorrect: true },
          { text: "A CSS framework", isCorrect: false },
          { text: "A server-side language", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What HTTP status code indicates 'Not Found'?",
        difficulty: 2,
        marks: 1,
        explanation: "HTTP 404 indicates that the server cannot find the requested resource. It's one of the most recognized HTTP error codes.",
        options: [
          { text: "200", isCorrect: false },
          { text: "301", isCorrect: false },
          { text: "404", isCorrect: true },
          { text: "500", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the difference between let, const, and var in JavaScript?",
        difficulty: 3,
        marks: 2,
        explanation: "var is function-scoped and hoisted; let is block-scoped and not hoisted; const is block-scoped and cannot be reassigned after initialization.",
        options: [
          { text: "They are all identical", isCorrect: false },
          { text: "var is function-scoped; let and const are block-scoped", isCorrect: true },
          { text: "const can be reassigned; let cannot", isCorrect: false },
          { text: "let is the oldest keyword", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is CORS?",
        difficulty: 3,
        marks: 2,
        explanation: "Cross-Origin Resource Sharing is a security feature that controls how web pages in one domain can request resources from another domain.",
        options: [
          { text: "A JavaScript library", isCorrect: false },
          { text: "A mechanism for cross-domain requests", isCorrect: true },
          { text: "A CSS property", isCorrect: false },
          { text: "A database query language", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the purpose of the <head> element in HTML?",
        difficulty: 2,
        marks: 1,
        explanation: "The <head> element contains meta-information about the document, including title, styles, scripts, and metadata - not visible content.",
        options: [
          { text: "To display the main content", isCorrect: false },
          { text: "To contain meta-information and resources", isCorrect: true },
          { text: "To create a header section", isCorrect: false },
          { text: "To define navigation links", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is a REST API?",
        difficulty: 3,
        marks: 2,
        explanation: "REST (Representational State Transfer) is an architectural style for APIs using standard HTTP methods (GET, POST, PUT, DELETE) and stateless communication.",
        options: [
          { text: "A database management system", isCorrect: false },
          { text: "An architectural style for web services", isCorrect: true },
          { text: "A JavaScript framework", isCorrect: false },
          { text: "A CSS preprocessor", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the purpose of async/await in JavaScript?",
        difficulty: 3,
        marks: 2,
        explanation: "async/await provides a cleaner syntax for working with Promises, making asynchronous code look and behave more like synchronous code.",
        options: [
          { text: "To make code run faster", isCorrect: false },
          { text: "To handle asynchronous operations more cleanly", isCorrect: true },
          { text: "To create animations", isCorrect: false },
          { text: "To style elements", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the box model in CSS?",
        difficulty: 2,
        marks: 1,
        explanation: "The CSS box model describes how elements are rendered: content area, padding (inside), border, and margin (outside). Understanding it is crucial for layout.",
        options: [
          { text: "A container component", isCorrect: false },
          { text: "A way elements are structured with content, padding, border, and margin", isCorrect: true },
          { text: "A JavaScript design pattern", isCorrect: false },
          { text: "A database schema", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the difference between localStorage and sessionStorage?",
        difficulty: 3,
        marks: 2,
        explanation: "localStorage persists until explicitly cleared (survives browser close). sessionStorage is cleared when the tab/window closes. Both store key-value pairs.",
        options: [
          { text: "They are identical", isCorrect: false },
          { text: "localStorage persists; sessionStorage clears on tab close", isCorrect: true },
          { text: "sessionStorage has more capacity", isCorrect: false },
          { text: "localStorage can only store numbers", isCorrect: false },
        ],
      },
      {
        type: "mcq",
        question: "What is the purpose of a Content Delivery Network (CDN)?",
        difficulty: 4,
        marks: 2,
        explanation: "CDNs distribute content across multiple geographic locations to reduce latency, improve load times, and handle traffic spikes by serving content from the nearest server.",
        options: [
          { text: "To create web content", isCorrect: false },
          { text: "To distribute content geographically for faster delivery", isCorrect: true },
          { text: "To secure databases", isCorrect: false },
          { text: "To compress files", isCorrect: false },
        ],
      },
    ],
  },
];

export async function seedQuizzes(userId: string) {
  console.log("Starting quiz seed for user:", userId);
  const createdQuizzes = [];

  for (const quizData of sampleQuizzes) {
    try {
      const [quiz] = await db
        .insert(quizzes)
        .values({
          userId,
          title: quizData.title,
          subject: quizData.subject,
          description: quizData.description,
          mode: quizData.mode,
          passingScore: quizData.passingScore,
          isPublished: true,
        })
        .returning();

      console.log(`Created quiz: ${quiz.title} (${quiz.id})`);

      for (let i = 0; i < quizData.questions.length; i++) {
        const questionData = quizData.questions[i];
        const [question] = await db
          .insert(quizQuestions)
          .values({
            quizId: quiz.id,
            type: questionData.type,
            question: questionData.question,
            difficulty: questionData.difficulty,
            marks: questionData.marks,
            explanation: questionData.explanation,
            order: i + 1,
            tags: [quizData.subject || "General"],
          })
          .returning();

        if (questionData.options) {
          for (let j = 0; j < questionData.options.length; j++) {
            const optionData = questionData.options[j];
            await db.insert(quizOptions).values({
              questionId: question.id,
              text: optionData.text,
              isCorrect: optionData.isCorrect,
              order: j + 1,
            });
          }
        }
      }

      createdQuizzes.push(quiz);
    } catch (error) {
      console.error(`Failed to create quiz ${quizData.title}:`, error);
    }
  }

  console.log(`Seed complete. Created ${createdQuizzes.length} quizzes.`);
  return createdQuizzes;
}

export async function runSeed() {
  const [user] = await db.select().from(users).limit(1);
  
  if (!user) {
    console.error("No users found. Please create a user first by logging in.");
    return;
  }

  await seedQuizzes(user.id);
}
