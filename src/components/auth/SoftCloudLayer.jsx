import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../ui/Button';

const SoftCloudLayer = ({ className, delay = 0 }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={cn('absolute rounded-full blur-3xl', className)}
      animate={reduceMotion ? { opacity: 0.28 } : {
        opacity: [0.2, 0.34, 0.22],
        scale: [1, 1.08, 1],
        x: [0, 10, 0],
        y: [0, -8, 0],
      }}
      transition={{
        duration: 13,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

export default SoftCloudLayer;
