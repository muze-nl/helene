# Helene: small code size code editor for in the browser

Helene was one of the first code editors for the web that included colored syntax highlighting ([2004](https://web.archive.org/web/20040310230659/http://helene.muze.nl/).
Today there are many alternatives, like Monaco (VSCode) or CodeMirror. These have much more advanced features, however that comes with a cost: filesize and complexity.

Today we're again releasing a code editor in the spirit of the original Helene: simple, small, using existing browser features. This is not a code editor
to build a complex IDE around. It is a good option to include in web projects, documentation, etc. 

## Features
- extends existing textarea elements
- optional syntax highlighting (css, javascript, html support out of the box)
- tab support
- indenting/outdenting (using tab/shift-tab)
- comment/uncomment blocks of code
- autogrow up to a limit
- undo/redo history
- easy to extend using signals/effects
  
## Demo

(TBD: see [examples/](./examples/) for now

## Usage

```html
<textarea id="mycode" data-helene-language="javascript">
function foo() {
  console.log('bar')
}
</textarea>
<script type="module">
  import helene from "https://cdn.jsdelivr.net/gh/muze-nl/helene/src/helene.mjs"

  helene({
    textarea: document.getElementById('mycode')
  })
</script>
```

