import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MessageCircle,
  Mic,
  Play,
  Radio,
  Send,
  Video,
} from 'lucide-react';
import { cn } from '../ui/Button';

const iconSets = {
  login: [
    {
      id: 'social',
      Icon: Send,
      label: 'Feed',
      meta: 'Live',
      className: 'left-[10%] top-[18%] sm:left-[14%] lg:left-[12%]',
      delay: 0.2,
    },
    {
      id: 'live',
      Icon: Radio,
      label: 'Live',
      meta: 'On Air',
      className: 'right-[14%] top-[16%] sm:right-[18%] lg:right-[14%]',
      delay: 0.9,
    },
    {
      id: 'chat',
      Icon: MessageCircle,
      label: 'Chat',
      meta: 'Fast',
      className: 'left-[18%] top-[47%] sm:left-[22%] lg:left-[18%]',
      delay: 1.3,
    },
    {
      id: 'voice',
      Icon: Mic,
      label: 'Voice',
      meta: 'Sync',
      className: 'right-[7%] top-[50%] sm:right-[10%] lg:right-[7%]',
      delay: 0.6,
    },
    {
      id: 'video',
      Icon: Video,
      label: 'Video',
      meta: 'HD',
      className: 'left-[28%] bottom-[16%] sm:left-[30%] lg:left-[26%]',
      delay: 1.1,
    },
    {
      id: 'apps',
      Icon: Play,
      label: 'Apps',
      meta: 'New',
      className: 'right-[22%] bottom-[12%] sm:right-[24%] lg:right-[20%]',
      delay: 1.7,
    },
  ],
  register: [
    {
      id: 'social',
      Icon: Send,
      label: 'Start',
      meta: 'Setup',
      className: 'left-[12%] top-[18%] sm:left-[16%] lg:left-[13%]',
      delay: 0.3,
    },
    {
      id: 'live',
      Icon: Radio,
      label: 'Verify',
      meta: 'Ready',
      className: 'right-[10%] top-[19%] sm:right-[14%] lg:right-[11%]',
      delay: 1,
    },
    {
      id: 'chat',
      Icon: MessageCircle,
      label: 'Profile',
      meta: 'Fill',
      className: 'left-[16%] top-[46%] sm:left-[21%] lg:left-[17%]',
      delay: 0.7,
    },
    {
      id: 'voice',
      Icon: Mic,
      label: 'Voice',
      meta: 'Room',
      className: 'right-[5%] top-[51%] sm:right-[8%] lg:right-[6%]',
      delay: 1.5,
    },
    {
      id: 'video',
      Icon: Video,
      label: 'Studio',
      meta: 'Create',
      className: 'left-[29%] bottom-[15%] sm:left-[32%] lg:left-[28%]',
      delay: 1.2,
    },
    {
      id: 'apps',
      Icon: Play,
      label: 'Launch',
      meta: 'Soon',
      className: 'right-[19%] bottom-[11%] sm:right-[23%] lg:right-[19%]',
      delay: 1.8,
    },
  ],
};

const FloatingSocialIcons = ({ mode = 'login' }) => {
  const reduceMotion = useReducedMotion();
  const items = iconSets[mode] || iconSets.login;
  const isLogin = mode === 'login';

  return (
    <>
      {items.map(({ id, Icon, label, meta, className, delay }) => (
        <motion.div
          key={id}
          aria-hidden="true"
          className={cn('absolute z-20', className)}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={reduceMotion ? { opacity: 1, scale: 1, y: 0 } : {
            opacity: [0.86, 1, 0.88],
            scale: [1, 1.03, 1],
            x: [0, 5, 0],
            y: [0, -11, 0],
            rotate: [0, 2, 0],
          }}
          transition={{
            duration: 6.6,
            delay,
            repeat: reduceMotion ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className={cn(
            'relative flex items-center gap-1.5 overflow-hidden border border-[color:rgb(var(--color-primary-rgb)/0.16)] bg-[linear-gradient(180deg,rgba(255,250,241,0.94),rgba(237,225,192,0.86))] shadow-[0_18px_38px_-26px_rgba(139,112,45,0.22),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(17,19,26,0.94),rgba(9,10,13,0.82))] dark:shadow-[0_24px_58px_-30px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.04)]',
            isLogin
              ? 'min-w-[3.2rem] rounded-[0.95rem] px-1.5 py-1.5 sm:min-w-[3.85rem] sm:rounded-[1rem] sm:px-2 sm:py-1.5 lg:min-w-[4.35rem] lg:px-2.5 lg:py-2'
              : 'min-w-[3.2rem] rounded-[0.95rem] px-1.5 py-1.5 sm:min-w-[3.85rem] sm:rounded-[1rem] sm:px-2 sm:py-1.5 lg:min-w-[4.35rem] lg:px-2.5 lg:py-2'
          )}>
            <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top,rgba(125,249,255,0.18),transparent_56%)]" />
            <span className={cn(
              'relative flex items-center justify-center rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.68),rgba(34,211,238,0.12)_44%,rgba(255,248,236,0.9)_100%)] text-[var(--color-primary)] shadow-[0_8px_18px_-14px_rgba(34,211,238,0.46)] dark:bg-[radial-gradient(circle_at_top,rgba(125,249,255,0.18),rgba(34,211,238,0.08)_44%,rgba(10,12,16,0.24)_100%)] dark:text-[#7df9ff] dark:shadow-[0_10px_24px_-16px_rgba(125,249,255,0.75)]',
              isLogin ? 'h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8' : 'h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8'
            )}>
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            </span>
            <span className="relative flex flex-col leading-none">
              <span className="text-[0.46rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)] sm:text-[0.52rem] dark:text-[#f8f1da]/82 lg:text-[0.62rem] lg:tracking-[0.18em]">
                {label}
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-[0.42rem] uppercase tracking-[0.1em] text-[var(--color-muted)] sm:text-[0.46rem] dark:text-[#f8f1da]/52 lg:text-[0.52rem]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] dark:bg-[#7df9ff]" />
                {meta}
              </span>
            </span>
          </div>
        </motion.div>
      ))}
    </>
  );
};

export default FloatingSocialIcons;
