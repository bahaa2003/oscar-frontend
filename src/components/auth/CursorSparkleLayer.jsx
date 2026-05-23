import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const randomInRange = (min, max) => min + Math.random() * (max - min);

const canUseCursorSparkles = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.innerWidth >= 768 && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
};

const CursorSparkleLayer = ({
  enabled = true,
  maxSparkles = 16,
  spawnInterval = 72,
  noSparkleSelector = '[data-auth-no-sparkle], input, textarea, select, button, a, label',
}) => {
  const reduceMotion = useReducedMotion();
  const layerRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const [canSparkle, setCanSparkle] = useState(() => enabled && !reduceMotion && canUseCursorSparkles());

  const clearSparkles = useEffectEvent(() => {
    if (layerRef.current) {
      layerRef.current.textContent = '';
    }
  });

  const syncEligibility = useEffectEvent(() => {
    setCanSparkle(enabled && !reduceMotion && canUseCursorSparkles());
  });

  const createSparkle = useEffectEvent((clientX, clientY) => {
    const layer = layerRef.current;
    if (!layer) return;

    while (layer.childElementCount >= maxSparkles && layer.firstChild) {
      layer.removeChild(layer.firstChild);
    }

    const sparkle = document.createElement('span');
    const isGlint = Math.random() > 0.55;
    sparkle.className = `auth-cursor-sparkle${isGlint ? ' auth-cursor-sparkle--glint' : ''}`;
    sparkle.style.setProperty('--auth-sparkle-x', `${(clientX + randomInRange(-18, 18)).toFixed(2)}px`);
    sparkle.style.setProperty('--auth-sparkle-y', `${(clientY + randomInRange(-16, 16)).toFixed(2)}px`);
    sparkle.style.setProperty('--auth-sparkle-size', `${randomInRange(4.8, isGlint ? 7.2 : 6.4).toFixed(2)}px`);
    sparkle.style.setProperty('--auth-sparkle-opacity', `${randomInRange(0.22, isGlint ? 0.52 : 0.4).toFixed(3)}`);
    sparkle.style.setProperty('--auth-sparkle-duration', `${randomInRange(560, 920).toFixed(0)}ms`);
    sparkle.style.setProperty('--auth-sparkle-drift-x', `${randomInRange(-10, 10).toFixed(2)}px`);
    sparkle.style.setProperty('--auth-sparkle-drift-y', `${randomInRange(-18, -8).toFixed(2)}px`);
    sparkle.style.setProperty('--auth-sparkle-rotation', `${randomInRange(-32, 32).toFixed(2)}deg`);

    sparkle.addEventListener('animationend', () => {
      sparkle.remove();
    }, { once: true });

    layer.appendChild(sparkle);
  });

  const handlePointerMove = useEffectEvent((event) => {
    const target = event.target;
    if (target instanceof Element && target.closest(noSparkleSelector)) {
      return;
    }

    const now = performance.now();
    if (now - lastSpawnRef.current < spawnInterval) {
      return;
    }

    lastSpawnRef.current = now;

    const sparkleCount = Math.random() > 0.5 ? 2 : 1;
    for (let index = 0; index < sparkleCount; index += 1) {
      createSparkle(event.clientX, event.clientY);
    }
  });

  useEffect(() => {
    syncEligibility();

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const pointerMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handleChange = () => {
      syncEligibility();
    };

    if (typeof pointerMedia.addEventListener === 'function') {
      pointerMedia.addEventListener('change', handleChange);
    } else if (typeof pointerMedia.addListener === 'function') {
      pointerMedia.addListener(handleChange);
    }

    window.addEventListener('resize', handleChange, { passive: true });

    return () => {
      if (typeof pointerMedia.removeEventListener === 'function') {
        pointerMedia.removeEventListener('change', handleChange);
      } else if (typeof pointerMedia.removeListener === 'function') {
        pointerMedia.removeListener(handleChange);
      }

      window.removeEventListener('resize', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !canSparkle) {
      clearSparkles();
      return undefined;
    }

    const handleMove = (event) => {
      handlePointerMove(event);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handleMove);
      clearSparkles();
    };
  }, [canSparkle, enabled]);

  if (!enabled || !canSparkle) return null;

  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    />
  );
};

export default CursorSparkleLayer;
