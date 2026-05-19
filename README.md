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

To enable syntax highlighting Helene uses [Prism](https://prismjs.com/). Just make sure that it is loaded and Helene will use it. For example:

```html
<link rel="stylesheet" href="https://dev.prismjs.com/themes/prism-cb.css">
<script src="https://dev.prismjs.com/prism.js" data-manual></script>
```

HTML and javascript linting are enabled by default. Javascript linting is done using `eval`, unless you load [Acorn](https://github.com/acornjs/acorn), in which case that is used:

```html
<script type="module">
  import * as acorn from 'https://esm.sh/acorn@8.16.0/es2022/acorn.bundle.mjs'
  globalThis.acorn = acorn
</script>
```
