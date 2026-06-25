# Helene: small code size code editor for in the browser

Helene was one of the first code editors for the web that included colored syntax highlighting ([2004](https://web.archive.org/web/20040310230659/http://helene.muze.nl/).
Today there are many alternatives, like Monaco (VSCode) or CodeMirror. These have much more advanced features, however that comes with a cost: filesize and complexity.

Today we're again releasing a code editor in the spirit of the original Helene: simple, small, using existing browser features. This is not a code editor
to build a complex IDE around. It is a good option to include in web projects, documentation, etc. 

## Features
- extends existing textarea elements
- optional syntax highlighting (css, javascript, html support out of the box)
- linting (showing syntax errors) for HTML and javascript
- tab support
- indenting/outdenting (using tab/shift-tab)
- comment/uncomment blocks of code
- autogrow up to a limit
- undo/redo history
- easy to extend using signals/effects
  
## Demo

Vist https://muze-nl.github.io/helene/example/ to see Helene in action!

## Usage

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/muze-nl/helene/src/helene.css">
<textarea id="mycode" data-helene-language="javascript">
function foo() {
  console.log('bar')
}
</textarea>
<script type="module">
  import 'https://cdn.jsdelivr.net/gh/simplyedit/simplyflow/src/flow.mjs'
  import helene from "https://cdn.jsdelivr.net/gh/muze-nl/helene/src/helene.mjs"

  helene({
    textarea: document.getElementById('mycode')
  })
</script>
```

Syntax highlighting is optional. Helene has a small highlighter adapter API:

```js
helene({
  textarea: document.getElementById('mycode'),
  highlighter: {
    highlight(code, language) {
      return myHighlighter(code, language) // must return escaped HTML
    }
  }
})
```

For example, with highlight.js:

```js
import hljs from '/lib/highlight.js/core.min.js'
import javascript from '/lib/highlight.js/languages/javascript.min.js'
import css from '/lib/highlight.js/languages/css.min.js'
import xml from '/lib/highlight.js/languages/xml.min.js'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('xml', xml)

helene({
  textarea: document.getElementById('mycode'),
  highlighter: {
    highlight(code, language) {
      return hljs.highlight(code, {
        language: language === 'html' ? 'xml' : language,
        ignoreIllegals: true
      }).value
    }
  }
})
```

If no highlighter is injected, Helene still falls back to a global [Prism](https://prismjs.com/) object when available. If no highlighter is available, Helene safely escapes the source and shows it without colours.

HTML, CSS and JavaScript validation can also be injected. Validators may be a function or an object with a `validate()` method. They should return nothing for valid code, a warning object, an array of warning objects, or `{ warnings: [...] }`. Warning lines are 1-based editor lines.

```js
helene({
  textarea: document.getElementById('mycode'),
  validate: true,
  validators: {
    javascript(code, language, context) {
      try {
        acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' })
      } catch (err) {
        return {
          message: err.message,
          line: context.lineNumber + err.loc.line,
          column: err.loc.column
        }
      }
    },
    html(code) {
      return null
    },
    css(code) {
      return null
    }
  }
})
```

Without an injected validator, JavaScript validation uses a global [Acorn](https://github.com/acornjs/acorn) object when available. If Acorn is not available, Helene uses `new Function()` as a syntax-only fallback. HTML validation uses the browser DOM parser as a small best-effort check. CSS validation is best-effort too, because browser CSS parsers are intentionally forgiving.
