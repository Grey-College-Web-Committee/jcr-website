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
    extend: {},
    borderStyles: {
      colors: true
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
