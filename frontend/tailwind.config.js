const plugin = require('tailwindcss/plugin');

module.exports = {
  purge: {
    content: ['./src/**/*.js', './public/index.html'],
    options: {
      safelist: ["border-b-red-900", "w-12", "h-12", "border-4"]
    }
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    borderStyles: {
      colors: true
    },
    extend: {
      colors: {
        grey: {
          900: "#1B1C1D",
          500: "#2E2F30",
          300: "#424242",
        },
        gray: {
          900: "#1B1C1D",
          500: "#2E2F30",
          300: "#424242",
        }
      }
    }
  },
  variants: {
    extend: {
      opacity: ["disabled"]
    }
  },
  plugins: [
    require("tailwindcss-border-styles")()
  ]
}
