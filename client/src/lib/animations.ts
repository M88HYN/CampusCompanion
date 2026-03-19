import type { Variants } from "framer-motion";

export const easeOutCurve: [number, number, number, number] = [0, 0, 0.2, 1];

export const pageTransitionDuration = 0.2;
export const modalTransitionDuration = 0.15;
export const modalExitDuration = 0.12;
export const buttonTapDuration = 0.1;
export const toastTransitionDuration = 0.25;

export function getPageVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 1, y: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: 16 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: pageTransitionDuration, ease: easeOutCurve },
    },
    exit: {
      opacity: 0,
      y: 16,
      transition: { duration: pageTransitionDuration, ease: easeOutCurve },
    },
  };
}

export function getStaggerContainerVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1 },
      show: { opacity: 1 },
    };
  }

  return {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
      },
    },
  };
}

export function getStaggerItemVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      show: { opacity: 1, y: 0 },
    };
  }

  return {
    hidden: { opacity: 0, y: 8 },
    show: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15,
        ease: easeOutCurve,
        delay: Math.min(index, 5) * 0.04,
      },
    }),
  };
}