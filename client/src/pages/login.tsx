/*
  Login page
  This page handles sign in, sign up, and email verification.
  It also supports onboarding choices so new users can start
  with sample decks, quizzes, and flashcards.
*/

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Brain, 
  Sparkles, 
  Target,
  GraduationCap,
  ArrowLeft,
  Mail,
  Lock,
  User,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { queryClient } from "@/lib/queryClient";

// Handles sign-in, sign-up, and verification on one screen.
export default function Login() {
  console.log("[login.tsx] Login page rendering");
  const [location, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(() => {
    const mode = new URLSearchParams(window.location.search).get("mode");
    return mode !== "signup";
  });
  const [signInEmailOrUsername, setSignInEmailOrUsername] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpFirstName, setSignUpFirstName] = useState("");
  const [signUpLastName, setSignUpLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [wantsSampleDecks, setWantsSampleDecks] = useState(true);
  const [wantsSampleQuizzes, setWantsSampleQuizzes] = useState(true);
  const [wantsSampleFlashcards, setWantsSampleFlashcards] = useState(true);
  const [starterDeckCount, setStarterDeckCount] = useState(1);
  const [starterFlashcardsPerDeck, setStarterFlashcardsPerDeck] = useState(6);
  const [starterQuizCount, setStarterQuizCount] = useState(1);
  const [starterQuestionsPerQuiz, setStarterQuestionsPerQuiz] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isModeTransitioning, setIsModeTransitioning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationUserId, setVerificationUserId] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabledAt, setResendDisabledAt] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Returns to the landing page with a short transition.
  const navigateHome = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    window.setTimeout(() => {
      setLocation("/");
    }, 220);
  };

  // Switches between login and sign-up modes.
  const handleModeChange = (nextModeIsLogin: boolean) => {
    if (isModeTransitioning || nextModeIsLogin === isLogin) return;

    setError("");
    setIsModeTransitioning(true);
    window.setTimeout(() => {
      setIsLogin(nextModeIsLogin);
      window.history.replaceState(
        {},
        document.title,
        nextModeIsLogin ? "/login" : "/login?mode=signup"
      );
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsModeTransitioning(false);
        });
      });
    }, 140);
  };

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get("mode");
    const nextIsLogin = mode !== "signup";
    if (nextIsLogin !== isLogin && !isModeTransitioning) {
      setIsLogin(nextIsLogin);
      setError("");
    }
  }, [location, isLogin, isModeTransitioning]);

  // Handle resend code countdown timer
  useEffect(() => {
    if (resendDisabledAt === 0) {
      setTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((resendDisabledAt - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setResendDisabledAt(0);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [resendDisabledAt]);

  // Check if we have auth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const hashParams = new URLSearchParams(hash);

    const token = hashParams.get("access_token") || params.get("token");
    const err =
      hashParams.get("error_description") ||
      hashParams.get("error") ||
      params.get("error");

    if (err) {
      setError(`OAuth error: ${err}`);
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
      window.dispatchEvent(new CustomEvent("auth-update"));
      // Clear URL and redirect
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    }
  }, [setLocation]);

  const features = [
    { icon: Brain, label: "Smart Flashcards", desc: "AI-powered spaced repetition" },
    { icon: Target, label: "Adaptive Quizzes", desc: "Adjusts to your level" },
    { icon: Sparkles, label: "Insight Scout", desc: "AI insight assistant" },
    { icon: BookOpen, label: "Study Materials", desc: "Auto-generated notes" },
  ];

  const subjectSuggestions = [
    "Computer Science",
    "Mathematics",
    "Biology",
    "Chemistry",
    "Physics",
    "Economics",
    "Business",
    "Psychology",
  ];

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((value) => value !== subject)
        : [...current, subject],
    );
  };

  const addCustomSubject = () => {
    const normalized = customSubject.trim();
    if (!normalized) return;
    if (!selectedSubjects.includes(normalized)) {
      setSelectedSubjects((current) => [...current, normalized]);
    }
    setCustomSubject("");
  };

  const getStarterCardsForSubject = (subject: string) => [
    {
      front: `${subject}: Core concept`,
      back: `Define one foundational concept from ${subject} and explain why it matters.`,
    },
    {
      front: `${subject}: Key terminology`,
      back: `List three high-value terms in ${subject} with a one-line explanation for each.`,
    },
    {
      front: `${subject}: Common mistake`,
      back: `Identify a frequent mistake students make in ${subject} and how to avoid it.`,
    },
  ];

  const buildStarterCardsForSubject = (subject: string, count: number) => {
    const templates = getStarterCardsForSubject(subject);
    const safeCount = Math.max(1, Math.min(50, count));

    return Array.from({ length: safeCount }, (_, index) => {
      const template = templates[index % templates.length];
      return {
        front: `${template.front} ${safeCount > templates.length ? `(${index + 1})` : ""}`.trim(),
        back: template.back,
      };
    });
  };

  const getStarterQuizQuestionsForSubject = (subject: string) => [
    {
      type: "mcq",
      difficulty: 2,
      marks: 1,
      question: `Which statement best describes the focus of ${subject}?`,
      explanation: `A strong answer identifies the core purpose and problem-space of ${subject}.`,
      options: [
        { text: `It studies principles, methods, and applications within ${subject}.`, isCorrect: true },
        { text: "It is only about memorizing isolated facts.", isCorrect: false },
        { text: "It has no real-world relevance.", isCorrect: false },
        { text: "It cannot be practiced with problem-solving.", isCorrect: false },
      ],
    },
    {
      type: "mcq",
      difficulty: 3,
      marks: 1,
      question: `What is the best study strategy when starting ${subject}?`,
      explanation: "Concept understanding + active recall + spaced review is generally most effective.",
      options: [
        { text: "Read once and move on.", isCorrect: false },
        { text: "Combine concept understanding with practice and review.", isCorrect: true },
        { text: "Only watch videos without solving problems.", isCorrect: false },
        { text: "Skip weak topics and focus only on easy ones.", isCorrect: false },
      ],
    },
  ];

  const buildStarterQuizQuestionsForSubject = (subject: string, count: number) => {
    const templates = getStarterQuizQuestionsForSubject(subject);
    const safeCount = Math.max(1, Math.min(30, count));

    return Array.from({ length: safeCount }, (_, index) => {
      const template = templates[index % templates.length];
      return {
        ...template,
        question: `${template.question} ${safeCount > templates.length ? `(${index + 1})` : ""}`.trim(),
      };
    });
  };

  const runOnboardingSetup = async (token: string) => {
    if (!wantsSampleDecks && !wantsSampleQuizzes && !wantsSampleFlashcards) {
      return;
    }

    const subjects = selectedSubjects.length > 0 ? selectedSubjects : ["General Studies"];
    const safeDeckCount = Math.max(1, Math.min(10, starterDeckCount));
    const safeQuizCount = Math.max(1, Math.min(10, starterQuizCount));
    const safeFlashcardsPerDeck = Math.max(1, Math.min(100, starterFlashcardsPerDeck));
    const safeQuestionsPerQuiz = Math.max(1, Math.min(30, starterQuestionsPerQuiz));

    const authedPost = async (url: string, body: unknown) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed request: ${url}`);
      }

      return response.json();
    };

    for (const subject of subjects) {
      const createdDeckIds: string[] = [];

      if (wantsSampleDecks || wantsSampleFlashcards) {
        for (let deckIndex = 0; deckIndex < safeDeckCount; deckIndex++) {
          const deck = await authedPost("/api/decks", {
            title: `${subject} Starter Deck ${deckIndex + 1}`,
            subject,
            description: `Starter revision deck ${deckIndex + 1} generated for ${subject}.`,
            difficulty: "easy",
          });

          if (deck?.id) {
            createdDeckIds.push(deck.id);
          }
        }
      }

      if (wantsSampleFlashcards && createdDeckIds.length > 0) {
        for (const targetDeckId of createdDeckIds) {
          const starterCards = buildStarterCardsForSubject(subject, safeFlashcardsPerDeck);
          for (const card of starterCards) {
            await authedPost(`/api/decks/${targetDeckId}/cards`, {
              type: "basic",
              front: card.front,
              back: card.back,
            });
          }
        }
      }

      if (wantsSampleQuizzes) {
        for (let quizIndex = 0; quizIndex < safeQuizCount; quizIndex++) {
          await authedPost("/api/quizzes", {
            title: `${subject} Starter Quiz ${quizIndex + 1}`,
            subject,
            description: `Baseline quiz ${quizIndex + 1} to warm up your ${subject} fundamentals.`,
            mode: "practice",
            questions: buildStarterQuizQuestionsForSubject(subject, safeQuestionsPerQuiz),
          });
        }
      }
    }
  };

    /*
  ----------------------------------------------------------
  Function: handleSubmit

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - e: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailOrUsername: signInEmailOrUsername,
            password: signInPassword,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Authentication failed");
        }

        const data = await response.json();
        queryClient.clear();
        localStorage.setItem("token", data.token);
        window.dispatchEvent(new CustomEvent("auth-update"));
        setTimeout(() => {
          setLocation("/dashboard");
        }, 300);
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signUpUsername,
          email: signUpEmail,
          password: signUpPassword,
          firstName: signUpFirstName,
          lastName: signUpLastName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Authentication failed");
      }

      const data = await response.json();
      
      // Store token
      queryClient.clear();
      localStorage.setItem("token", data.token);

      if (!isLogin) {
        // Run starter-content setup in the background so signup feels instant.
        void (async () => {
          try {
            await runOnboardingSetup(data.token);
            localStorage.setItem(
              "studymate-onboarding",
              JSON.stringify({
                subjects: selectedSubjects,
                sampleDecks: wantsSampleDecks,
                sampleQuizzes: wantsSampleQuizzes,
                sampleFlashcards: wantsSampleFlashcards,
                starterDeckCount,
                starterFlashcardsPerDeck,
                starterQuizCount,
                starterQuestionsPerQuiz,
              }),
            );
          } catch (setupError) {
            console.warn("[onboarding] starter content setup failed", setupError);
          }
        })();
      }
      
      // Trigger auth update event
      window.dispatchEvent(new CustomEvent("auth-update"));
      
      // Redirect to dashboard after a brief delay to allow auth state to update
      setTimeout(() => {
        setLocation("/dashboard");
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setSignInEmailOrUsername("demo-user");
    setSignInPassword("demo-user");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: "demo-user",
          password: "demo-user",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Demo login failed");
      }

      const data = await response.json();
      queryClient.clear();
      localStorage.setItem("token", data.token);
      window.dispatchEvent(new CustomEvent("auth-update"));
      setTimeout(() => {
        setLocation("/dashboard");
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
      setLoading(false);
    }
  };

    /*
  ----------------------------------------------------------
  Function: handleVerifyEmail

  Purpose:
  Handles email verification code submission.

  Parameters:
  - e: Form submission event

  Process:
  1. Validates the 6-digit code
  2. Calls /api/auth/verify-email endpoint
  3. On success: stores token and redirects to dashboard
  4. On failure: displays error message

  Why Validation is Important:
  Input validation prevents invalid codes from hitting the server.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      setVerificationError("Please enter a valid 6-digit code");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verificationEmail,
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Verification failed");
      }

      const data = await response.json();
      
      // Store token
      queryClient.clear();
      localStorage.setItem("token", data.token);

      try {
        await runOnboardingSetup(data.token);
        localStorage.setItem(
          "studymate-onboarding",
          JSON.stringify({
            subjects: selectedSubjects,
            sampleDecks: wantsSampleDecks,
            sampleQuizzes: wantsSampleQuizzes,
            sampleFlashcards: wantsSampleFlashcards,
            starterDeckCount,
            starterFlashcardsPerDeck,
            starterQuizCount,
            starterQuestionsPerQuiz,
          }),
        );
      } catch (setupError) {
        console.warn("[onboarding] starter content setup failed", setupError);
      }
      
      // Trigger auth update event
      window.dispatchEvent(new CustomEvent("auth-update"));
      
      // Reset form state
      setIsVerifying(false);
      setVerificationCode("");
      
      // Redirect to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 300);
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Verification failed");
      setVerificationLoading(false);
    }
  };

  /*
  ----------------------------------------------------------
  Function: handleResendCode

  Purpose:
  Handles resending verification code to email with rate limiting.

  Parameters:
  - None: Operates using closure/module state

  Process:
  1. Validates that resend is not in cooldown
  2. Calls /api/auth/resend-code endpoint
  3. On success: displays message and starts 60-second cooldown
  4. On failure: displays error message

  Why Validation is Important:
  Rate limiting prevents abuse and excessive email sending.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleResendCode = async () => {
    if (resendDisabledAt > Date.now()) {
      return; // Still in cooldown
    }

    setResendLoading(true);
    setVerificationError("");

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: verificationUserId,
          email: verificationEmail,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to resend code");
      }

      // Start 60-second cooldown
      setResendDisabledAt(Date.now() + 60000);
      setResendLoading(false);
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Failed to resend code");
      setResendLoading(false);
    }
  };

  /*
  ----------------------------------------------------------
  Function: handleGoogleLogin

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = "/api/auth/google";
  };

  /*
  ----------------------------------------------------------
  Function: handleGithubLogin

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleGithubLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = "/api/auth/github";
  };

  const reducedMotion = useReducedMotion();

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row public-page-transition overflow-hidden ${isNavigating ? "exiting" : ""}`}>
      {/* Left Panel - Hero */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        initial={false}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600" />
        
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-400 rounded-full blur-3xl opacity-20"
          animate={reducedMotion ? {} : { y: [0, 30, 0] }}
          transition={reducedMotion ? {} : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: "transform" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-15"
          animate={reducedMotion ? {} : { y: [0, -40, 0] }}
          transition={reducedMotion ? {} : { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ willChange: "transform" }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1' fill='%23fff'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.6,
              ease: [0, 0, 0.2, 1],
            }}
            className="mb-12"
          >
            <motion.div 
              className="flex items-center gap-4 mb-8"
              whileHover={reducedMotion ? {} : { scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-14 h-14 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl"
                whileHover={reducedMotion ? {} : { boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
              >
                <GraduationCap className="w-8 h-8 text-white" />
              </motion.div>
              <motion.span className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                StudyMate
              </motion.span>
            </motion.div>

            <motion.h1 
              className="text-5xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.6,
                ease: [0, 0, 0.2, 1],
                delay: reducedMotion ? 0 : 0.1,
              }}
            >
              Your intelligent study companion
            </motion.h1>

            <motion.p 
              className="text-xl text-white/80 max-w-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: reducedMotion ? 0 : 0.6,
                ease: [0, 0, 0.2, 1],
                delay: reducedMotion ? 0 : 0.2,
              }}
            >
              Join thousands of students achieving their academic goals with personalized learning powered by AI.
            </motion.p>
          </motion.div>

          {/* Feature cards */}
          <motion.div 
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: reducedMotion ? 0 : 0.3,
                },
              },
            }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: {
                    opacity: 1,
                    x: 0,
                    transition: {
                      duration: reducedMotion ? 0 : 0.5,
                      ease: [0, 0, 0.2, 1],
                    },
                  },
                }}
                whileHover={reducedMotion ? {} : { x: 8, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                transition={{ duration: 0.3 }}
                className="group flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer shadow-lg"
              >
                <motion.div 
                  className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"
                  whileHover={reducedMotion ? {} : { scale: 1.15, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">{feature.label}</h3>
                  <p className="text-sm text-white/70 group-hover:text-white/90 transition-colors">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Auth Form */}
      <motion.div 
        className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-sky-50 via-white to-cyan-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/90 relative overflow-hidden"
        initial={false}
      >
        {/* Decorative blur elements */}
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-10 pointer-events-none"
          animate={reducedMotion ? {} : { y: [0, 40, 0] }}
          transition={reducedMotion ? {} : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 -left-32 w-64 h-64 bg-cyan-200 rounded-full blur-3xl opacity-10 pointer-events-none"
          animate={reducedMotion ? {} : { x: [0, 50, 0] }}
          transition={reducedMotion ? {} : { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.5,
            ease: [0, 0, 0.2, 1],
            delay: reducedMotion ? 0 : 0.1,
          }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="border border-slate-200/70 shadow-2xl bg-white/92 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-900/78 overflow-hidden">
            {/* Gradient top border */}
            <div className="h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600" />

            <CardHeader className="space-y-3 pb-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reducedMotion ? 0 : 0.2, duration: 0.4 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={navigateHome}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </motion.div>

              <motion.div
                className="lg:hidden flex items-center justify-center gap-3 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reducedMotion ? 0 : 0.25, duration: 0.4 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  StudyMate
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reducedMotion ? 0 : 0.15, duration: 0.4 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  {isVerifying ? "Verify Email" : (isLogin ? "Welcome Back" : "Create Account")}
                </CardTitle>
                <CardDescription className="text-base mt-2 text-slate-600 dark:text-slate-300">
                  {isVerifying ? `Enter the 6-digit code sent to ${verificationEmail}` : (isLogin ? "Sign in to your account" : "Sign up to get started")}
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6 pb-6">
              <AnimatePresence mode="wait">
                {error && !isVerifying && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm font-medium flex items-start gap-3"
                  >
                    <div className="mt-0.5 w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {verificationError && isVerifying && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm font-medium flex items-start gap-3"
                  >
                    <div className="mt-0.5 w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    <span>{verificationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isVerifying ? (
                  // Email Verification Form
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <form onSubmit={handleVerifyEmail} className="space-y-6">
                      {/* 6-digit code input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Verification Code
                        </label>
                        <div
                          className="flex gap-2 justify-center"
                          onPaste={(e) => {
                            const pastedText = e.clipboardData.getData("text");
                            const digits = pastedText.replace(/\D/g, "").slice(0, 6);
                            if (!digits) {
                              return;
                            }

                            e.preventDefault();
                            setVerificationCode(digits);

                            const focusIndex = Math.min(digits.length, 5);
                            const input = document.querySelector(
                              `input[data-verification-index="${focusIndex}"]`
                            ) as HTMLInputElement | null;
                            input?.focus();
                          }}
                        >
                          {Array.from({ length: 6 }).map((_, index) => (
                            <motion.input
                              key={index}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              autoFocus={index === 0}
                              value={verificationCode[index] || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!/[^0-9]/.test(value)) {
                                  const newCode = verificationCode.split("");
                                  newCode[index] = value;
                                  setVerificationCode(newCode.join(""));
                                  
                                  // Auto-focus next input
                                  if (value && index < 5) {
                                    const nextInput = document.querySelector(
                                      `input[data-verification-index="${index + 1}"]`
                                    ) as HTMLInputElement | null;
                                    nextInput?.focus();
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
                                  const prevInput = document.querySelector(
                                    `input[data-verification-index="${index - 1}"]`
                                  ) as HTMLInputElement | null;
                                  prevInput?.focus();
                                }
                              }}
                              data-verification-index={index}
                              whileHover={reducedMotion ? {} : { scale: 1.05 }}
                              whileFocus={reducedMotion ? {} : { scale: 1.08 }}
                              className="w-12 h-14 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-center text-xl font-bold focus:border-teal-500 focus:ring-0 focus:outline-none transition-all text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                              placeholder="•"
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                          Enter the code sent to your email
                        </p>
                      </div>

                      <motion.div
                        whileHover={reducedMotion ? {} : { scale: 1.02 }}
                        whileTap={reducedMotion ? {} : { scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          disabled={verificationLoading || verificationCode.length !== 6}
                          className="w-full h-12 rounded-lg bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 text-white font-bold text-base hover:shadow-2xl hover:shadow-teal-500/30 transition-all disabled:opacity-50 disabled:hover:shadow-none"
                        >
                          {verificationLoading ? "Verifying..." : "Verify Email"}
                        </Button>
                      </motion.div>
                    </form>

                    {/* Resend code section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
                          Didn't get the code?
                        </span>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendLoading || resendDisabledAt > Date.now()}
                        variant="outline"
                        className="w-full h-12 rounded-lg border-2 border-teal-500 text-teal-600 dark:text-teal-400 font-bold hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-all disabled:opacity-50"
                      >
                        {resendLoading
                          ? "Sending..."
                          : timeRemaining > 0
                          ? `Resend Code (${timeRemaining}s)`
                          : "Resend Code"}
                      </Button>
                    </motion.div>

                    {/* Back to signup button */}
                    <Button
                      type="button"
                      onClick={() => {
                        setIsVerifying(false);
                        setVerificationCode("");
                        setVerificationError("");
                      }}
                      variant="ghost"
                      className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm"
                    >
                      Back to Sign Up
                    </Button>
                  </motion.div>
                ) : (
                  // Login/Signup Form
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.4,
                      delay: reducedMotion ? 0 : 0.1,
                    }}
                  >
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {isLogin ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            <Input
                              type="text"
                              placeholder="Email or Username"
                              value={signInEmailOrUsername}
                              onChange={(e) => setSignInEmailOrUsername(e.target.value)}
                              required
                              className="h-12 pl-10 rounded-lg border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                            />
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            <Input
                              type="password"
                              placeholder="Password"
                              value={signInPassword}
                              onChange={(e) => setSignInPassword(e.target.value)}
                              required
                              className="h-12 pl-10 rounded-lg border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={handleDemoLogin}
                            className="h-11 w-full rounded-lg border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
                          >
                            Use Demo Account (demo-user)
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            <Input
                              type="text"
                              placeholder="Username"
                              value={signUpUsername}
                              onChange={(e) => setSignUpUsername(e.target.value)}
                              className="h-12 pl-10 rounded-lg border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              type="text"
                              placeholder="First Name"
                              value={signUpFirstName}
                              onChange={(e) => setSignUpFirstName(e.target.value)}
                              className="h-12 rounded-lg border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                              required
                            />
                            <Input
                              type="text"
                              placeholder="Last Name"
                              value={signUpLastName}
                              onChange={(e) => setSignUpLastName(e.target.value)}
                              className="h-12 rounded-lg border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                              required
                            />
                          </div>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            <Input
                              type="email"
                              placeholder="Email address"
                              value={signUpEmail}
                              onChange={(e) => setSignUpEmail(e.target.value)}
                              required
                              className="h-12 pl-10 rounded-lg border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                            />
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            <Input
                              type="password"
                              placeholder="Create password"
                              value={signUpPassword}
                              onChange={(e) => setSignUpPassword(e.target.value)}
                              required
                              className="h-12 pl-10 rounded-lg border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-800/85 dark:text-slate-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                            />
                          </div>

                          {/* Study Profile Card */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/40 to-cyan-50/40 dark:from-blue-950/20 dark:to-cyan-950/20 backdrop-blur-sm p-4 space-y-4"
                          >
                            <div>
                              <p className="text-sm font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Study Profile Assessment</p>
                              <p className="text-xs text-muted-foreground mt-1">Choose what you study so StudyMate can tailor your starting experience.</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {subjectSuggestions.map((subject, idx) => {
                                const selected = selectedSubjects.includes(subject);
                                return (
                                  <motion.button
                                    key={subject}
                                    type="button"
                                    onClick={() => toggleSubject(subject)}
                                    whileHover={reducedMotion ? {} : { scale: 1.05 }}
                                    whileTap={reducedMotion ? {} : { scale: 0.95 }}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                      delay: reducedMotion ? 0 : idx * 0.04,
                                      duration: 0.3,
                                    }}
                                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                                      selected
                                        ? "border-teal-500 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-700 dark:text-teal-300 shadow-lg shadow-teal-500/20"
                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                    }`}
                                  >
                                    {subject}
                                  </motion.button>
                                );
                              })}
                            </div>

                            <div className="flex gap-2">
                              <Input
                                type="text"
                                placeholder="Add another subject"
                                value={customSubject}
                                onChange={(e) => setCustomSubject(e.target.value)}
                                className="h-10 rounded-lg border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                              />
                              <motion.div
                                whileHover={reducedMotion ? {} : { scale: 1.05 }}
                                whileTap={reducedMotion ? {} : { scale: 0.95 }}
                              >
                                <Button 
                                  type="button" 
                                  onClick={addCustomSubject} 
                                  className="h-10 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all"
                                >
                                  Add
                                </Button>
                              </motion.div>
                            </div>

                            {/* Starter content section */}
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30 p-3 text-sm"
                            >
                              <p className="font-bold text-slate-800 dark:text-white">Generate starter content</p>
                              
                              <label className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
                                <span className="text-slate-700 dark:text-slate-300">Sample decks</span>
                                <motion.input
                                  type="checkbox"
                                  checked={wantsSampleDecks}
                                  onChange={(e) => setWantsSampleDecks(e.target.checked)}
                                  whileHover={reducedMotion ? {} : { scale: 1.1 }}
                                  className="h-5 w-5 rounded accent-teal-500 cursor-pointer"
                                />
                              </label>

                              {wantsSampleDecks && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="pl-3 border-l-2 border-teal-500 space-y-2"
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-700 dark:text-slate-300">How many flashcard decks?</span>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={10}
                                      value={starterDeckCount}
                                      onChange={(e) => setStarterDeckCount(Number(e.target.value) || 1)}
                                      className="h-8 w-20 rounded text-xs text-center"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-700 dark:text-slate-300">How many flashcards per deck?</span>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={100}
                                      value={starterFlashcardsPerDeck}
                                      onChange={(e) => setStarterFlashcardsPerDeck(Number(e.target.value) || 1)}
                                      className="h-8 w-20 rounded text-xs text-center"
                                    />
                                  </div>
                                </motion.div>
                              )}

                              <label className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
                                <span className="text-slate-700 dark:text-slate-300">Sample quizzes</span>
                                <motion.input
                                  type="checkbox"
                                  checked={wantsSampleQuizzes}
                                  onChange={(e) => setWantsSampleQuizzes(e.target.checked)}
                                  whileHover={reducedMotion ? {} : { scale: 1.1 }}
                                  className="h-5 w-5 rounded accent-teal-500 cursor-pointer"
                                />
                              </label>

                              {wantsSampleQuizzes && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="pl-3 border-l-2 border-teal-500 space-y-2"
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-700 dark:text-slate-300">How many quizzes?</span>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={10}
                                      value={starterQuizCount}
                                      onChange={(e) => setStarterQuizCount(Number(e.target.value) || 1)}
                                      className="h-8 w-20 rounded text-xs text-center"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-700 dark:text-slate-300">How many questions per quiz?</span>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={30}
                                      value={starterQuestionsPerQuiz}
                                      onChange={(e) => setStarterQuestionsPerQuiz(Number(e.target.value) || 1)}
                                      className="h-8 w-20 rounded text-xs text-center"
                                    />
                                  </div>
                                </motion.div>
                              )}

                              <label className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
                                <span className="text-slate-700 dark:text-slate-300">Sample flashcards</span>
                                <motion.input
                                  type="checkbox"
                                  checked={wantsSampleFlashcards}
                                  onChange={(e) => setWantsSampleFlashcards(e.target.checked)}
                                  whileHover={reducedMotion ? {} : { scale: 1.1 }}
                                  className="h-5 w-5 rounded accent-teal-500 cursor-pointer"
                                />
                              </label>
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      )}

                      <motion.div
                        whileHover={reducedMotion ? {} : { scale: 1.02 }}
                        whileTap={reducedMotion ? {} : { scale: 0.98 }}
                      >
                        <Button 
                          type="submit" 
                          disabled={loading || isModeTransitioning} 
                          className="w-full h-12 rounded-lg bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 text-white font-bold text-base hover:shadow-2xl hover:shadow-teal-500/30 transition-all disabled:opacity-50 disabled:hover:shadow-none"
                        >
                          {loading ? (isLogin ? "Signing in..." : "Creating account...") : (isLogin ? "Sign In" : "Sign Up")}
                        </Button>
                      </motion.div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isVerifying && (
                <>
                  {/* Divider */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: reducedMotion ? 0 : 0.2, duration: 0.4 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">Or continue with</span>
                    </div>
                  </motion.div>

                  {/* OAuth buttons */}
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                    className="space-y-3"
                  >
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        show: { opacity: 1, y: 0 },
                      }}
                      whileHover={reducedMotion ? {} : { scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
                      whileTap={reducedMotion ? {} : { scale: 0.98 }}
                    >
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-12 rounded-lg border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-300 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold transition-all"
                      >
                        <svg className="w-6 h-6 mr-3 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                      </Button>
                    </motion.div>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        show: { opacity: 1, y: 0 },
                      }}
                      whileHover={reducedMotion ? {} : { scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
                      whileTap={reducedMotion ? {} : { scale: 0.98 }}
                    >
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleGithubLogin}
                        disabled={loading}
                        className="w-full h-12 rounded-lg border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-300 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold transition-all"
                      >
                        <svg className="w-6 h-6 mr-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Toggle mode */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reducedMotion ? 0 : 0.3 }}
                    className="text-center text-sm text-slate-600 dark:text-slate-400"
                  >
                    {isLogin ? (
                      <>
                        Don't have an account?{" "}
                        <motion.button
                          type="button"
                          onClick={() => handleModeChange(false)}
                          whileHover={reducedMotion ? {} : { scale: 1.05 }}
                          whileTap={reducedMotion ? {} : { scale: 0.95 }}
                          className="font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                        >
                          Sign up
                        </motion.button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <motion.button
                          type="button"
                          onClick={() => handleModeChange(true)}
                          whileHover={reducedMotion ? {} : { scale: 1.05 }}
                          whileTap={reducedMotion ? {} : { scale: 0.95 }}
                          className="font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                        >
                          Sign in
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
