export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1f5fd6',
        'primary-foreground': '#ffffff',
        background: '#f4f7fa',
        foreground: '#16233a',
        surface: '#ffffff',
        border: '#dce4ec',
        'muted-foreground': '#64748b',
        brandink: '#1f5fd6',   // primary blue (buttons, links)
        brandlime: '#0f9d63',  // success green
        ink: '#16233a',        // main text
        canvas: '#f4f7fa',     // page background
        camera: '#0e1622',     // dark scanner area
        warn: '#e8a21a',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '0.9rem', '2xl': '1.25rem' },
      boxShadow: {
        glass: '0 1px 0 rgba(255,255,255,.7) inset, 0 12px 32px -12px rgba(22,35,58,.18)',
        lift: '0 18px 40px -16px rgba(31,95,214,.45)',
      },
      keyframes: {
        scanline: { '0%': { top: '12%' }, '100%': { top: '86%' } },
      },
      animation: { scanline: 'scanline 2.6s cubic-bezier(.32,.72,0,1) infinite alternate' },
    },
  },
  plugins: [],
};
