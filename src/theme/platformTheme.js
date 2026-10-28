// Only the backend's versioned, allowlisted theme schema is accepted here.
// Keeping this mapping explicit also prevents CSS or URL payloads from reaching styles.
const colorMap = {
  primary: '--color-primary', secondary: '--color-secondary', accent: '--color-accent',
  background: '--color-bg', surface: '--color-surface', text: '--color-text',
  mutedText: '--color-text-secondary', border: '--color-border',
};
const rgbMap = {
  primary: '--color-primary-rgb', secondary: '--color-secondary-rgb', accent: '--color-accent-rgb',
  background: '--color-bg-rgb', surface: '--color-surface-rgb', text: '--color-text-rgb',
  border: '--color-border-rgb',
};
const allowedFonts = {
  arabicFont: ['Cairo', 'Tajawal', 'Noto Sans Arabic', 'Almarai', 'Changa', 'IBM Plex Sans Arabic', 'Rubik'],
  englishFont: ['Inter', 'Arial', 'Roboto', 'Poppins', 'Montserrat', 'Outfit', 'Plus Jakarta Sans'],
};
const colorPattern = /^#[0-9A-Fa-f]{6}$/;
const toRgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)).join(' ');
const contrastLight = (hex) => {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.18;
};

export const platformThemeStyles = (configuration, mode = 'light') => {
  const appearance = configuration?.schemaVersion === 2
    ? configuration.modes?.[mode] : configuration;
  if (!appearance || ![1, 2].includes(configuration?.schemaVersion) || !appearance.colors) return {};
  const styles = {};
  for (const [key, property] of Object.entries(colorMap)) {
    const value = appearance.colors[key];
    if (!colorPattern.test(value || '')) return {};
    styles[property] = value;
    if (rgbMap[key]) styles[rgbMap[key]] = toRgb(value);
  }
  const chrome = configuration.schemaVersion === 2 ? configuration.chrome : null;
  for (const [key, layout] of Object.entries({ header: chrome?.header, 'bottom-nav': chrome?.bottomNav })) {
    if (!layout || !/^#[0-9A-Fa-f]{6}$/.test(layout.background || '')
      || !/^#[0-9A-Fa-f]{6}$/.test(layout.foreground || '')
      || !/^#[0-9A-Fa-f]{6}$/.test(layout.accent || '')
      || !Number.isInteger(layout.height) || layout.height < 48 || layout.height > 120
      || !Number.isInteger(layout.width) || layout.width < 60 || layout.width > 100) continue;
    const prefix = key === 'bottom-nav' ? '--platform-bottom-nav' : '--platform-header';
    styles[prefix + '-height'] = layout.height + 'px';
    styles[prefix + '-width'] = layout.width + 'vw';
    styles[prefix + '-background'] = layout.background;
    styles[prefix + '-foreground'] = layout.foreground;
    styles[prefix + '-accent'] = layout.accent;
    styles[prefix + '-radius'] = layout.radius + 'px';
  }
  styles['--color-card'] = appearance.colors.surface;
  styles['--color-card-rgb'] = toRgb(appearance.colors.surface);
  styles['--color-muted'] = appearance.colors.mutedText;
  styles['--color-primary-soft'] = appearance.colors.primary;
  styles['--color-primary-hover'] = appearance.colors.primary;
  styles['--color-button-text'] = contrastLight(appearance.colors.primary) ? '#111827' : '#FFFFFF';
  if (allowedFonts.arabicFont.includes(appearance.typography?.arabicFont)) {
    styles['--platform-font-ar'] = `"${appearance.typography.arabicFont}", sans-serif`;
  }
  if (allowedFonts.englishFont.includes(appearance.typography?.englishFont)) {
    styles['--platform-font-en'] = `"${appearance.typography.englishFont}", sans-serif`;
  }
  if ([14, 16, 18, 20].includes(appearance.typography?.baseSize)) {
    styles['--platform-base-font-size'] = `${appearance.typography.baseSize}px`;
  }
  if ([600, 700, 800].includes(appearance.typography?.headingWeight)) {
    styles['--platform-heading-weight'] = String(appearance.typography.headingWeight);
  }
  if ([0, 4, 8, 12, 24].includes(appearance.buttons?.radius)) {
    styles['--radius-sm'] = `${appearance.buttons.radius}px`;
    styles['--radius-md'] = `${appearance.buttons.radius}px`;
  }
  if ([0, 4, 8, 12, 16, 24].includes(appearance.cards?.radius)) {
    styles['--radius-lg'] = `${appearance.cards.radius}px`;
    styles['--radius-xl'] = `${appearance.cards.radius}px`;
  }
  const neon = appearance.neon || {};
  for (const section of ['purchase', 'hero', 'categories', 'bestSellers']) {
    const effect = neon[section];
    if (effect?.enabled === true && colorPattern.test(effect.color || '') && [3, 5, 8, 12].includes(effect.speed)) {
      styles[`--platform-neon-${section}-color`] = effect.color;
      styles[`--platform-neon-${section}-speed`] = `${effect.speed}s`;
    }
  }  const shadows = {
    none: 'none',
    subtle: '0 12px 30px -18px rgba(15, 23, 42, 0.28)',
    medium: '0 22px 48px -20px rgba(15, 23, 42, 0.38)',
  };
  if (Object.hasOwn(shadows, appearance.cards?.shadow)) {
    styles['--shadow-subtle'] = shadows[appearance.cards.shadow];
    styles['--shadow-medium'] = shadows[appearance.cards.shadow];
  }
  return styles;
};

let appliedProperties = [];
export const isSafeThemeMediaPath = (value) => typeof value === 'string'
  && /^\/uploads\/themes\/[0-9]+-[0-9a-f]{16}\.(?:jpe?g|png|webp)$/i.test(value);

export const applyPublishedPlatformTheme = (configuration, mode = 'light') => {
  const root = document.documentElement;
  appliedProperties.forEach((property) => root.style.removeProperty(property));
  appliedProperties = [];
  root.classList.remove('platform-theme-active', 'platform-theme-compact', 'platform-theme-outline-button');
  const appearance = configuration?.schemaVersion === 2 ? configuration.modes?.[mode] : configuration;
  const styles = platformThemeStyles(configuration, mode);
  if (!Object.keys(styles).length) return;
  Object.entries(styles).forEach(([property, value]) => root.style.setProperty(property, value));
  appliedProperties = Object.keys(styles);
  root.classList.add('platform-theme-active');
  if (appearance?.navigation?.style === 'compact') root.classList.add('platform-theme-compact');
  if (appearance?.buttons?.style === 'outline') root.classList.add('platform-theme-outline-button');
};
