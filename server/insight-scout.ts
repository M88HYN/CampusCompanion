import type { Express, Request, Response } from "express";
import { z } from "zod";

// Only import OpenAI if we have a real key
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
const hasRealApiKey = apiKey.length > 20 && !apiKey.includes("test") && !apiKey.includes("dummy");

let openaiClient: any = null;
let openaiInitialized = false;

async function getOpenAI() {
  if (openaiInitialized) return openaiClient;
  openaiInitialized = true;
  if (hasRealApiKey) {
    try {
      const OpenAI = (await import("openai")).default;
      openaiClient = new OpenAI({
        apiKey,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      console.log("[Insight Scout] OpenAI client initialized");
    } catch (e) {
      console.warn("[Insight Scout] OpenAI module not available, using mock responses");
    }
  } else {
    console.log("[Insight Scout] No valid OpenAI API key found, using mock responses");
  }
  return openaiClient;
}

const researchQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  searchDepth: z.enum(["quick", "balanced", "comprehensive"]).default("balanced"),
  responseType: z.enum(["explanation", "summary", "comparison", "analysis", "examples", "study_tips", "mistakes"]).default("explanation"),
  studyIntent: z.enum(["exam_prep", "deep_understanding", "assignment_writing", "revision_recall", "quick_clarification"]).default("deep_understanding"),
  conversationId: z.string().nullable().optional(),
});

// ─── Topic Knowledge Base ─────────────────────────────────────────────────
// Pre-built knowledge entries keyed by topic keywords for genuinely different responses
interface TopicKnowledge {
  definition: string;
  keyInsight: string;
  howItWorks: string[];
  principles: string[];
  examples: { context: string; detail: string }[];
  mistakes: { error: string; explanation: string }[];
  examTips: string[];
  relatedConcepts: string[];
  analogies: string[];
}

const TOPIC_DB: Record<string, TopicKnowledge> = {
  photosynthesis: {
    definition: "Photosynthesis is the biochemical process by which chloroplasts in plant cells convert light energy, water (H₂O), and carbon dioxide (CO₂) into glucose (C₆H₁₂O₆) and oxygen (O₂).",
    keyInsight: "Photosynthesis is the engine of life on Earth — it converts solar energy into chemical energy stored in glucose, forming the base of virtually every food chain.",
    howItWorks: [
      "Light-dependent reactions occur in the thylakoid membranes. Chlorophyll absorbs photons, exciting electrons that pass through Photosystem II (PSII) and Photosystem I (PSI) via the electron transport chain (ETC).",
      "Water molecules are split (photolysis) at PSII, releasing O₂ as a byproduct and providing replacement electrons.",
      "The ETC generates a proton gradient across the thylakoid membrane, driving ATP synthase to produce ATP (chemiosmosis).",
      "NADP⁺ is reduced to NADPH at PSI by accepting electrons from ferredoxin.",
      "Light-independent reactions (Calvin Cycle) occur in the stroma. CO₂ is fixed by RuBisCO onto RuBP (5C) to form two molecules of G3P (3C), which are then reduced using ATP and NADPH to regenerate RuBP and produce glucose.",
    ],
    principles: [
      "The overall equation: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
      "Light reactions produce ATP and NADPH (energy carriers); the Calvin cycle uses them to fix carbon",
      "Chlorophyll a absorbs red (680nm) and blue (440nm) light most efficiently; it reflects green light",
      "Rate is affected by three limiting factors: light intensity, CO₂ concentration, and temperature",
    ],
    examples: [
      { context: "Agricultural Science", detail: "Greenhouses optimise photosynthesis by controlling light, CO₂ levels, and temperature. Farmers use supplemental lighting at 680nm wavelength and CO₂ enrichment (up to 1000ppm) to maximise crop yield." },
      { context: "Climate Science", detail: "Deforestation reduces global photosynthetic capacity, lowering CO₂ absorption. The Amazon rainforest alone accounts for ~6% of global O₂ production through photosynthesis." },
      { context: "Biotechnology", detail: "Artificial photosynthesis research aims to replicate the process in synthetic systems to produce clean hydrogen fuel, inspired by the water-splitting reaction in PSII." },
    ],
    mistakes: [
      { error: "Confusing respiration with photosynthesis", explanation: "Respiration (C₆H₁₂O₆ + O₂ → CO₂ + H₂O + ATP) is the reverse relationship. Plants do BOTH — photosynthesis during the day and respiration 24/7." },
      { error: "Thinking plants only photosynthesise", explanation: "Plants also respire continuously. Net gas exchange depends on light intensity — at the compensation point, photosynthesis rate equals respiration rate." },
      { error: "Saying sunlight is 'used up'", explanation: "Light energy is converted (transduced) into chemical energy, not consumed. Energy is conserved per the first law of thermodynamics." },
    ],
    examTips: [
      "Know the exact locations: thylakoid membranes (light reactions) vs. stroma (Calvin cycle)",
      "Be precise about products: light reactions → ATP + NADPH + O₂; Calvin cycle → G3P → glucose",
      "Graph interpretation: sketch and label limiting factor graphs (light intensity, CO₂, temperature plateaus)",
    ],
    relatedConcepts: ["cellular respiration", "chemiosmosis", "carbon cycle", "chloroplast structure", "limiting factors"],
    analogies: ["a solar-powered sugar factory", "a two-stage assembly line where Stage 1 (light reactions) makes the tools and Stage 2 (Calvin cycle) builds the product"],
  },

  "machine learning": {
    definition: "Machine Learning (ML) is a subset of artificial intelligence where algorithms learn patterns from data to make predictions or decisions without being explicitly programmed for each case.",
    keyInsight: "Machine learning fundamentally shifts programming from 'writing rules' to 'learning rules from data' — instead of coding if-else logic, you feed examples and the algorithm discovers the patterns itself.",
    howItWorks: [
      "Data Collection: Gather labelled (supervised) or unlabelled (unsupervised) training data that represents the problem domain.",
      "Feature Engineering: Select or transform input variables (features) that are most relevant to the prediction task.",
      "Model Training: The algorithm iteratively adjusts internal parameters (weights) to minimise a loss function — the gap between predicted and actual outputs.",
      "Validation: Evaluate model performance on held-out data (test set) using metrics like accuracy, precision, recall, or F1-score to detect overfitting.",
      "Deployment: The trained model is deployed to make predictions on new, unseen data in production environments.",
    ],
    principles: [
      "Supervised learning uses labelled data (input→output pairs) — e.g., classification (spam/not spam), regression (house prices)",
      "Unsupervised learning finds hidden structure in unlabelled data — e.g., clustering (customer segments), dimensionality reduction (PCA)",
      "The bias-variance tradeoff: too simple = underfitting (high bias); too complex = overfitting (high variance)",
      "Gradient descent optimises model parameters by iteratively moving in the direction that reduces the loss function",
    ],
    examples: [
      { context: "Healthcare", detail: "ML models analyse medical images (X-rays, MRIs) to detect tumours with accuracy rivalling radiologists. CNNs trained on millions of labelled scans can identify cancerous lesions in milliseconds." },
      { context: "Finance", detail: "Banks use ML for fraud detection — models learn normal transaction patterns and flag anomalies. Random Forests and neural networks process millions of transactions in real-time." },
      { context: "Natural Language Processing", detail: "Large Language Models (LLMs) like GPT use transformer architecture and self-attention mechanisms trained on billions of tokens to generate human-like text." },
    ],
    mistakes: [
      { error: "More data always = better model", explanation: "Quality matters more than quantity. Biased, noisy, or unrepresentative data leads to biased models regardless of volume. Garbage in = garbage out." },
      { error: "Confusing correlation with causation", explanation: "ML models find correlations in data. Just because a model predicts well doesn't mean the features it uses are causal — spurious correlations are common." },
      { error: "Ignoring overfitting", explanation: "A model with 99% training accuracy but 60% test accuracy has memorised the training data instead of learning generalisable patterns. Always validate on unseen data." },
    ],
    examTips: [
      "Know the difference between supervised, unsupervised, and reinforcement learning with concrete examples of each",
      "Be able to explain the bias-variance tradeoff with a diagram showing underfitting vs overfitting curves",
      "Understand evaluation metrics: when to use accuracy vs precision vs recall (hint: class-imbalanced datasets)",
    ],
    relatedConcepts: ["deep learning", "neural networks", "gradient descent", "cross-validation", "feature engineering"],
    analogies: ["teaching by example rather than by instruction", "like a student learning from past exam papers instead of memorising a textbook"],
  },

  "data structures": {
    definition: "Data structures are specialised formats for organising, storing, and accessing data efficiently. Each structure offers different time/space complexity tradeoffs for operations like insertion, deletion, and search.",
    keyInsight: "Choosing the right data structure is often more impactful than optimising the algorithm — an O(1) hash table lookup vs O(n) linear search can mean the difference between milliseconds and minutes at scale.",
    howItWorks: [
      "Arrays store elements contiguously in memory, enabling O(1) random access via index arithmetic but O(n) insertion/deletion due to shifting.",
      "Linked Lists store elements as nodes with pointers, enabling O(1) insertion/deletion at known positions but O(n) access since traversal is required.",
      "Hash Tables map keys to indices using a hash function. Average O(1) for insert/search/delete, but O(n) worst-case if many collisions occur.",
      "Trees (BST, AVL, Red-Black) organise data hierarchically. Balanced BSTs achieve O(log n) for search/insert/delete by maintaining height balance.",
      "Graphs represent relationships between entities using vertices and edges. BFS (queue) and DFS (stack) traverse graphs in O(V+E) time.",
    ],
    principles: [
      "Big-O notation measures worst-case time/space complexity: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)",
      "Arrays excel at random access; linked lists excel at dynamic insertion/deletion",
      "Stacks (LIFO) and Queues (FIFO) are abstract data types implemented using arrays or linked lists",
      "Trees and graphs model hierarchical and networked relationships respectively",
    ],
    examples: [
      { context: "Web Development", detail: "The browser's DOM is a tree data structure. Each HTML element is a node with parent-child relationships, enabling efficient traversal and manipulation via tree algorithms." },
      { context: "Databases", detail: "Database indexes use B-Trees (balanced, multi-way trees) to enable O(log n) query performance on millions of rows instead of O(n) full table scans." },
      { context: "Social Networks", detail: "Social graphs represent users as vertices and friendships as edges. Finding mutual friends = graph intersection; 'People You May Know' = BFS to depth 2-3." },
    ],
    mistakes: [
      { error: "Using arrays for everything", explanation: "Arrays have O(n) insertion/deletion. If your program frequently inserts/removes elements, a linked list or hash set is significantly faster." },
      { error: "Ignoring space complexity", explanation: "Hash tables trade space for time. A hash table with 1M entries and 0.5 load factor wastes 50% of allocated memory. Consider this for memory-constrained systems." },
      { error: "Not considering amortised complexity", explanation: "Dynamic arrays (ArrayList, Python list) have O(n) worst-case append when resizing, but O(1) amortised because resizing happens infrequently." },
    ],
    examTips: [
      "Be able to sketch each data structure and label its key operations with Big-O complexities",
      "Comparison questions are common: 'Compare arrays vs linked lists for [scenario]' — always frame around operation complexity",
      "For graph questions, know when to use BFS (shortest unweighted path) vs DFS (cycle detection, topological sort)",
    ],
    relatedConcepts: ["algorithms", "time complexity", "space complexity", "hash functions", "binary search"],
    analogies: ["a toolbox — each tool (structure) is best suited for a specific job", "a library's catalogue system — different indexing methods help you find different types of books faster"],
  },

  "quantum computing": {
    definition: "Quantum computing leverages quantum mechanical phenomena — superposition, entanglement, and interference — to process information using qubits, enabling certain computations to run exponentially faster than classical computers.",
    keyInsight: "Quantum computers aren't just faster classical computers — they solve problems *differently* by exploiting quantum parallelism, where a qubit can exist in a superposition of 0 AND 1 simultaneously.",
    howItWorks: [
      "Qubits: Unlike classical bits (0 or 1), qubits exist in superposition — a probabilistic combination of |0⟩ and |1⟩ states described by α|0⟩ + β|1⟩ where |α|² + |β|² = 1.",
      "Quantum Gates: Single-qubit gates (Hadamard, Pauli-X) and multi-qubit gates (CNOT) manipulate qubit states. These are reversible unitary transformations.",
      "Entanglement: When qubits are entangled, measuring one instantly determines the state of the other, regardless of distance. This enables correlated quantum operations.",
      "Measurement: Reading a qubit collapses its superposition to either |0⟩ or |1⟩ with probabilities determined by the amplitudes α and β. Algorithms are designed so correct answers have high probability.",
      "Quantum algorithms are designed to create constructive interference for correct answers and destructive interference for wrong ones.",
    ],
    principles: [
      "Superposition: n qubits can represent 2ⁿ states simultaneously, enabling quantum parallelism",
      "Entanglement: Correlations between qubits that cannot be described independently — Einstein's 'spooky action at a distance'",
      "Decoherence: Qubits are extremely fragile — interaction with the environment collapses quantum states, limiting computation time",
      "Quantum supremacy: Solving a problem faster than any classical computer (Google's Sycamore, 2019: 200 seconds vs. estimated 10,000 years classically)",
    ],
    examples: [
      { context: "Cryptography", detail: "Shor's algorithm can factor large integers in polynomial time, breaking RSA encryption. A 4096-qubit quantum computer could crack 2048-bit RSA keys that classical computers couldn't break in billions of years." },
      { context: "Drug Discovery", detail: "Quantum simulation can model molecular interactions at the quantum level. Simulating a caffeine molecule's properties requires ~160 qubits — impossible for classical computers but feasible for quantum ones." },
      { context: "Optimisation", detail: "Grover's algorithm searches unsorted databases in O(√n) vs classical O(n), and quantum annealing solves combinatorial optimisation problems like route planning for logistics." },
    ],
    mistakes: [
      { error: "Thinking quantum computers do everything faster", explanation: "Quantum advantage only applies to specific problem classes (factoring, simulation, optimisation). For everyday tasks like word processing, classical computers are still superior." },
      { error: "Confusing superposition with trying all answers at once", explanation: "Superposition isn't brute force. Algorithms must be carefully designed to amplify correct answers through interference patterns. Simply being 'in all states' doesn't help without proper algorithm design." },
      { error: "Ignoring decoherence", explanation: "Current qubits lose their quantum state in microseconds. Error correction requires ~1000+ physical qubits per logical qubit, which is why today's quantum computers have limited practical use." },
    ],
    examTips: [
      "Distinguish clearly between qubits and classical bits using Dirac notation (|0⟩, |1⟩)",
      "Know at least two quantum algorithms (Shor's, Grover's) and their speedups over classical equivalents",
      "Be prepared to discuss limitations: decoherence, error rates, scalability challenges",
    ],
    relatedConcepts: ["quantum mechanics", "linear algebra", "cryptography", "Shor's algorithm", "Grover's algorithm"],
    analogies: ["a coin spinning in the air (superposition) vs landed heads/tails (measurement)", "choosing multiple maze paths simultaneously instead of one at a time"],
  },

  "natural selection": {
    definition: "Natural selection is the evolutionary mechanism by which individuals with heritable traits better suited to their environment tend to survive and reproduce more, passing those advantageous traits to the next generation.",
    keyInsight: "Natural selection doesn't 'design' organisms — it's a filter. Individuals with traits that happen to improve survival and reproduction in their current environment leave more offspring, gradually shifting population characteristics over generations.",
    howItWorks: [
      "Variation: Individuals within a population show heritable variation in traits due to genetic mutation, recombination during meiosis, and random fertilisation.",
      "Competition: Resources (food, mates, territory) are limited, creating a struggle for survival. Not all individuals will reproduce successfully.",
      "Differential Survival: Individuals with traits better adapted to the environment are more likely to survive to reproductive age (survival of the fittest, where 'fitness' = reproductive success).",
      "Inheritance: Advantageous alleles are passed to offspring, increasing their frequency in the gene pool over successive generations.",
      "Adaptation: Over many generations, accumulated favourable traits produce populations well-suited to their environment — this is adaptation.",
    ],
    principles: [
      "Selection acts on phenotypes (observable traits), not directly on genotypes (genetic code)",
      "Three types: directional (favours one extreme), stabilising (favours average), disruptive (favours both extremes)",
      "Natural selection requires: variation, heritability, differential fitness, and time",
      "It does not produce perfection — it produces 'good enough' given current conditions",
    ],
    examples: [
      { context: "Antibiotic Resistance", detail: "Bacteria with random mutations conferring antibiotic resistance survive treatment, reproduce, and pass resistance genes to offspring. MRSA evolved through exactly this process — demonstrating natural selection in real-time." },
      { context: "Darwin's Finches", detail: "On the Galápagos Islands, finch beak shapes evolved to match food sources: thick beaks for cracking seeds, thin beaks for probing insects. During the 1977 drought, only thick-beaked finches survived limited hard seeds." },
      { context: "Industrial Melanism", detail: "During the Industrial Revolution, dark-coloured peppered moths (melanistic form) became dominant in polluted cities because they were camouflaged on soot-covered trees, avoiding bird predation." },
    ],
    mistakes: [
      { error: "Saying organisms 'adapt to' or 'choose to evolve'", explanation: "Evolution has no direction or intent. Individuals don't choose to change. Random mutations occur; those that are advantageous are selected for by the environment." },
      { error: "Confusing natural selection with evolution", explanation: "Natural selection is one *mechanism* of evolution, alongside genetic drift, gene flow, and mutation. Evolution is the overall change in allele frequencies in a population." },
      { error: "Thinking 'survival of the fittest' means strongest", explanation: "'Fitness' in biology means reproductive success — passing on genes. A small, well-camouflaged organism is 'fitter' than a large, conspicuous one if it produces more surviving offspring." },
    ],
    examTips: [
      "Always use precise terms: 'allele frequency', 'selective pressure', 'reproductive success' — not 'survival of the fittest' without definition",
      "For essay questions, walk through the 4 conditions (variation, heritability, competition, differential reproduction) with a specific example",
      "Distinguish between the 3 types of selection and sketch graphs showing how trait distribution shifts",
    ],
    relatedConcepts: ["genetic drift", "speciation", "gene pool", "allele frequency", "adaptation"],
    analogies: ["a sieve that passes only certain shapes through — the environment is the sieve and traits are the shapes", "pesticide spraying a field — only resistant bugs survive to breed, so the population shifts"],
  },

  "supply and demand": {
    definition: "Supply and demand is the economic model explaining how prices are determined in a market: price rises when demand exceeds supply, and falls when supply exceeds demand, tending toward an equilibrium where quantity supplied equals quantity demanded.",
    keyInsight: "Every market price is a signal carrying information — it tells producers how much to make and consumers how much to buy, coordinating millions of independent decisions without any central planner.",
    howItWorks: [
      "Demand Curve: Shows the inverse relationship between price and quantity demanded (Law of Demand). As price ↑, Qd ↓ because consumers seek cheaper substitutes or buy less.",
      "Supply Curve: Shows the direct relationship between price and quantity supplied (Law of Supply). As price ↑, Qs ↑ because higher prices incentivise more production.",
      "Equilibrium: Where supply and demand curves intersect. At this price (P*), quantity supplied = quantity demanded (Q*). No shortage or surplus exists.",
      "Surplus: When price > P*, Qs > Qd — excess supply pushes price down as sellers compete for fewer buyers.",
      "Shortage: When price < P*, Qd > Qs — excess demand pushes price up as buyers compete for limited goods.",
    ],
    principles: [
      "Ceteris paribus ('all else equal') — supply/demand analysis holds other factors constant to isolate price effects",
      "Shift vs movement: a change in price causes *movement along* the curve; a change in external factors (income, technology) *shifts* the entire curve",
      "Price elasticity of demand (PED) = %ΔQd / %ΔP — measures how responsive demand is to price changes",
      "Market failure occurs when free markets fail to allocate resources efficiently (externalities, public goods, monopolies)",
    ],
    examples: [
      { context: "Technology Market", detail: "When Apple releases a new iPhone, demand surges (demand curve shifts right), causing temporary shortages and premium pricing. As competitors release alternatives, demand for the specific model decreases, reducing its price." },
      { context: "Labour Market", detail: "Software engineers command high salaries because demand for their skills (from tech companies) far exceeds supply (qualified graduates). Wages are the 'price' of labour in this market." },
      { context: "Housing Crisis", detail: "In cities like London and San Francisco, housing supply is constrained (planning regulations, limited land) while demand grows (population inflow, job growth), driving prices consistently upward." },
    ],
    mistakes: [
      { error: "Confusing a shift with a movement", explanation: "Price changes cause movement *along* a curve. External factors (income, tastes, technology) cause the entire curve to *shift*. This distinction is critical for diagram-based exam questions." },
      { error: "Forgetting ceteris paribus", explanation: "Supply/demand analysis assumes all other variables are held constant. Ignoring this leads to false conclusions — e.g., saying 'price increased so demand must have decreased' ignores that income may have also risen." },
      { error: "Treating supply and demand as fixed", explanation: "Both curves constantly shift due to changing consumer preferences, technology, government policy, and global events. Equilibrium is a moving target, not a permanent state." },
    ],
    examTips: [
      "ALWAYS draw a diagram. Label axes (Price on Y, Quantity on X), label curves (D, S), and clearly mark equilibrium (P*, Q*)",
      "For 'explain' questions: State the shift → show new equilibrium → describe the price/quantity impact → state the economic reasoning",
      "Know elasticity: PED > 1 = elastic (luxury goods); PED < 1 = inelastic (necessities like petrol, medicine)",
    ],
    relatedConcepts: ["elasticity", "market equilibrium", "market failure", "price mechanism", "consumer surplus"],
    analogies: ["an auction where the price settles at the level where the number of buyers matches the number of sellers", "a thermostat — price adjusts automatically to balance supply with demand, like temperature adjusts to the set point"],
  },

  calculus: {
    definition: "Calculus is the mathematical study of continuous change, built on two foundational operations: differentiation (finding rates of change / slopes) and integration (finding accumulated quantities / areas under curves).",
    keyInsight: "Differentiation and integration are inverse operations linked by the Fundamental Theorem of Calculus — differentiation breaks things into infinitesimal pieces, integration reassembles them.",
    howItWorks: [
      "Limits: The foundation. A limit describes the value a function approaches as the input approaches some value. f'(x) = lim(h→0) [f(x+h) - f(x)] / h.",
      "Differentiation: Finding the derivative — the instantaneous rate of change. For f(x) = xⁿ, the power rule gives f'(x) = nxⁿ⁻¹. The derivative at a point equals the slope of the tangent line.",
      "Integration: The reverse of differentiation. ∫xⁿ dx = xⁿ⁺¹/(n+1) + C. Definite integrals ∫[a,b] f(x)dx compute the net signed area between the curve and the x-axis.",
      "The Fundamental Theorem of Calculus: If F'(x) = f(x), then ∫[a,b] f(x)dx = F(b) - F(a). This links the two halves of calculus.",
      "Applications: Derivatives model velocity (from position), acceleration (from velocity). Integrals model displacement (from velocity), work (from force).",
    ],
    principles: [
      "Power Rule: d/dx[xⁿ] = nxⁿ⁻¹ — the most fundamental differentiation rule",
      "Chain Rule: d/dx[f(g(x))] = f'(g(x)) · g'(x) — for composite functions",
      "Product Rule: d/dx[f·g] = f'g + fg' — for products of two functions",
      "Integration by parts: ∫u dv = uv - ∫v du — derived from the product rule",
    ],
    examples: [
      { context: "Physics — Motion", detail: "If position s(t) = 4t³ - 2t, then velocity v(t) = s'(t) = 12t² - 2 and acceleration a(t) = v'(t) = 24t. Integration reverses this: ∫v(t)dt gives position + constant." },
      { context: "Engineering — Optimisation", detail: "To find the dimensions of a box with maximum volume given fixed surface area: express V in terms of one variable, set dV/dx = 0, solve, and verify it's a maximum using the second derivative test (d²V/dx² < 0)." },
      { context: "Economics — Marginal Analysis", detail: "If C(x) is the cost of producing x units, the marginal cost C'(x) tells you the cost of producing one more unit. Revenue is maximised where marginal revenue = marginal cost: R'(x) = C'(x)." },
    ],
    mistakes: [
      { error: "Forgetting the constant of integration", explanation: "Indefinite integrals always need + C because infinitely many antiderivatives exist. Losing the constant costs marks and can cause errors in initial-value problems." },
      { error: "Misapplying the Chain Rule", explanation: "When differentiating f(g(x)), students often forget to multiply by g'(x). For example: d/dx[sin(3x)] = cos(3x) · 3, NOT just cos(3x)." },
      { error: "Confusing d/dx with Δ/Δx", explanation: "The derivative is the *instantaneous* rate (limit), not the average rate over an interval. Using Δy/Δx when the question asks for dy/dx gives an approximation, not the exact answer." },
    ],
    examTips: [
      "Memorise the derivative/integral table: polynomials, trig functions, exponentials, and logarithms",
      "For word problems: identify the variable, write the function, differentiate/integrate, interpret the result in context",
      "Show all working — partial credit is awarded for correct method even with arithmetic errors",
    ],
    relatedConcepts: ["limits", "continuity", "Taylor series", "differential equations", "multivariate calculus"],
    analogies: ["differentiation is like zooming in on a curve until it looks like a straight line and measuring the slope", "integration is like adding up infinitely many infinitely thin slices to find total area"],
  },
};

// ─── Keyword matching to find the best topic entry ────────────────────────
function findTopicKnowledge(query: string): TopicKnowledge | null {
  const q = query.toLowerCase();
  // Direct key match
  for (const key of Object.keys(TOPIC_DB)) {
    if (q.includes(key)) return TOPIC_DB[key];
  }
  // Alias map for common terms
  const aliases: Record<string, string> = {
    "photosynthesi": "photosynthesis", "chlorophyll": "photosynthesis", "calvin cycle": "photosynthesis", "light reaction": "photosynthesis",
    "ml ": "machine learning", "ai ": "machine learning", "artificial intelligence": "machine learning", "neural network": "machine learning", "deep learning": "machine learning", "supervised learning": "machine learning", "unsupervised learning": "machine learning",
    "array": "data structures", "linked list": "data structures", "hash": "data structures", "binary tree": "data structures", "stack": "data structures", "queue": "data structures", "graph": "data structures", "bst": "data structures", "heap": "data structures",
    "qubit": "quantum computing", "quantum": "quantum computing", "superposition": "quantum computing", "entangle": "quantum computing",
    "evolution": "natural selection", "darwin": "natural selection", "natural selection": "natural selection", "adaptation": "natural selection", "species": "natural selection", "mutation": "natural selection",
    "supply": "supply and demand", "demand": "supply and demand", "equilibrium": "supply and demand", "elasticity": "supply and demand", "market": "supply and demand", "price mechanism": "supply and demand",
    "derivative": "calculus", "integral": "calculus", "differentiat": "calculus", "integrat": "calculus", "calculus": "calculus", "limit": "calculus",
  };
  for (const [alias, key] of Object.entries(aliases)) {
    if (q.includes(alias)) return TOPIC_DB[key];
  }
  return null;
}

// ─── Deterministic hash for consistent but query-specific variation ───────
function hashQuery(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}
function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

// ─── Mock Response Generator ──────────────────────────────────────────────
function generateMockResponse(query: string, studyIntent: string, responseType: string, searchDepth: string): string {
  const topic = query.replace(/^(explain|summarize|compare|analyze|show|how|what|why|when|where|describe|discuss)\s+(this\s+)?(concept|topic)?:?\s*/i, "").trim() || query;
  const knowledge = findTopicKnowledge(query);

  if (knowledge) {
    // Use rich, topic-specific content
    switch (studyIntent) {
      case "exam_prep":       return buildExamPrep(topic, knowledge, searchDepth);
      case "assignment_writing": return buildAssignment(topic, knowledge, searchDepth);
      case "revision_recall": return buildRevision(topic, knowledge, searchDepth);
      case "quick_clarification": return buildQuickClarify(topic, knowledge);
      default:                return buildDeepUnderstanding(topic, knowledge, searchDepth);
    }
  } else {
    // Fallback: generate varied content using query words as seeds
    switch (studyIntent) {
      case "exam_prep":       return generateFallbackExamPrep(topic, searchDepth);
      case "assignment_writing": return generateFallbackAssignment(topic, searchDepth);
      case "revision_recall": return generateFallbackRevision(topic, searchDepth);
      case "quick_clarification": return generateFallbackQuickClarify(topic);
      default:                return generateFallbackDeep(topic, searchDepth);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Knowledge-based builders — produce rich, topic-specific responses
// ═══════════════════════════════════════════════════════════════════════════

function buildExamPrep(topic: string, k: TopicKnowledge, depth: string): string {
  const steps = k.howItWorks.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const principles = k.principles.map(p => `- ${p}`).join("\n");
  const mistakeList = k.mistakes.map(m => `❌ **${m.error}** — ${m.explanation}`).join("\n\n");
  const tips = k.examTips.map(t => `• ${t}`).join("\n");

  return `**Key Insight** — ${k.keyInsight}

**Explanation**

🎯 **Exam-Ready Definition:**
${k.definition}

**Mark Scheme Essentials — Key Principles:**
${principles}

**Step-by-Step Process (know this sequence):**
${steps}

${depth === "comprehensive" ? `**Potential Exam Questions:**

📝 *"Define and explain ${topic}."* (5 marks)
→ Use the definition above + name 2-3 key principles + give 1 example from below

📝 *"Discuss the significance of ${topic} with examples."* (12 marks)
→ Definition (2 marks) + 3 examples with analysis (6 marks) + evaluation of implications (4 marks)

📝 *"Identify common errors in understanding ${topic}."* (6 marks)
→ Name 3 mistakes, explain why each is wrong, provide the correct understanding
` : ""}
**Examples**

${k.examples.map(e => `**${e.context}:**\n${e.detail}`).join("\n\n")}

**Common Mistakes**

${mistakeList}

**Exam Relevance**

${tips}

**Related Topics to Revise:** ${k.relatedConcepts.join(", ")}

**Analogy for Quick Recall:** Think of ${topic} as ${k.analogies[0]}.`;
}

function buildDeepUnderstanding(topic: string, k: TopicKnowledge, depth: string): string {
  const steps = k.howItWorks.map((s, i) => `**Stage ${i + 1}:**\n${s}`).join("\n\n");

  return `**Key Insight** — ${k.keyInsight}

**Explanation**

Let's build a deep, intuitive understanding of **${topic}** from first principles.

**Formal Definition:**
${k.definition}

**How It Actually Works — Stage by Stage:**

${steps}

**Core Principles (the "rules of the game"):**
${k.principles.map(p => `- ${p}`).join("\n")}

${depth === "comprehensive" ? `**The Intuitive Analogy:**
Think of ${topic} as ${k.analogies[0]}. ${k.analogies.length > 1 ? `Alternatively: ${k.analogies[1]}.` : ""}

**Connecting to the Bigger Picture:**
${topic} is closely related to: ${k.relatedConcepts.join(", ")}. Understanding how these concepts interconnect deepens your grasp of each one individually. Each connection gives you another "entry point" into the topic from a different angle.
` : ""}
**Examples**

${k.examples.map(e => `**${e.context}:**\n${e.detail}`).join("\n\n")}

**Common Mistakes**

${k.mistakes.map(m => `🔍 **${m.error}** — ${m.explanation}`).join("\n\n")}

**Exam Relevance**

Understanding ${topic} deeply means you can handle any question format:
${k.examTips.map(t => `- ${t}`).join("\n")}`;
}

function buildAssignment(topic: string, k: TopicKnowledge, depth: string): string {
  return `**Key Insight** — ${k.keyInsight} Understanding both its utility and limitations is essential for critical academic analysis.

**Explanation**

**Academic Overview of ${topic}**

${k.definition}

The study of ${topic} is underpinned by several core principles that warrant examination:

${k.principles.map((p, i) => `${i + 1}. ${p}`).join("\n")}

**Mechanistic Analysis:**
${k.howItWorks.map(s => `- ${s}`).join("\n")}

${depth === "comprehensive" ? `**Critical Evaluation:**

*Strengths:*
${k.examples.map(e => `- Applied in ${e.context}: ${e.detail.split(".")[0]}.`).join("\n")}

*Limitations and Critiques:*
${k.mistakes.map(m => `- ${m.error}: ${m.explanation.split(".")[0]}.`).join("\n")}

**Suggested Essay Structure for ${topic}:**
1. **Introduction** (10%) — Define ${topic} using the formal definition, state your thesis
2. **Theoretical Framework** (20%) — Present the core principles and mechanistic understanding
3. **Evidence and Examples** (35%) — Discuss ${k.examples.map(e => e.context).join(", ")} as cases
4. **Critical Analysis** (25%) — Evaluate strengths, limitations, and contested areas
5. **Conclusion** (10%) — Synthesise findings, restate argument, suggest future directions
` : ""}
**Examples**

**Case Study Applications:**
${k.examples.map(e => `*${e.context}:*\n"${e.detail}" This demonstrates how ${topic} can be applied in practice to produce measurable outcomes.`).join("\n\n")}

**Academic Phrasing Guide:**
Instead of: *"${topic} is really important."*
Write: *"${topic} occupies a central role in the discipline, underpinning both theoretical inquiry and applied practice (see: ${k.relatedConcepts.slice(0, 3).join(", ")})."*

**Common Mistakes**

${k.mistakes.map(m => `📎 **${m.error}** — ${m.explanation}`).join("\n\n")}

**Exam Relevance**

For timed academic writing on ${topic}:
${k.examTips.map(t => `- ${t}`).join("\n")}`;
}

function buildRevision(topic: string, k: TopicKnowledge, depth: string): string {
  const seed = hashQuery(topic);
  const mnemonic = topic.split(/\s+/).map(w => w[0]?.toUpperCase()).join(".") || "T";

  return `**Key Insight** — ${k.keyInsight}

**Explanation**

📋 **QUICK REFERENCE CARD — ${topic}**

**Definition (memorise this):**
> ${k.definition}

**Key Principles — Remember: ${mnemonic}**
${k.principles.map((p, i) => `${i + 1}. ${p}`).join("\n")}

**Process Summary (numbered steps):**
${k.howItWorks.map((s, i) => `${i + 1}. ${s.split(".")[0]}.`).join("\n")}

${depth === "comprehensive" ? `**Flash-Card Ready Q&A:**
${k.mistakes.map(m => `- **Q:** What's wrong with saying "${m.error}"?\n  **A:** ${m.explanation.split(".")[0]}.`).join("\n")}

**Related Topics Web:**
\`${topic}\` ← connects to → ${k.relatedConcepts.map(c => `\`${c}\``).join(", ")}
` : ""}
**Examples**

**One-Liner Recall:**
${k.examples.map((e, i) => `${i + 1}. **${e.context}:** ${e.detail.split(".")[0]}.`).join("\n")}

**Analogy:** ${k.analogies[0]}

**Common Mistakes**

⚡ **Top ${k.mistakes.length} Traps:**
${k.mistakes.map((m, i) => `${i + 1}. **${m.error}** — ${m.explanation.split(".")[0]}.`).join("\n")}

**Self-Test:**
- [ ] Can I state the definition from memory?
- [ ] Can I list the key principles?
- [ ] Can I give ${k.examples.length} examples?
- [ ] Can I name ${k.mistakes.length} common mistakes?
→ All checked? You're ready.

**Exam Relevance**

⏱️ **Speed Template:**
> "${topic}: [definition]. Key principles: [list 3]. Example: [one case]. Limitation: [one critique]. Therefore, [conclusion]."

${k.examTips.map(t => `• ${t}`).join("\n")}`;
}

function buildQuickClarify(topic: string, k: TopicKnowledge): string {
  return `**Key Insight** — ${k.keyInsight}

**Explanation**

**Definition:**
${k.definition}

**How it works (simplified):**
${k.howItWorks.slice(0, 3).map((s, i) => `${i + 1}. ${s.split(".")[0]}.`).join("\n")}

**Key rule to remember:**
${k.principles[0]}

**Examples**

${k.examples[0].context}: ${k.examples[0].detail.split(".")[0]}.

**Common Mistakes**

⚠️ ${k.mistakes[0].error} — ${k.mistakes[0].explanation}

**Exam Relevance**

${k.examTips[0]}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Fallback generators — for topics not in the knowledge base
// Uses the query text itself to produce contextually varied responses
// ═══════════════════════════════════════════════════════════════════════════

function generateFallbackExamPrep(topic: string, depth: string): string {
  const words = topic.split(/\s+/);
  const seed = hashQuery(topic);
  const aspects = [
    `the definition and scope of ${topic}`,
    `key components or stages involved in ${topic}`,
    `how ${topic} relates to broader themes in the course`,
    `real-world applications of ${topic}`,
    `historical development of ${topic}`,
    `limitations and criticisms of ${topic}`,
  ];
  const picked = [aspects[seed % 6], aspects[(seed + 2) % 6], aspects[(seed + 4) % 6]];

  return `**Key Insight** — When studying **${topic}** for exams, focus on being able to define it precisely, explain its mechanism or process, and apply it to novel scenarios. Structured answers with clear reasoning earn the highest marks.

**Explanation**

🎯 **Exam Strategy for ${topic}:**

Examiners testing ${topic} typically assess three levels of understanding:
1. **Knowledge** — Can you define ${topic} and state its key features?
2. **Application** — Can you apply ${topic} to a new scenario or problem?
3. **Evaluation** — Can you critically assess the strengths and limitations of ${topic}?

**Key Points to Cover:**
- ${picked[0]}
- ${picked[1]}
- ${picked[2]}

**Model Answer Framework:**
> "**${topic}** can be defined as [your definition]. It operates through [key mechanism/process]. For example, [concrete example]. While it is valuable for [strength], it is limited by [criticism]. This suggests that [evaluative conclusion]."

${depth === "comprehensive" ? `**Possible Exam Question Styles:**

📝 *"Define ${topic} and explain its importance."* (4-6 marks)
→ Definition + 2 key features + 1 example + significance statement

📝 *"Evaluate the effectiveness of ${topic} in [given context]."* (10-15 marks)
→ Brief definition → 3 arguments for effectiveness → 2 limitations → balanced conclusion

📝 *"Compare ${topic} with [alternative]."* (8-12 marks)
→ Define both → 3 comparison criteria → table or structured comparison → which is preferable and why
` : ""}
**Examples**

Think about ${topic} in these different contexts:
- **Academic:** How would ${topic} be discussed in a lecture or textbook chapter?
- **Applied:** Where do professionals use ${topic} in their daily work?
- **Everyday:** Can you spot ${topic} principles in ordinary life situations?

Preparing one example for each of these contexts gives you flexibility in exams.

**Common Mistakes**

❌ **Being too vague** — "It's an important concept" earns zero marks. State *why* and *how* specifically.

❌ **Listing without explaining** — Bullet points of facts without connecting them shows recall, not understanding.

❌ **Ignoring the question's command word** — "Evaluate" means pros + cons + judgement; "Describe" means features + characteristics; "Explain" means cause + effect + reasoning.

**Exam Relevance**

• Allocate your time: ~2 minutes per mark
• Always define key terms in your first sentence
• End every answer with a brief evaluative conclusion — this shows higher-order thinking`;
}

function generateFallbackDeep(topic: string, depth: string): string {
  const seed = hashQuery(topic);
  const questionStarters = [
    "What problem does it solve?",
    "How did it come to exist?",
    "What would happen without it?",
    "What are the underlying assumptions?",
    "How does it connect to other ideas?",
  ];
  const q1 = questionStarters[seed % 5];
  const q2 = questionStarters[(seed + 2) % 5];

  return `**Key Insight** — To truly understand **${topic}**, go beyond the textbook definition. Ask yourself: *${q1}* and *${q2}* — answering these builds genuine comprehension that transfers to any exam or application.

**Explanation**

**Understanding ${topic} from First Principles**

Most students encounter ${topic} as a set of facts to memorise. But real understanding comes from grasping *why* it exists and *how* it works at a fundamental level.

**Start with the Problem:**
Every concept exists because someone needed to solve a problem or explain something they observed. ${topic} emerged because people needed a way to systematically approach the challenges in this area. Without ${topic}, we'd lack the framework to ${seed % 2 === 0 ? "analyse and predict outcomes" : "organise information and make informed decisions"} effectively.

**The Core Mechanism:**
At its heart, ${topic} works by establishing relationships between key components. These components interact in structured ways — when you change one element, it affects the others predictably. This interconnectedness is what makes ${topic} powerful: once you understand the relationships, you can reason about new situations you've never seen before.

**Building Intuition:**
Instead of memorising facts about ${topic}, try to build a mental model. Ask: *If I changed this one thing, what would happen?* If you can answer that question for different variables, you truly understand the mechanism — not just the definition.

${depth === "comprehensive" ? `**Connections to the Bigger Picture:**
${topic} doesn't exist in isolation. It connects to adjacent concepts through shared underlying principles. When you study related topics, look for the common threads — this cross-referencing deepens your understanding of each individual concept and helps you see the discipline as a coherent whole rather than a collection of disconnected facts.

**The Expert's Perspective:**
Experts in this area don't think about ${topic} as a discrete chunk of knowledge. They see it as part of a network of ideas, each informing and constraining the others. Building this networked understanding is what separates surface-level knowledge from genuine expertise.
` : ""}
**Examples**

**The Teaching Test:**
Can you explain ${topic} to a friend who has never encountered it? If you can — using simple language and a relatable analogy — that's strong evidence of deep understanding. If you find yourself reaching for textbook phrases, dig deeper.

**The Transfer Test:**
Can you identify ${topic} principles at work in a completely different context? True understanding is transferable — the same pattern shows up in different domains once you know what to look for.

**Common Mistakes**

🔍 **Memorisation without comprehension** — Being able to recite a definition without explaining *why* it's true indicates surface-level learning. Push for the *why*.

🔍 **Static thinking** — Treating ${topic} as fixed and absolute. In reality, our understanding evolves, and the concept adapts to new contexts.

🔍 **Isolation** — Studying ${topic} without connecting it to related ideas produces fragile knowledge that breaks under novel exam questions.

**Exam Relevance**

Deep understanding gives you a significant advantage: you can answer questions you've never seen before by reasoning from principles rather than searching your memory for pre-prepared answers.`;
}

function generateFallbackAssignment(topic: string, depth: string): string {
  return `**Key Insight** — Academic discourse on **${topic}** spans multiple perspectives, and a strong assignment engages with the complexity of the topic rather than presenting a one-sided view.

**Explanation**

**Approaching ${topic} in Academic Writing**

A well-crafted academic discussion of ${topic} requires three elements: precise definition, evidence-based analysis, and critical evaluation.

**Defining Your Terms:**
Begin by establishing a clear, citable definition of ${topic}. Avoid colloquial language — use terminology from the field. Compare definitions from multiple sources to demonstrate breadth of reading and identify areas of scholarly consensus or debate.

**Building Your Argument:**
Structure your analysis around a clear thesis. Each paragraph should:
1. Make a claim about ${topic}
2. Support it with evidence (data, citations, case studies)
3. Analyse *why* this evidence supports your claim
4. Link back to the thesis

**Engaging with Counterarguments:**
The strongest assignments don't just argue *for* a position — they acknowledge and address opposing views. When discussing ${topic}, identify at least one significant counterargument and explain why your position remains stronger despite it.

${depth === "comprehensive" ? `**Academic Phrasing Toolkit:**
- "It has been argued that ${topic}..." (introducing a perspective)
- "However, this view fails to account for..." (introducing a counterargument)
- "The evidence suggests that..." (evidence-based claim)
- "This finding aligns with / challenges the work of..." (connecting to literature)
- "While ${topic} has demonstrated utility in..., its limitations become apparent when..." (balanced evaluation)

**Recommended Structure:**
1. **Introduction** (10%) — Define key terms, state thesis, outline structure
2. **Literature Review** (20%) — Survey existing scholarship on ${topic}
3. **Analysis** (40%) — Present your argument with supporting evidence
4. **Critical Discussion** (20%) — Evaluate, compare perspectives, address limitations
5. **Conclusion** (10%) — Summarise, restate thesis, suggest implications
` : ""}
**Examples**

**Strong Academic Sentence:**
*"The concept of ${topic} has been subject to extensive scholarly debate, with proponents emphasising its explanatory power while critics highlight its reductive tendencies (Author, Year; Author, Year)."*

**Weak vs. Strong:**
❌ *"${topic} is a really important concept that everyone should know about."*
✅ *"${topic} occupies a central position within the discipline, serving as both a theoretical framework and a methodological tool for empirical investigation."*

**Common Mistakes**

📎 **Description without analysis** — Recounting what ${topic} is without evaluating it signals a lower-order engagement with the material.

📎 **Missing citations** — Unsupported claims undermine academic credibility. Every substantive assertion needs a reference.

📎 **Poor paragraph structure** — Each paragraph should have one clear point. Rambling paragraphs that cover multiple ideas make your argument difficult to follow.

**Exam Relevance**

For timed essays, prepare a skeleton: 3 arguments, 2 counterpoints, and a conclusion template. Having this ready lets you focus on adapting to the specific question rather than inventing structure under time pressure.`;
}

function generateFallbackRevision(topic: string, depth: string): string {
  const mnemonic = topic.split(/\s+/).map(w => w[0]?.toUpperCase()).join(".") || "T";

  return `**Key Insight** — For quick revision: **${topic}** = a structured approach to understanding and applying principles within its area. Mnemonic: **${mnemonic}** — use the first letters to anchor your recall.

**Explanation**

📋 **REVISION CARD — ${topic}**

**One-Sentence Definition:**
> ${topic} is a systematic method for analysing, understanding, and applying knowledge within its domain, enabling evidence-based reasoning and structured problem-solving.

**Key Points to Remember:**
1. ${topic} has a clear **definition** — know it word-for-word
2. It involves a **process** or **mechanism** — know the steps in order
3. It has **real-world applications** — have at least 2 examples ready
4. It has **limitations** — know at least 1 criticism

**Active Recall Test (cover the answers!):**
| Question | Quick Answer |
|----------|-------------|
| What is ${topic}? | A framework for structured analysis in its domain |
| Name 2 applications | Academic analysis + professional decision-making |
| What's 1 limitation? | May oversimplify complex, context-dependent situations |

${depth === "comprehensive" ? `**Spaced Repetition Schedule:**
📅 Today — Read and understand this card
📅 Tomorrow — Recall from memory, check against card
📅 Day 4 — Recall again without looking
📅 Day 7 — Final recall test — if clean, you've got it

**Memory Hooks:**
- ${mnemonic} = first-letter mnemonic for ${topic}
- Visual: picture ${topic} as a physical object or scene
- Story: create a 30-second narrative explaining ${topic} to a friend
` : ""}
**Examples**

**Quick-fire examples:**
1. In education: ${topic} helps structure how we approach complex problems
2. At work: professionals rely on ${topic} principles for evidence-based decisions
3. In daily life: organising information and evaluating options uses similar logic

**Common Mistakes**

⚡ **Revision traps to avoid:**
1. **Passive re-reading** — Instead: close the book, write what you remember, compare
2. **Skipping practice questions** — Instead: attempt past paper questions under timed conditions
3. **Cramming the night before** — Instead: spread revision across multiple short sessions

**Exam Relevance**

⏱️ **Exam Template (fill in the blanks):**
> "${topic} is defined as ___. It works by ___. For example, ___. However, it is limited by ___. Overall, ___."

Fill this in from memory. If you can, you're prepared.`;
}

function generateFallbackQuickClarify(topic: string): string {
  return `**Key Insight** — **${topic}** is a structured way to understand and work within its subject area, giving you tools to analyse problems and reach well-supported conclusions.

**Explanation**

**Simple answer:**
${topic} provides a framework for breaking down complex problems into manageable parts. Instead of guessing, you follow established principles to reach sound conclusions.

**The key thing to remember:**
- **What:** A systematic approach to analysis within its field
- **Why it matters:** Enables structured thinking where intuition alone falls short
- **One-liner:** "${topic} turns messy complexity into clear, reasoned conclusions."

**Examples**

Think of it like using a map instead of wandering. The map (${topic}) doesn't move you, but it shows you where you are, where you're going, and the best route to get there.

**Common Mistakes**

⚠️ Don't just memorise the definition — make sure you can *apply* it to a scenario you haven't seen before. That's what exams actually test.

**Exam Relevance**

Lead with a definition, add one example, end with a brief evaluation. That three-step structure works for almost any ${topic} exam question.`;
}


const SYSTEM_PROMPT = `You are Insight Scout, an intelligent educational research assistant designed specifically for university students. Your mission is to support learning, coursework, and revision with accurate, well-structured, academically relevant content.

## Your Capabilities:
1. **Explain Concepts**: Break down complex topics into clear, understandable explanations with step-by-step reasoning
2. **Summarize Topics**: Provide concise, well-organized summaries highlighting key points and takeaways
3. **Compare & Contrast**: Analyze similarities and differences between theories, technologies, or concepts
4. **Analyze In-Depth**: Provide comprehensive analysis including implications, significance, and critical perspectives
5. **Real-World Examples**: Connect academic concepts to practical, real-world applications
6. **Study Tips**: Offer effective study strategies, memory techniques, and learning approaches
7. **Common Mistakes**: Identify frequent misconceptions and errors students make

## Response Guidelines:
- Structure responses with clear headings and bullet points for readability
- Use analogies and examples appropriate for university-level understanding
- For technical concepts, include brief code examples or formulas when relevant
- Cite your reasoning and explain the "why" behind concepts
- Be academically rigorous while remaining accessible

## Formatting Standards:
- Use **bold** for key terms and important concepts
- Use bullet points for lists of related items
- Use numbered lists for sequential steps or ranked items
- Include section headers for longer responses
- Provide brief summaries at the end of comprehensive responses

Your responses should be suitable for university coursework, exam preparation, and academic research.`;

type ResearchQuery = z.infer<typeof researchQuerySchema>;

export function registerInsightScoutRoutes(app: Express): void {
  // Conversation management endpoints moved to routes.ts
  // Only keep the query endpoint here

  app.post("/api/research/query", async (req: Request, res: Response) => {
    try {
      const parseResult = researchQuerySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0]?.message || "Invalid request" });
      }
      
      const { query, searchDepth, responseType, studyIntent, conversationId } = parseResult.data;
      let convoId = conversationId || "temp-" + Math.random().toString(36).substring(7);
      
      // For now, skip database storage and just return a stub response
      const depthInstruction = {
        quick: "Provide a brief, focused answer in 2-3 paragraphs.",
        balanced: "Provide a well-structured answer with appropriate depth.",
        comprehensive: "Provide an in-depth, thorough response with examples, explanations, and related concepts.",
      }[searchDepth];

      const intentInstruction = {
        exam_prep: "The student is preparing for exams. Focus on key testable concepts, mark scheme points, potential exam questions, and concise revision-friendly formatting. Highlight what examiners look for.",
        deep_understanding: "The student wants to deeply understand this topic. Provide thorough explanations, underlying principles, connections to related concepts, and build intuition step by step.",
        assignment_writing: "The student is writing an assignment. Provide academically rigorous content suitable for essays or reports, with structured arguments, evidence-based reasoning, and proper academic framing.",
        revision_recall: "The student is revising. Provide concise, memorable summaries with mnemonics, key definitions, and quick-reference material. Focus on retention and recall aids.",
        quick_clarification: "The student needs a quick clarification. Be concise and direct. Answer the specific question without unnecessary elaboration. Get straight to the point.",
      }[studyIntent];

      const typeInstruction = {
        explanation: "Provide a detailed explanation of this concept with step-by-step reasoning. Break down complex ideas into understandable parts and use clear examples.",
        summary: "Provide a concise, well-organized summary highlighting the key points, main ideas, and essential takeaways. Keep it focused and academically relevant.",
        comparison: "Compare and contrast the relevant concepts, theories, or technologies. Create a structured analysis showing similarities, differences, advantages, and disadvantages.",
        analysis: "Provide an in-depth analysis discussing implications, applications, significance, and critical perspectives. Include academic context where relevant.",
        examples: "Provide multiple real-world examples and practical applications of this concept. Show how it applies in industry, research, or everyday situations with specific cases.",
        study_tips: "Provide effective study strategies and tips for learning this topic. Include memory techniques, practice approaches, key areas to focus on, and how to approach exam questions.",
        mistakes: "Identify common mistakes, misconceptions, and errors students make with this topic. Explain why these mistakes happen and how to avoid them. Include correct approaches.",
      }[responseType];

      const chatMessages: Array<{role: string; content: string}> = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${depthInstruction} ${typeInstruction}\n\nStudent's study intent: ${intentInstruction}\n\nStructure your response with these clearly labeled sections where applicable:\n1. **Key Insight** — A bold one-sentence summary of the main takeaway\n2. **Explanation** — The detailed answer\n3. **Examples** — Concrete examples or applications\n4. **Common Mistakes** — Pitfalls to avoid\n5. **Exam Relevance** — How this might appear in exams\n\nQuery: ${query}` },
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Use OpenAI if available, otherwise use mock response
      const openai = await getOpenAI();
      if (openai) {
        const stream = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: chatMessages,
          stream: true,
          max_completion_tokens: searchDepth === "comprehensive" ? 4096 : searchDepth === "quick" ? 1024 : 2048,
        });

        let fullResponse = "";

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      } else {
        // Mock streaming: send response in small chunks to simulate real streaming
        console.log("[Insight Scout] Using mock response (no valid OpenAI key)");
        const mockContent = generateMockResponse(query, studyIntent, responseType, searchDepth);
        const words = mockContent.split(" ");
        
        for (let i = 0; i < words.length; i++) {
          const word = (i === 0 ? "" : " ") + words[i];
          res.write(`data: ${JSON.stringify({ content: word })}\n\n`);
          // Small delay to simulate streaming (non-blocking)
          await new Promise(resolve => setTimeout(resolve, 8));
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, conversationId: convoId })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing research query:", error);
      
      let errorMessage = "Failed to process research query";
      if (error instanceof Error) {
        if (error.message.includes("getaddrinfo") || error.message.includes("ENOTFOUND")) {
          errorMessage = "Network error: Unable to reach external services. Please check your connection.";
        } else if (error.message.includes("401") || error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorMessage = "Authentication error: Invalid API credentials configured.";
        } else if (error.message.includes("429")) {
          errorMessage = "Rate limit exceeded: Too many requests. Please try again later.";
        } else if (error.message.includes("model") || error.message.includes("does not exist")) {
          errorMessage = "Model error: The configured AI model is not available.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  app.post("/api/research/create-flashcard", async (req: Request, res: Response) => {
    try {
      const { front, back, deckId } = req.body;
      
      if (!front || !back) {
        return res.status(400).json({ error: "Front and back content are required" });
      }

      res.json({ 
        success: true, 
        message: "Flashcard created from research",
        flashcard: { front, back, deckId }
      });
    } catch (error) {
      console.error("Error creating flashcard from research:", error);
      res.status(500).json({ error: "Failed to create flashcard" });
    }
  });

  app.post("/api/research/create-quiz-question", async (req: Request, res: Response) => {
    try {
      const { question, options, quizId, explanation } = req.body;
      
      if (!question || !options) {
        return res.status(400).json({ error: "Question and options are required" });
      }

      res.json({ 
        success: true, 
        message: "Quiz question created from research",
        question: { question, options, quizId, explanation }
      });
    } catch (error) {
      console.error("Error creating quiz question from research:", error);
      res.status(500).json({ error: "Failed to create quiz question" });
    }
  });
}
