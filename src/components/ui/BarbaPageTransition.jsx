import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import oscarLogo from '../../assets/ms-removebg-preview.webp';

const transitionEase = [0.76, 0, 0.24, 1];

const BarbaPageTransition = ({ transitionKey }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <motion.div
        key={transitionKey}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[250] grid place-items-center bg-[var(--color-bg)]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
      >
        <img src={oscarLogo} alt="" className="h-20 w-20 object-contain" />
      </motion.div>
    );
  }

  return (
    <motion.div
      key={transitionKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[250] grid place-items-center overflow-hidden bg-[linear-gradient(145deg,#050816_0%,#11143b_42%,#351052_72%,#07172c_100%)]"
      initial={{ y: '0%' }}
      animate={{ y: '-102%' }}
      transition={{ duration: 0.68, delay: 0.42, ease: transitionEase }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgb(34_211_238/0.16),transparent_28%),radial-gradient(circle_at_56%_48%,rgb(192_38_211/0.18),transparent_36%)]" />
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.72, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="absolute h-28 w-28 rounded-full bg-cyan-400/20 blur-3xl" />
        <motion.img
          src={oscarLogo}
          alt=""
          className="relative h-24 w-24 object-contain drop-shadow-[0_0_28px_rgb(34_211_238/0.5)] sm:h-28 sm:w-28"
          initial={{ rotate: -8 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="mt-1 text-center font-['Orbitron']">
          <p className="bg-[linear-gradient(100deg,#fff,#67e8f9_42%,#c084fc_72%,#f0abfc)] bg-clip-text text-lg font-black tracking-[0.28em] text-transparent sm:text-xl">
            OSCAR
          </p>
          <p className="mt-1 text-[0.5rem] font-bold tracking-[0.48em] text-violet-300">
            STORE
          </p>
        </div>
        <motion.span
          className="mt-5 h-0.5 rounded-full bg-[linear-gradient(90deg,transparent,#22d3ee,#c084fc,transparent)]"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 112, opacity: 1 }}
          transition={{ duration: 0.38, delay: 0.08, ease: 'easeOut' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default BarbaPageTransition;
