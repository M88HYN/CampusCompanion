"use client";

/*
  Landing page
  This page introduces CampusCompanion and shows the main value quickly.
  It uses lightweight animation and clear calls to action,
  guiding users to sign in or create an account.
*/

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Brain,
  BookOpen,
  Rocket,
  Sparkles,
  Target,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: Brain,
    title: "Smart Flashcards",
    description: "Adaptive spaced repetition to help you remember more in less time.",
    color: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Target,
    title: "Adaptive Quizzes",
    description: "Practice with questions that evolve with your performance.",
    color: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: Sparkles,
    title: "Insight Scout",
    description: "Get AI-powered explanations and summaries for better clarity.",
    color: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    icon: BookOpen,
    title: "Organized Notes",
    description: "Capture, structure, and review study material in one place.",
    color: "bg-green-100",
    iconColor: "text-green-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0,
    },
  },
};

const itemVariants = (reducedMotion: boolean) => ({
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: reducedMotion ? 0 : 0.4,
      ease: [0, 0, 0.2, 1],
    },
  },
});

const fadeInUp = (delay = 0, reducedMotion: boolean = false) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: reducedMotion ? 0 : 0.4,
      ease: [0, 0, 0.2, 1],
      delay: reducedMotion ? 0 : delay,
    },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
});

const slideInRight = (delay = 0, reducedMotion: boolean = false) => ({
  initial: { opacity: 0, x: 40 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: reducedMotion ? 0 : 0.5,
      ease: [0, 0, 0.2, 1],
      delay: reducedMotion ? 0 : delay,
    },
  },
});

// Decorative background shapes for depth in the hero section.
function FloatingBlobs() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      {/* Blue glow in the top-left corner. */}
      <motion.div
        className="absolute -top-20 -left-40 w-96 h-96 bg-blue-500 rounded-full blur-[80px] opacity-7 pointer-events-none z-0"
        style={{ willChange: "transform" }}
        animate={
          reducedMotion
            ? {}
            : {
                y: [-12, 12, -12],
              }
        }
        transition={
          reducedMotion
            ? {}
            : {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0,
              }
        }
      />

      {/* Purple glow sitting behind the hero. */}
      <motion.div
        className="absolute top-96 right-40 w-80 h-80 bg-purple-500 rounded-full blur-[60px] opacity-6 pointer-events-none z-0"
        style={{ willChange: "transform" }}
        animate={
          reducedMotion
            ? {}
            : {
                y: [12, -12, 12],
              }
        }
        transition={
          reducedMotion
            ? {}
            : {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }
        }
      />

      {/* Teal glow along the right edge. */}
      <motion.div
        className="absolute top-64 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-[70px] opacity-5 pointer-events-none z-0"
        style={{ willChange: "transform" }}
        animate={
          reducedMotion
            ? {}
            : {
                y: [-12, 12, -12],
              }
        }
        transition={
          reducedMotion
            ? {}
            : {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }
        }
      />
    </>
  );
}

// Small count-up effect for the headline stat.
function StatCounter() {
  const [count, setCount] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setCount(4);
      return;
    }

    const interval = setInterval(() => {
      setCount((prev) => (prev < 4 ? prev + 1 : 4));
    }, 40);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  return <span>{count}</span>;
}

// Top navigation that tightens styling once the user scrolls.
function NavBar({ isScrolled }: { isScrolled: boolean }) {
  const [, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const reducedMotion = useReducedMotion();

  const navigateToSignIn = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    window.setTimeout(() => {
      setLocation("/login");
    }, 220);
  };

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "backdrop-blur-[12px] bg-white/80 border-b border-black/5"
          : "bg-transparent"
      }`}
      initial={false}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:py-5">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            ease: [0, 0, 0.2, 1],
            delay: reducedMotion ? 0 : 0.1,
          }}
        >
          <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 shadow-lg">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">StudyMate</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            ease: [0, 0, 0.2, 1],
            delay: reducedMotion ? 0 : 0.1,
          }}
        >
          <Button
            variant="outline"
            className="relative group rounded-lg h-10 px-4 border border-gray-200 hover:border-blue-500 text-foreground hover:text-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={navigateToSignIn}
          >
            Sign In
            <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
}

function MobileHero({
  reducedMotion,
  navigateToSignUp,
  navigateToSignIn,
}: {
  reducedMotion: boolean;
  navigateToSignUp: () => void;
  navigateToSignIn: () => void;
}) {
  const [showTypingCursor, setShowTypingCursor] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTypingCursor(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 md:hidden">
      {/* Intro badge. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.4,
          ease: [0, 0, 0.2, 1],
        }}
      >
        <Badge className="border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50 rounded-lg">
          Built for focused students
        </Badge>
      </motion.div>

      {/* Main headline. */}
      <div className="space-y-2">
        {["Build unstoppable momentum with", "your complete study workspace"].map(
          (line, idx) => (
            <motion.p
              key={idx}
              className="text-3xl font-bold tracking-tight text-foreground"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.4,
                ease: [0, 0, 0.2, 1],
                delay: reducedMotion ? 0 : 0.4 + idx * 0.08,
              }}
            >
              {line}
              {idx === 1 && showTypingCursor && !reducedMotion && (
                <motion.span
                  className="inline-block ml-2 w-1 h-8 bg-gradient-to-r from-blue-500 to-blue-600"
                  animate={{ opacity: [1, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
              )}
            </motion.p>
          )
        )}
      </div>

      {/* Supporting copy. */}
      <motion.p
        className="text-base text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: reducedMotion ? 0 : 0.4,
          ease: [0, 0, 0.2, 1],
          delay: reducedMotion ? 0 : 0.64,
        }}
      >
        StudyMate helps you turn notes into progress with personalized quizzes,
        revision workflows, and insight-driven study sessions.
      </motion.p>

      {/* Primary action buttons. */}
      <motion.div
        className="flex flex-col gap-3 pt-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.4,
          ease: [0, 0, 0.2, 1],
          delay: reducedMotion ? 0 : 0.8,
        }}
      >
        <Button
          size="lg"
          className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full group"
          onClick={navigateToSignUp}
        >
          Get Started
          <motion.span
            className="ml-2"
            whileHover={reducedMotion ? {} : { x: 4 }}
            transition={{ duration: 0.15 }}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="rounded-lg relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={navigateToSignIn}
        >
          I already have an account
          {!reducedMotion && (
            <motion.span
              className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
              initial={{ scaleX: 0, originX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </Button>
      </motion.div>

      {/* Short feature line. */}
      <motion.div
        className="flex flex-wrap gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: reducedMotion ? 0 : 0.4,
          ease: [0, 0, 0.2, 1],
          delay: reducedMotion ? 0 : 1.0,
        }}
      >
        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-muted-foreground cursor-pointer hover:border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Save study time daily
        </span>
        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-muted-foreground cursor-pointer hover:border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Rocket className="h-4 w-4 text-blue-500" />
          Built for every subject
        </span>
      </motion.div>
    </div>
  );
}

function DesktopHero({
  reducedMotion,
  navigateToSignUp,
  navigateToSignIn,
}: {
  reducedMotion: boolean;
  navigateToSignUp: () => void;
  navigateToSignIn: () => void;
}) {
  const [showTypingCursor, setShowTypingCursor] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTypingCursor(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hidden md:block space-y-6">
      {/* Results badge. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.4,
          ease: [0, 0, 0.2, 1],
        }}
      >
        <Badge className="border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50 rounded-lg">
          Built for focused students
        </Badge>
      </motion.div>

      {/* Staggered proof headline. */}
      <div className="space-y-2">
        <motion.h1
          className="text-5xl font-bold tracking-tight text-foreground"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.4,
            ease: [0, 0, 0.2, 1],
          }}
        >
          Build unstoppable momentum with your
        </motion.h1>

        <div className="relative">
          <motion.div
            className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 bg-clip-text text-transparent text-5xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.4,
              ease: [0, 0, 0.2, 1],
              delay: reducedMotion ? 0 : 0.08,
            }}
          >
            <span>complete study workspace</span>
            {showTypingCursor && !reducedMotion && (
              <motion.span
                className="inline-block ml-3 w-1 h-14 bg-gradient-to-r from-blue-500 to-blue-600"
                animate={{ opacity: [1, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Proof copy. */}
      <motion.p
        className="max-w-xl text-lg text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: reducedMotion ? 0 : 0.4,
          ease: [0, 0, 0.2, 1],
          delay: reducedMotion ? 0 : 0.2,
        }}
      >
        StudyMate helps you turn notes into progress with personalized quizzes,
        revision workflows, and insight-driven study sessions.
      </motion.p>

      {/* Evidence actions. */}
      <motion.div
        className="flex flex-wrap items-center gap-3 pt-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.4,
          ease: [0, 0, 0.2, 1],
          delay: reducedMotion ? 0 : 0.32,
        }}
      >
        <motion.div
          whileHover={
            reducedMotion
              ? {}
              : {
                  boxShadow: "0 4px 20px rgba(59, 130, 246, 0.35)",
                }
          }
          transition={{ duration: 0.2 }}
        >
          <Button
            size="lg"
            className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
            onClick={navigateToSignUp}
          >
            Get Started
            <motion.span
              className="ml-2"
              whileHover={reducedMotion ? {} : { x: 4 }}
              transition={{ duration: 0.15 }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Button>
        </motion.div>

        <Button
          size="lg"
          variant="outline"
          className="rounded-lg relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={navigateToSignIn}
        >
          I already have an account
          {!reducedMotion && (
            <motion.span
              className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
              initial={{ scaleX: 0, originX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </Button>
      </motion.div>

      {/* Supporting evidence line. */}
      <motion.div
        className="flex flex-wrap items-center gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: reducedMotion ? 0 : 0.4,
          ease: [0, 0, 0.2, 1],
          delay: reducedMotion ? 0 : 0.4,
        }}
      >
        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-muted-foreground cursor-pointer hover:border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm">
          <Clock className="h-4 w-4 text-blue-500" />
          Save study time daily
        </span>
        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-muted-foreground cursor-pointer hover:border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm">
          <Rocket className="h-4 w-4 text-blue-500" />
          Built for every subject
        </span>
      </motion.div>
    </div>
  );
}

function FeatureCard({
  feature,
  index,
  reducedMotion,
}: {
  feature: (typeof features)[0];
  index: number;
  reducedMotion: boolean;
}) {
  const isTopStat = index < 2;

  return (
    <motion.div
      variants={itemVariants(reducedMotion)}
      whileHover={
        reducedMotion
          ? {}
          : {
              scale: isTopStat ? 1.03 : 1,
              backgroundColor: "rgba(240, 244, 255, 0.5)",
            }
      }
      transition={{
        duration: reducedMotion ? 0 : 0.15,
      }}
      className="group relative rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {/* Accent stripe. */}
      {!isTopStat && !reducedMotion && (
        <motion.div
          className="absolute left-0 top-0 w-1 bg-blue-500"
          initial={{ scaleY: 0, originY: 0 }}
          whileHover={{ scaleY: 1 }}
          transition={{ duration: 0.15 }}
          style={{ height: "100%" }}
        />
      )}

      {isTopStat ? (
        <div className="text-center">
          <p className="text-4xl md:text-5xl font-bold text-blue-600">
            {index === 0 ? <StatCounter /> : "Goal-first"}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mt-2">
            {index === 0
              ? "Core learning tools"
              : "Study plans that keep you on track"}
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <motion.div
            className={`rounded-full ${feature.color} p-3 flex-shrink-0`}
            whileHover={reducedMotion ? {} : { scale: 1.1 }}
            transition={{ duration: 0.15 }}
          >
            <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm md:text-base">
              {feature.title}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
              {feature.description}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const navigateWithTransition = (path: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    window.setTimeout(() => {
      setLocation(path);
    }, 220);
  };

  const navigateToSignIn = () => navigateWithTransition("/login");
  const navigateToSignUp = () => navigateWithTransition("/login?mode=signup");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Trim the motion a touch on smaller screens.
  const responsive = {
    badge: reducedMotion ? 0 : { duration: 0.34, delay: 0 },
    heading: reducedMotion ? 0 : { duration: 0.34, delay: 0.08 },
    subheading: reducedMotion ? 0 : { duration: 0.34, delay: 0.2 },
    buttons: reducedMotion ? 0 : { duration: 0.34, delay: 0.32 },
    tags: reducedMotion ? 0 : { duration: 0.34, delay: 0.4 },
  };

  const onMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden"
    >
      {/* Hero dot pattern background. */}
      <svg
        className="absolute inset-0 h-full w-full hidden md:block"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='1' fill='%23000' opacity='0.06'/%3E%3C/svg%3E")`,
          backgroundSize: "28px 28px",
          backgroundPosition: "0 0",
          top: 0,
          left: 0,
          right: 0,
          height: "60%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Background glow shapes. */}
      <FloatingBlobs />

      {/* Top navigation. */}
      <NavBar isScrolled={isScrolled} />

      {/* Main page content. */}
      <div className="relative z-10 pt-24 md:pt-28">
        <section className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-16 lg:py-24">
          <div className="grid gap-8 md:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* Hero copy block. */}
            <div>
              <DesktopHero
                reducedMotion={!!reducedMotion}
                navigateToSignUp={navigateToSignUp}
                navigateToSignIn={navigateToSignIn}
              />
              <MobileHero
                reducedMotion={!!reducedMotion}
                navigateToSignUp={navigateToSignUp}
                navigateToSignIn={navigateToSignIn}
              />
            </div>

            {/* Feature grid. */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.5,
                ease: [0, 0, 0.2, 1],
                delay: reducedMotion ? 0 : 0.3,
              }}
            >
              <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">
                  Your study stack in one place
                </h2>

                {/* Two-column stats row. */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    <FeatureCard
                      feature={features[0]}
                      index={0}
                      reducedMotion={!!reducedMotion}
                    />
                  </motion.div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    <FeatureCard
                      feature={features[1]}
                      index={1}
                      reducedMotion={!!reducedMotion}
                    />
                  </motion.div>
                </div>

                {/* Staggered feature rows. */}
                <motion.div
                  className="space-y-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {features.map((feature, index) => (
                    <FeatureCard
                      key={feature.title}
                      feature={feature}
                      index={index + 2}
                      reducedMotion={!!reducedMotion}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
