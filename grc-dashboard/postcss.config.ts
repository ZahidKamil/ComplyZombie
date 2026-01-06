export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}

/*
**What is PostCSS?**
Think of it as a "CSS transformer". It processes your CSS before sending it to the browser.

**The Flow:**

Your CSS (index.css)
    ↓
PostCSS processes it
    ↓
  Plugin 1: @tailwindcss/postcss (converts Tailwind classes to real CSS)
  Plugin 2: autoprefixer (adds browser prefixes like -webkit-, -moz-)
    ↓
Final CSS sent to browser
*/

