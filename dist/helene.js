// src/history.mjs
var History = class {
  constructor(options) {
    this.undoStack = [];
    this.redoStack = [];
  }
  undo() {
    if (this.undoStack.length) {
      const change = this.undoStack.pop();
      this.redoStack.push(change);
      change.undo();
    }
  }
  redo() {
    if (this.redoStack.length) {
      const change = this.redoStack.pop();
      this.undoStack.push(change);
      change.redo();
    }
  }
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
};
var Change = class {
  constructor(diff, selection, editor) {
    this.diff = diff;
    this.selection = selection, this.editor = editor;
  }
  undo() {
    this.editor.replace(this.diff.selection.start, this.diff.selection.start + this.diff.after.length, this.diff.before);
    this.editor.select(this.selection.before);
  }
  redo() {
    this.editor.replace(this.diff.selection.start, this.diff.selection.start + this.diff.before.length, this.diff.after);
    this.editor.select(this.selection.after);
  }
};
var Diff = class {
  constructor(selection, content, replacement) {
    this.selection = selection;
    this.before = content;
    this.after = replacement;
  }
};

// src/keyboard.mjs
var KEY = Object.freeze({
  Compose: 229,
  Control: 17,
  Meta: 224,
  Alt: 18,
  Shift: 16
});
function getKeyString(e) {
  if (e.isComposing || e.keyCode === KEY.Compose) {
    return;
  }
  if (e.defaultPrevented) {
    return;
  }
  if (!e.target) {
    return;
  }
  let keyCombination = [];
  if (e.ctrlKey && e.keyCode != KEY.Control) {
    keyCombination.push("control");
  }
  if (e.metaKey && e.keyCode != KEY.Meta) {
    keyCombination.push("meta");
  }
  if (e.altKey && e.keyCode != KEY.Alt) {
    keyCombination.push("alt");
  }
  if (e.shiftKey && e.keyCode != KEY.Shift) {
    keyCombination.push("shift");
  }
  keyCombination.push(e.key.toLowerCase());
  return keyCombination.join("-");
}
function fireInput(evt2) {
  evt2.preventDefault();
  evt2.target.dispatchEvent(new Event("input", { bubbles: true }));
}

// src/behaviour.mjs
function insertTab(start, end) {
  const textarea = this.el.textarea;
  textarea.value = textarea.value.substring(0, start) + "	" + textarea.value.substring(end);
  textarea.selectionStart = start + 1;
  textarea.selectionEnd = textarea.selectionStart;
}
function indentCode(block) {
  let count = 0;
  const indented = block.map((line) => {
    count++;
    return "	" + line;
  });
  return [indented, count];
}
function outdentCode(block) {
  let count = 0;
  const outdented = block.map((line) => {
    if (line[0] === "	") {
      count--;
      return line.substring(1);
    }
    return line;
  });
  return [outdented, count];
}
function toggleBlockComments(block) {
  if (block[0].substring(0, 3) == "//	") {
    return uncommentBlock(block);
  } else {
    return commentBlock(block);
  }
}
function commentBlock(block) {
  let count = 0;
  block = block.map((line) => {
    count += 3;
    return "//	" + line;
  });
  return [block, count];
}
function uncommentBlock(block) {
  let count = 0;
  block = block.map((line) => {
    if (line.substring(0, 3) == "//	") {
      line = line.substring(3);
      count -= 3;
    }
    return line;
  });
  return [block, count];
}

// src/javascript.mjs
var javascript = {
  highlight: function(content, options) {
    return this.highlight(content, "javascript", options);
  },
  parse: function(content, options) {
    const result = this.validate(content, "javascript", options, validateJavascript);
    if (result?.parsed) {
      this.state.parsedJavascript = result.parsed;
    }
    return result;
  },
  behaviour: {
    indent: function(block) {
      if (this.state.block) {
        this.blockChange(block.start, block.end, indentCode);
      } else {
        insertTab.call(this, this.textarea.selectionStart, this.textarea.selectionEnd);
      }
    },
    outdent: function(block) {
      if (block) {
        this.blockChange(block.start, block.end, outdentCode);
      }
    },
    toggleBlockComments: function(block) {
      this.blockChange.call(this, this.state.block.start, this.state.block.end, toggleBlockComments);
      fireInput(evt);
    }
  },
  keyboard: {
    "escape": function() {
      this.skipNextTab = true;
    },
    "tab": function(evt2) {
      if (this.skipNextTab) {
        delete this.skipNextTab;
        return;
      }
      javascript.behaviour.indent(this.state.block);
      fireInput(evt2);
    },
    "shift-tab": function(evt2) {
      if (this.skipNextTab) {
        delete this.skipNextTab;
        return;
      }
      javascript.behaviour.outdent(this.state.block);
      fireInput(evt2);
    },
    "control-/": function(evt2) {
      javascript.behaviour.toggleBlockComments(this.state.block);
      fireInput(evt2);
    }
  }
};
function validateJavascript(content, options = {}) {
  options = {
    lineNumber: 0,
    ...options
  };
  if (globalThis.acorn) {
    try {
      const parsed = globalThis.acorn.parse(content, {
        ecmaVersion: "latest",
        sourceType: "module",
        ...options.acornOptions || {}
      });
      return { parsed };
    } catch (err) {
      return warningFromError(err, options.lineNumber);
    }
  }
  try {
    new Function(content);
    return null;
  } catch (err) {
    return warningFromError(err, options.lineNumber);
  }
}
function warningFromError(err, lineNumber = 0) {
  return {
    message: err.message,
    line: lineNumber + (err.loc?.line || err.lineNumber || 1),
    column: err.loc?.column || err.columnNumber
  };
}

// src/css.mjs
var css = {
  highlight: function(content, options) {
    return this.highlight(content, "css", options);
  },
  parse: function(content, options) {
    const result = this.validate(content, "css", options, validateCSS);
    if (result?.parsed) {
      this.state.parsedCSS = result.parsed;
    }
    return result;
  },
  behaviour: {
    indent: function(block) {
      if (this.state.block) {
        this.blockChange(block.start, block.end, indentCode);
        fireInput(evt);
      } else {
        insertTab.call(this, this.textarea.selectionStart, this.textarea.selectionEnd);
        fireInput(evt);
      }
    },
    outdent: function(block) {
      if (block) {
        this.blockChange(block.start, block.end, outdentCode);
        fireInput(evt);
      }
    }
  },
  keyboard: {
    "escape": function() {
      this.skipNextTab = true;
    },
    "tab": function(evt2) {
      if (this.skipNextTab) {
        delete this.skipNextTab;
        return;
      }
      this.behaviour.indent(this.state.block);
    },
    "shift-tab": function(evt2) {
      if (this.skipNextTab) {
        delete this.skipNextTab;
        return;
      }
      this.behaviour.outdent(this.state.block);
    }
  }
};
function validateCSS(content, options = {}) {
  options = {
    lineNumber: 0,
    ...options
  };
  if (globalThis.CSSStyleSheet) {
    try {
      const sheet = new globalThis.CSSStyleSheet();
      sheet.replaceSync(content);
      return { parsed: sheet };
    } catch (err) {
      return {
        message: err.message,
        line: options.lineNumber + 1
      };
    }
  }
  return null;
}

// src/html.mjs
function domWalk(htmlStr, callback) {
  const dom = globalThis.document.createRange().createContextualFragment(htmlStr);
  const lines = htmlStr.split("\n");
  let lineNumber = 0;
  const tagRE = /^[a-zA-Z][a-zA-Z\-]*/;
  const tagStack = lines.map((l) => l.split("<").map((s) => tagRE.exec(s)?.[0]).filter(Boolean));
  let alltags = [];
  for (let line = 0; line < tagStack.length; line++) {
    for (const tag of tagStack[line]) {
      alltags.push({ tag, line });
    }
  }
  const findTag = function(tag) {
    while (alltags.length && alltags[0]?.tag.toUpperCase() !== tag) {
      alltags = alltags.slice(1);
    }
    if (alltags[0]?.tag) {
      const line = alltags[0].line;
      alltags = alltags.slice(1);
      return line;
    }
  };
  const innerWalk = function(el) {
    lineNumber = findTag(el.tagName);
    callback(el, lineNumber);
    if (el.children) {
      for (const child of el.children) {
        innerWalk(child);
      }
    }
  };
  for (const child of dom.children) {
    innerWalk(child);
  }
}
var html = {
  highlight: function(content, options) {
    return this.highlight(content, "html", options);
  },
  parse: function(content, options) {
    const result = this.validate(content, "html", options, validateHTML);
    if (result?.parsed) {
      this.parsedHTML = result.parsed;
    }
    options = {
      lineNumber: 0,
      ...options
    };
    if (options.validate) {
      domWalk(this.textarea.value, (el, lineNumber) => {
        if (el.tagName === "SCRIPT" && !el.src && (!el.type || el.type === "javascript" || el.type === "module") && el.innerText) {
          javascript.parse.call(this, el.innerText, {
            lineNumber: lineNumber + options.lineNumber,
            ...options
          });
        } else if (el.tagName === "STYLE" && el.innerText) {
          css.parse.call(this, el.innerText, {
            lineNumber: lineNumber + options.lineNumber,
            ...options
          });
        }
      });
    }
    return result;
  },
  behaviour: {
    indent: function(block) {
      if (this.state.block) {
        this.blockChange(block.start, block.end, indentCode);
        fireInput(evt);
      } else {
        insertTab.call(this, this.textarea.selectionStart, this.textarea.selectionEnd);
        fireInput(evt);
      }
    },
    outdent: function(block) {
      if (block) {
        this.blockChange(block.start, block.end, outdentCode);
        fireInput(evt);
      }
    }
  },
  keyboard: {
    "escape": function() {
      this.skipNextTab = true;
    },
    "tab": function(evt2) {
      if (this.skipNextTab) {
        delete this.skipNextTab;
        return;
      }
      this.behaviour.indent(this.state.block);
    },
    "shift-tab": function(evt2) {
      if (this.skipNextTab) {
        delete this.skipNextTab;
        return;
      }
      this.behaviour.outdent(this.state.block);
    }
  }
};
function validateHTML(content, options = {}) {
  options = {
    lineNumber: 0,
    ...options
  };
  const fragment = globalThis.document.createRange().createContextualFragment(content);
  const parsedHTML = document.createElement("div");
  parsedHTML.appendChild(fragment);
  if (options.validate) {
    const constructedLines = parsedHTML.innerHTML.split("\n");
    const sourceLines = content.split("\n");
    let count = 0;
    for (const line of constructedLines) {
      if (line != sourceLines[count]) {
        if (!sourceLines[count]?.match(/\<script\b/i)) {
          return {
            message: "Invalid HTML",
            line: options.lineNumber + count + 1
          };
        }
      }
      count++;
    }
  }
  return { parsed: parsedHTML };
}
function escapeHTML(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// src/helene.mjs
var Helene = class {
  constructor(options) {
    if (!options.textarea) {
      throw new Error("Helene: missing options.textarea");
    }
    if (!globalThis.simply?.state) {
      throw new Error("Helene: missing simply.state library");
    }
    const decoration = `<div class="helene">
		<div class="helene-scroll">
			<div class="helene-gutter">
				<div class="helene-warnings"></div>
				<div class="helene-lines"></div>
			</div>
			<div class="helene-pane">
				<pre class="helene-highlight"></pre>
				<textarea></textarea>
			</div>
		</div>
		<div class="helene-status">
			<div class="helene-cursor"></div>
		</div>
	</div>`;
    const fragment = globalThis.document.createRange().createContextualFragment(decoration);
    this.editor = fragment.firstChild;
    this.textarea = simply.dom.signal(options.textarea);
    options.textarea.classList.forEach((c) => {
      this.editor.classList.add(c);
    });
    options.textarea.classList.add("helene-content");
    options.textarea.parentElement.insertBefore(this.editor, options.textarea);
    this.el = {
      textarea: options.textarea,
      scroll: this.editor.querySelector(".helene-scroll"),
      viewpane: this.editor.querySelector(".helene-pane"),
      gutter: this.editor.querySelector(".helene-gutter"),
      status: this.editor.querySelector(".helene-status"),
      highlight: this.editor.querySelector(".helene-highlight"),
      warnings: this.editor.querySelector(".helene-warnings"),
      lines: this.editor.querySelector(".helene-lines"),
      cursor: this.editor.querySelector(".helene-cursor")
    };
    this.el.viewpane.replaceChild(options.textarea, this.editor.querySelector("textarea"));
    this.history = new History();
    this.state = simply.state.signal({
      options,
      content: this.textarea.value,
      prevContent: this.textarea.value,
      lines: this.textarea.value.split("\n"),
      block: null,
      selection: {
        start: 0,
        end: 0,
        before: [""],
        after: options.textarea.value.split("\n")
      }
    });
    this.languages = {
      html,
      javascript,
      css
    };
    this.keyboard = {};
    simply.state.effect(() => {
      const lang = this.textarea.dataset.heleneLanguage;
      if (this.languages[lang]) {
        this.state.languageModule = lang;
      }
    });
    simply.state.effect(() => {
      let content = this.textarea.value;
      let changed = false;
      if (content !== this.state.prevContent) {
        changed = true;
        this.state.content = content;
        if (!this.skipHistory) {
          if (!this.diff) {
            this.diff = new Diff(
              {
                start: this.state.selection.start,
                end: this.state.selection.end
              },
              this.state.prevContent.substring(this.state.selection.start, this.state.selection.end),
              content.substring(this.state.selection.start, this.el.textarea.selectionEnd)
            );
          } else {
            this.diff.after = content.substring(this.diff.selection.start, this.el.textarea.selectionEnd);
          }
          if (this.pendingHistory) {
            clearTimeout(this.pendingHistory);
          }
          this.pendingHistory = setTimeout(() => {
            this.updateHistory();
          }, 300);
        }
        this.state.prevContent = content;
        this.state.lines = content.split("\n");
      }
      const lang = this.state.languageModule;
      if (this.languages[lang]?.highlight) {
        content = this.languages[lang].highlight.call(this, this.textarea.value, options);
      } else {
        content = escapeHTML(content);
      }
      this.el.highlight.innerHTML = content;
      if (changed && this.languages[lang]?.parse) {
        this.state.parsedContent = this.languages[lang].parse.call(this, this.textarea.value, options);
      }
    });
    simply.state.effect(() => {
      this.el.lines.innerHTML = Array.from(this.state.lines, (_, i) => i + 1).join("\n");
    });
    this.textarea.addEventListener("selectionchange", (evt2) => {
      this.state.selection = {
        start: this.textarea.selectionStart,
        end: this.textarea.selectionEnd,
        before: this.textarea.value.substring(0, this.textarea.selectionStart).split("\n"),
        after: this.textarea.value.substring(this.textarea.selectionEnd).split("\n")
      };
    });
    simply.state.effect(() => {
      const lines = {
        start: this.state.selection?.before.length - 1
      };
      lines.end = this.state.lines.length - this.state.selection?.after.length;
      if (lines.start == lines.end) {
        this.state.block = null;
      } else {
        this.state.block = lines;
      }
    });
    this.state.cursor = {
      line: 1,
      column: 1
    };
    simply.state.effect(() => {
      if (this.state.selection?.before) {
        this.state.cursor = {
          line: this.state.selection.before.length ?? 1,
          column: this.state.selection.before[this.state.selection.before.length - 1]?.length + 1
        };
      }
    });
    simply.state.effect(() => {
      if (this.state.selection?.start != this.state.selection?.end) {
        let lines = "";
        if (this.state.block) {
          lines = this.state.block.end - this.state.block.start + 1;
          if (lines === 1) {
            lines += " line, ";
          } else {
            lines += " lines, ";
          }
        }
        this.el.cursor.innerHTML = lines + (this.state.selection.end - this.state.selection.start) + " characters selected";
      } else {
        this.el.cursor.innerHTML = "Line " + this.state.cursor.line + ", column " + this.state.cursor.column;
      }
    });
    simply.state.effect(() => {
      const lang = this.state.languageModule;
      if (lang && this.languages[lang]?.keyboard) {
        this.keyboard = this.languages[lang].keyboard;
      }
    });
    this.textarea.helene = this;
    this.textarea.addEventListener("keydown", (evt2) => {
      this.inputFired = false;
      const key = getKeyString(evt2);
      if (this.keyboard[key]) {
        this.keyboard[key].call(this, evt2);
      } else {
        switch (key) {
          case "control-z":
          case "command-z":
            this.history.undo();
            evt2.preventDefault();
            break;
          case "control-y":
          case "control-shift-z":
          case "command-y":
            this.history.redo();
            evt2.preventDefault();
            break;
        }
      }
    });
    this.textarea.addEventListener("input", (evt2) => {
      this.inputFired = true;
    });
    this.textarea.addEventListener("keyup", (evt2) => {
      if (!this.inputFired) {
        this.updateHistory();
      }
      this.inputFired = false;
    });
  }
  getHighlighter(options = {}) {
    return options.highlighter || this.state.options.highlighter || globalThis.heleneHighlighter;
  }
  highlight(content, language, options = {}) {
    const highlighter = this.getHighlighter(options);
    const context = {
      editor: this,
      language,
      options
    };
    if (typeof highlighter === "function") {
      return highlighter(content, language, context);
    }
    if (highlighter?.highlight) {
      return highlighter.highlight(content, language, context);
    }
    if (globalThis.Prism) {
      const prismLanguage = prismLanguageFor(language);
      const grammar = globalThis.Prism.languages?.[prismLanguage] || (language === "html" ? globalThis.Prism.languages?.markup : null);
      if (grammar) {
        return globalThis.Prism.highlight(content, grammar, prismLanguage);
      }
    }
    return escapeHTML(content);
  }
  getValidator(language, options = {}) {
    const validators = options.validators || this.state.options.validators || globalThis.heleneValidators;
    if (validators) {
      if (validators[language]) {
        return validators[language];
      }
      if (validators.validate || typeof validators === "function") {
        return validators;
      }
    }
    return options.validator || this.state.options.validator || globalThis.heleneValidator;
  }
  validate(content, language, options = {}, fallback = null) {
    options = {
      lineNumber: 0,
      ...options
    };
    const validator = this.getValidator(language, options);
    const context = {
      editor: this,
      language,
      lineNumber: options.lineNumber,
      options,
      addWarning: (warning) => this.reportWarning(language, warning, options)
    };
    if (options.validate) {
      this.clearWarnings(language);
    }
    let result;
    try {
      if (validator) {
        result = runValidator(validator, content, language, context);
      } else if (fallback) {
        result = fallback.call(this, content, options, context);
      }
    } catch (err) {
      result = err;
    }
    if (options.validate) {
      this.reportValidationResult(language, result, options);
    }
    return result;
  }
  reportValidationResult(language, result, options = {}) {
    for (const warning of validationWarnings(result)) {
      this.reportWarning(language, warning, options);
    }
  }
  reportWarning(language, warning, options = {}) {
    if (!warning) {
      return;
    }
    if (typeof warning === "string") {
      warning = { message: warning };
    }
    if (warning instanceof Error) {
      warning = {
        message: warning.message,
        line: options.lineNumber + (warning.loc?.line || warning.lineNumber || 1),
        column: warning.loc?.column || warning.columnNumber
      };
    }
    const type = warning.type || language;
    const line = warning.line || options.lineNumber + 1;
    this.addWarning(type, warning.message || String(warning), line, warning.icon);
  }
  addWarning(type, message, line, icon = null) {
    const warning = document.createElement("span");
    warning.classList.add("helene-warning");
    warning.classList.add("helene-warning-" + type);
    warning.style = `--line: ${line}`;
    warning.title = message;
    if (!icon) {
      icon = "\u26A0";
    }
    warning.innerHTML = icon;
    this.el.warnings.appendChild(warning);
  }
  clearWarnings(type) {
    if (!type) {
      this.el.warnings.innerHTML = "";
    } else {
      this.el.warnings.querySelectorAll(".helene-warning-" + type)?.forEach((w) => w.remove());
    }
  }
  // needed by undo/redo, update content without triggering history
  replace(start, end, content) {
    this.skipHistory = true;
    this.el.textarea.setRangeText(content, start, end, "end");
    setTimeout(() => {
      this.skipHistory = false;
    });
  }
  select(selection) {
    this.el.textarea.selectionStart = selection.start;
    this.el.textarea.selectionEnd = selection.end;
  }
  blockChange(start, end, fn) {
    const textarea = this.el.textarea;
    const block = this.state.lines.slice(start, end);
    let outblock, outcount;
    [outblock, outcount] = fn(block);
    const selection = { start: this.state.selection.start, end: this.state.selection.end };
    textarea.value = this.state.lines.slice(0, start).concat(outblock).concat(this.state.lines.slice(end)).join("\n");
    textarea.selectionStart = selection.start;
    textarea.selectionEnd = selection.end + outcount;
  }
  updateHistory() {
    if (this.diff) {
      const change = new Change(
        this.diff,
        {
          before: this.diff.selection,
          after: {
            start: this.el.textarea.selectionStart,
            end: this.el.textarea.selectionEnd
          }
        },
        this
      );
      this.history.undoStack.push(change);
      this.history.redoStack = [];
    }
    this.diff = null;
    clearTimeout(this.pendingHistory);
  }
};
function runValidator(validator, content, language, context) {
  if (typeof validator === "function") {
    return validator(content, language, context);
  }
  if (validator?.validate) {
    return validator.validate(content, language, context);
  }
  throw new Error("Helene: validator must be a function or an object with a validate method");
}
function validationWarnings(result) {
  if (!result || result === true) {
    return [];
  }
  if (Array.isArray(result)) {
    return result.flatMap(validationWarnings);
  }
  if (result instanceof Error || typeof result === "string") {
    return [result];
  }
  if (result.warnings) {
    return validationWarnings(result.warnings);
  }
  if (result.message) {
    return [result];
  }
  if (result === false) {
    return ["Invalid code"];
  }
  return [];
}
function prismLanguageFor(language) {
  if (language === "html") {
    return "html";
  }
  if (language === "js") {
    return "javascript";
  }
  return language;
}
function helene(options) {
  return new Helene(options);
}
export {
  Helene,
  helene as default,
  validationWarnings
};
//# sourceMappingURL=helene.js.map
