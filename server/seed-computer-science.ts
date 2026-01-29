import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedComputerScienceData(userId: string) {
  try {
    // Try to ensure demo user exists, but don't fail if DB connection fails
    try {
      const existingUser = await db.select().from(users).where(eq(users.id, userId));
      if (existingUser.length === 0) {
        // Create a demo user if it doesn't exist
        await db.insert(users).values({
          id: userId,
          email: "demo@studymate.local",
          firstName: "Demo",
          lastName: "User",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (userError) {
      console.log("Error creating demo user:", userError);
      return true; // Don't fail the startup
    }

    // Computer Science Decks
    const csDecks = [
      {
        title: "Data Structures & Algorithms Fundamentals",
        subject: "Computer Science",
        description: "Core concepts of arrays, linked lists, stacks, and queues",
        userId,
      },
      {
        title: "Object-Oriented Programming",
        subject: "Computer Science",
        description: "Classes, inheritance, polymorphism, and design patterns",
        userId,
      },
      {
        title: "Database Management Systems",
        subject: "Computer Science",
        description: "SQL, normalization, transactions, and indexing",
        userId,
      },
      {
        title: "Web Development Essentials",
        subject: "Computer Science",
        description: "HTML, CSS, JavaScript, and frontend frameworks",
        userId,
      },
      {
        title: "Operating Systems",
        subject: "Computer Science",
        description: "Processes, threads, memory management, and scheduling",
        userId,
      },
    ];

    // Computer Science Notes
    const csNotes = [
      {
        title: "Array Operations & Complexity",
        subject: "Data Structures",
        userId,
      },
      {
        title: "SOLID Principles",
        subject: "OOP Design",
        userId,
      },
      {
        title: "SQL Joins Explained",
        subject: "Databases",
        userId,
      },
      {
        title: "React Hooks Guide",
        subject: "Web Development",
        userId,
      },
      {
        title: "Process Scheduling Algorithms",
        subject: "Operating Systems",
        userId,
      },
    ];

    // Create decks and get their IDs
    const createdDecks: any[] = [];
    for (const deck of csDecks) {
      try {
        const created = await storage.createDeck(deck);
        createdDecks.push(created);
      } catch (err) {
        console.log(`Deck may already exist or error creating: ${err}`);
      }
    }

    // Create notes
    for (const note of csNotes) {
      try {
        await storage.createNote(note);
      } catch (err) {
        console.log(`Note may already exist or error creating: ${err}`);
      }
    }

    // Flashcards - use first created deck ID or default
    const defaultDeckId = createdDecks[0]?.id || "deck-dsa-1";
    const flashcards = [
      {
        deckId: defaultDeckId,
        front: "What is the time complexity of binary search?",
        back: "O(log n) - because we halve the search space with each comparison",
      },
      {
        deckId: defaultDeckId,
        front: "Explain what a hash table is",
        back: "A data structure that implements an associative array - a structure that maps keys to values using a hash function",
      },
      {
        deckId: createdDecks[1]?.id || "deck-oop-1",
        front: "What is polymorphism?",
        back: "The ability of objects to take multiple forms. Allows you to write code that can work with objects of multiple types",
      },
      {
        deckId: createdDecks[1]?.id || "deck-oop-1",
        front: "Define inheritance",
        back: "A mechanism where a new class (derived) inherits properties and methods from an existing class (base)",
      },
      {
        deckId: createdDecks[2]?.id || "deck-db-1",
        front: "What is database normalization?",
        back: "A process to organize data to minimize redundancy and improve data integrity. Includes normal forms: 1NF, 2NF, 3NF, BCNF",
      },
      {
        deckId: createdDecks[2]?.id || "deck-db-1",
        front: "Explain ACID properties",
        back: "Atomicity (all or nothing), Consistency (valid state), Isolation (concurrent), Durability (persistent)",
      },
      {
        deckId: createdDecks[3]?.id || "deck-web-1",
        front: "What is the difference between let and const?",
        back: "let: block-scoped, can be reassigned. const: block-scoped, cannot be reassigned (but object properties can be modified)",
      },
      {
        deckId: createdDecks[3]?.id || "deck-web-1",
        front: "What is event bubbling?",
        back: "Process where an event propagates from the target element up to its ancestors in the DOM tree",
      },
      {
        deckId: createdDecks[4]?.id || "deck-os-1",
        front: "What is a context switch?",
        back: "The process of saving the state of one process and loading the state of another process to run on CPU",
      },
      {
        deckId: createdDecks[4]?.id || "deck-os-1",
        front: "Explain deadlock",
        back: "A situation where processes are blocked waiting for resources held by each other, forming a circular wait",
      },
    ];

    for (const card of flashcards) {
      try {
        await storage.createCard(card);
      } catch (err) {
        console.log(`Card may already exist or error creating: ${err}`);
      }
    }

    console.log("✅ Computer Science sample data seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding data:", error);
    return false;
  }
}

