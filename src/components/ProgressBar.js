export default function ProgressBar() {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50">
      <div className="absolute w-full h-full bg-blue-100"></div>
      <div className="absolute h-full bg-primary animate-indeterminate-progress"></div>
    </div>
  );
}

// Add this to your tailwind.config.js and globals.css
/*
// tailwind.config.js
module.exports = {
  // ...
  theme: {
    extend: {
      animation: {
        'indeterminate-progress': 'indeterminate-progress 1.5s infinite',
      },
      keyframes: {
        'indeterminate-progress': {
          '0%': { left: '-35%', right: '100%' },
          '60%': { left: '100%', right: '-90%' },
          '100%': { left: '100%', right: '-90%' },
        },
      },
    },
  },
  plugins: [],
};

// globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

.animate-indeterminate-progress {
  animation: indeterminate-progress 1.5s infinite;
}
*/
