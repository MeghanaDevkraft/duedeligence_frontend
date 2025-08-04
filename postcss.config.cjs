// postcss.config.cjs
module.exports = {
  plugins: [
    require('tailwindcss')('./tailwind.config.js'),
    require('autoprefixer'),
  ],
};
