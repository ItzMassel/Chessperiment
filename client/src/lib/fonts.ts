import localFont from 'next/font/local';

export const lexend = localFont({
  src: [
    {
      path: '../../public/fonts/lexend-400.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/lexend-500.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/lexend-600.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/lexend-700.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/lexend-800.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/lexend-900.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-lexend',
});

export const zillaSlab = localFont({
  src: [
    {
      path: '../../public/fonts/zilla-slab-700.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-zilla-slab',
});

export const bungee = localFont({
  src: [
    {
      path: '../../public/fonts/bungee-400.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-bungee',
});

export const outfit = localFont({
  src: [
    { path: '../../public/fonts/outfit-300.ttf', weight: '300', style: 'normal' },
    { path: '../../public/fonts/outfit-400.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/outfit-500.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/outfit-600.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/outfit-700.ttf', weight: '700', style: 'normal' },
    { path: '../../public/fonts/outfit-800.ttf', weight: '800', style: 'normal' },
    { path: '../../public/fonts/outfit-900.ttf', weight: '900', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-outfit',
});

export const mono = localFont({
  src: [
    { path: '../../public/fonts/jetbrains-mono-400.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/jetbrains-mono-700.ttf', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-mono',
});
