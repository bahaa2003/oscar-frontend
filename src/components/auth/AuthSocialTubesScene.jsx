import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../ui/Button';
import FloatingSocialIcons from './FloatingSocialIcons';
import SoftCloudLayer from './SoftCloudLayer';
import brandIconImage from '../../assets/ms-removebg-preview.webp';

const SceneTube = ({
  className,
  capClassName,
  openingClassName,
  motionAnimate,
  transition,
}) => (
  <motion.div
    aria-hidden="true"
    className={cn('absolute z-10', className)}
    animate={motionAnimate}
    transition={transition}
  >
    <div className="absolute inset-0 rounded-[999px] border border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(135deg,rgba(16,18,24,0.98),rgba(62,46,18,0.9)_42%,rgba(11,12,17,0.98))] shadow-[0_30px_70px_-34px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)]" />
    <div className="absolute inset-[5px] rounded-[999px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_26%),linear-gradient(140deg,rgba(17,19,26,0.96)_0%,rgba(83,63,24,0.86)_40%,rgba(11,12,17,0.98)_100%)]" />
    <div className="absolute inset-y-[18%] left-[12%] w-[38%] rounded-full bg-[linear-gradient(180deg,rgba(243,222,155,0.32),transparent)] blur-md opacity-75" />
    <div className="absolute inset-y-[22%] right-[17%] w-[15%] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(243,222,155,0.02))] blur-sm" />
    <div className={cn('absolute top-1/2 h-[48%] w-[20%] -translate-y-1/2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[linear-gradient(135deg,rgba(72,54,18,0.92),rgba(10,12,18,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]', capClassName)} />
    <div className={cn('absolute top-1/2 h-[24%] w-[10%] -translate-y-1/2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.16)] bg-[#07080b]', openingClassName)} />
  </motion.div>
);

const AuthSocialTubesScene = ({ mode = 'login', className }) => {
  const reduceMotion = useReducedMotion();
  const tubeTransition = {
    duration: 8,
    repeat: Infinity,
    ease: 'easeInOut',
  };
  return (
    <div className={cn(
      'relative w-full overflow-hidden border border-[color:rgb(var(--color-primary-rgb)/0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
      'h-[10.75rem] rounded-[1rem] bg-[radial-gradient(circle_at_top,rgba(243,222,155,0.2),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.16),transparent_28%),linear-gradient(180deg,rgba(255,247,234,0.98),rgba(239,226,198,0.92))] dark:bg-[radial-gradient(circle_at_top,rgba(243,222,155,0.08),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.1),transparent_28%),linear-gradient(180deg,rgba(15,17,23,0.86),rgba(8,9,12,0.64))] sm:h-[14.5rem] sm:rounded-[1.3rem] lg:h-[23rem] lg:rounded-[1.6rem]',
      className
    )}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(125,109,72,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(125,109,72,0.08)_1px,transparent_1px)] bg-[size:34px_34px] opacity-30 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(243,222,155,0.18),transparent_34%)] dark:bg-[radial-gradient(circle_at_50%_35%,rgba(243,222,155,0.1),transparent_34%)]" />

      <SoftCloudLayer
        className="left-[4%] top-[6%] h-28 w-40 bg-[radial-gradient(circle,rgba(243,222,155,0.16),rgba(243,222,155,0.02)_55%,transparent_76%)]"
        delay={0.2}
      />
      <SoftCloudLayer
        className="right-[4%] top-[28%] h-24 w-36 bg-[radial-gradient(circle,rgba(255,255,255,0.08),rgba(243,222,155,0.04)_55%,transparent_74%)]"
        delay={0.9}
      />
      <SoftCloudLayer
        className="bottom-[6%] left-[18%] h-28 w-44 bg-[radial-gradient(circle,rgba(243,222,155,0.18),rgba(243,222,155,0.02)_56%,transparent_76%)]"
        delay={1.3}
      />

      <SceneTube
        className="left-[-12%] top-[10%] h-20 w-[15rem] -rotate-[18deg] sm:h-24 sm:w-[19rem] lg:left-[-8%] lg:top-[9%] lg:h-28 lg:w-[22rem]"
        capClassName="right-[4%]"
        openingClassName="right-[9%]"
        motionAnimate={reduceMotion ? undefined : { y: [0, -4, 0], rotate: [-18, -15, -18] }}
        transition={tubeTransition}
      />
      <SceneTube
        className="bottom-[11%] right-[-12%] h-20 w-[15rem] rotate-[16deg] sm:h-24 sm:w-[19rem] lg:bottom-[10%] lg:right-[-8%] lg:h-28 lg:w-[22rem]"
        capClassName="left-[4%]"
        openingClassName="left-[9%]"
        motionAnimate={reduceMotion ? undefined : { y: [0, 4, 0], rotate: [16, 13, 16] }}
        transition={{ ...tubeTransition, delay: 0.5 }}
      />

      <motion.div
        aria-hidden="true"
        className={cn(
          'absolute left-1/2 top-1/2 z-[15] -translate-x-1/2 -translate-y-1/2',
          'h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem] lg:h-24 lg:w-24'
        )}
        animate={reduceMotion ? undefined : { y: [0, -6, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(243,222,155,0.68),rgba(243,222,155,0.22)_42%,transparent_72%)] blur-[22px]" />
        <div className={cn(
          'relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.26)] bg-[linear-gradient(180deg,rgba(255,250,241,0.95),rgba(231,215,175,0.86))] shadow-[0_18px_42px_-30px_rgba(139,112,45,0.26),inset_0_1px_0_rgba(255,255,255,0.4)] dark:bg-[linear-gradient(180deg,rgba(18,20,26,0.94),rgba(9,10,13,0.9))] dark:shadow-[0_28px_64px_-34px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.06)]',
          'p-2.5'
        )}>
          <div className="absolute inset-[6px] rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.12)]" />
          <img
            src={brandIconImage}
            alt=""
            loading="eager"
            decoding="async"
            className="relative h-full w-full rounded-full object-cover"
          />
        </div>
      </motion.div>

      <FloatingSocialIcons mode={mode} />
    </div>
  );
};

export default AuthSocialTubesScene;
