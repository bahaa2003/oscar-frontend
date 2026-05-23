import React, { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const GOLD_DUST_PALETTE = [
  '#D4AF37',
  '#E7C766',
  'rgba(212,175,55,0.14)',
  'rgba(243,222,155,0.18)',
];

const randomInRange = (min, max) => min + Math.random() * (max - min);

const resolveParticleCount = ({ width, desktopParticleCount, mobileParticleCount, reduceMotion }) => {
  const baseCount = width < 640
    ? mobileParticleCount
    : width < 1024
      ? Math.round((desktopParticleCount + mobileParticleCount) / 2)
      : desktopParticleCount;

  return reduceMotion ? Math.max(8, Math.round(baseCount * 0.65)) : baseCount;
};

const resolveSparkleCount = ({ width, desktopSparkleCount, mobileSparkleCount, reduceMotion }) => {
  const baseCount = width < 640 ? mobileSparkleCount : desktopSparkleCount;
  return reduceMotion ? Math.max(3, Math.round(baseCount * 0.6)) : baseCount;
};

const buildParticles = (count, reduceMotion) => Array.from({ length: count }, (_, index) => {
  const isSoft = Math.random() > 0.68;
  const startScale = randomInRange(0.72, 1);
  const endScale = startScale + randomInRange(0.08, 0.22);
  const baseSize = isSoft
    ? randomInRange(2.2, 4)
    : randomInRange(1.1, 2.4);

  return {
    id: `auth-dust-${index}`,
    isSoft,
    left: `${randomInRange(2, 98).toFixed(2)}%`,
    size: `${baseSize.toFixed(2)}px`,
    blur: `${randomInRange(isSoft ? 1 : 0, isSoft ? 2.2 : 0.8).toFixed(2)}px`,
    opacity: (isSoft ? randomInRange(0.12, 0.22) : randomInRange(0.18, 0.32)).toFixed(3),
    duration: `${randomInRange(reduceMotion ? 26 : 18, reduceMotion ? 36 : 30).toFixed(2)}s`,
    delay: `-${randomInRange(0, 30).toFixed(2)}s`,
    driftMid: `${randomInRange(-18, 18).toFixed(2)}px`,
    driftEnd: `${randomInRange(-34, 34).toFixed(2)}px`,
    startScale: startScale.toFixed(3),
    endScale: endScale.toFixed(3),
    color: GOLD_DUST_PALETTE[index % GOLD_DUST_PALETTE.length],
  };
});

const buildAmbientSparkles = (count, reduceMotion) => Array.from({ length: count }, (_, index) => {
  const isGlint = Math.random() > 0.5;

  return {
    id: `auth-ambient-sparkle-${index}`,
    left: `${randomInRange(6, 94).toFixed(2)}%`,
    top: `${randomInRange(8, 88).toFixed(2)}%`,
    size: `${randomInRange(isGlint ? 5.5 : 3.2, isGlint ? 9 : 5.4).toFixed(2)}px`,
    opacity: `${randomInRange(0.16, isGlint ? 0.38 : 0.28).toFixed(3)}`,
    duration: `${randomInRange(reduceMotion ? 8 : 4.8, reduceMotion ? 13 : 9.5).toFixed(2)}s`,
    delay: `-${randomInRange(0, 12).toFixed(2)}s`,
    driftX: `${randomInRange(-6, 6).toFixed(2)}px`,
    driftY: `${randomInRange(-8, 8).toFixed(2)}px`,
    rotation: `${randomInRange(-25, 25).toFixed(2)}deg`,
    isGlint,
  };
});

const AuthGoldDustBackground = ({
  enabled = true,
  desktopParticleCount = 26,
  mobileParticleCount = 14,
  showAmbientSparkles = true,
  desktopSparkleCount = 10,
  mobileSparkleCount = 5,
}) => {
  const reduceMotion = useReducedMotion();
  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window === 'undefined' ? 1280 : window.innerWidth
  ));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const particles = useMemo(() => {
    if (!enabled) return [];

    const particleCount = resolveParticleCount({
      width: viewportWidth,
      desktopParticleCount,
      mobileParticleCount,
      reduceMotion,
    });

    return buildParticles(particleCount, reduceMotion);
  }, [desktopParticleCount, enabled, mobileParticleCount, reduceMotion, viewportWidth]);

  const sparkles = useMemo(() => {
    if (!enabled || !showAmbientSparkles) return [];

    const sparkleCount = resolveSparkleCount({
      width: viewportWidth,
      desktopSparkleCount,
      mobileSparkleCount,
      reduceMotion,
    });

    return buildAmbientSparkles(sparkleCount, reduceMotion);
  }, [
    desktopSparkleCount,
    enabled,
    mobileSparkleCount,
    reduceMotion,
    showAmbientSparkles,
    viewportWidth,
  ]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="auth-atmosphere auth-atmosphere__base" />
      <div className="auth-atmosphere auth-atmosphere__veil" />
      <div className="auth-atmosphere auth-atmosphere__mesh" />
      <div className="auth-atmosphere__halo auth-atmosphere__halo--left" />
      <div className="auth-atmosphere__halo auth-atmosphere__halo--right" />

      <div className="auth-gold-dust">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={`auth-gold-dust__particle${particle.isSoft ? ' is-soft' : ''}`}
            style={{
              '--auth-dust-left': particle.left,
              '--auth-dust-size': particle.size,
              '--auth-dust-blur': particle.blur,
              '--auth-dust-opacity': particle.opacity,
              '--auth-dust-duration': particle.duration,
              '--auth-dust-delay': particle.delay,
              '--auth-dust-drift-mid': particle.driftMid,
              '--auth-dust-drift-end': particle.driftEnd,
              '--auth-dust-scale-start': particle.startScale,
              '--auth-dust-scale-end': particle.endScale,
              '--auth-dust-color': particle.color,
            }}
          />
        ))}
      </div>

      {showAmbientSparkles && (
        <div className="auth-ambient-sparkles">
          {sparkles.map((sparkle) => (
            <span
              key={sparkle.id}
              className={`auth-ambient-sparkle${sparkle.isGlint ? ' auth-ambient-sparkle--glint' : ''}`}
              style={{
                '--auth-ambient-left': sparkle.left,
                '--auth-ambient-top': sparkle.top,
                '--auth-ambient-size': sparkle.size,
                '--auth-ambient-opacity': sparkle.opacity,
                '--auth-ambient-duration': sparkle.duration,
                '--auth-ambient-delay': sparkle.delay,
                '--auth-ambient-drift-x': sparkle.driftX,
                '--auth-ambient-drift-y': sparkle.driftY,
                '--auth-ambient-rotation': sparkle.rotation,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AuthGoldDustBackground;
