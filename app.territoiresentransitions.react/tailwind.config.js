module.exports = {
  style:"jit",
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: { colors: {
      // Progress Stat Component
      'progress-nc': "#444",
      'progress-alert': '#DA0505',
      'progress-warning': '#F59E0B',
      'progress-ok': '#FCD34D',
      'progress-good': '#C0D72D',
      'progress-best': "#059669",
      // Misc
      'beige': "#f9f8f6",
      // Design system 
      "bf500": "#000091"
    }},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};

