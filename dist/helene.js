// src/history.mjs
var History = class {
  constructor(options2) {
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
  constructor(selection, content2, replacement) {
    this.selection = selection;
    this.before = content2;
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
    if (el.childElements) {
      for (const child of el.childElements) {
        innerWalk(child);
      }
    }
  };
  for (const child of dom.children) {
    innerWalk(child);
  }
}
var html = {
  highlight: function(content2) {
    if (globalThis.Prism) {
      content2 = Prism.highlight(content2, Prism.languages.html, "html");
    } else {
      content2 = escapeHTML(content2);
    }
    return content2;
  },
  parse: function(content2, options2) {
    options2 = {
      lineNumber: 0,
      ...options2
    };
    const fragment = globalThis.document.createRange().createContextualFragment(content2);
    this.parsedHTML = document.createElement("div");
    this.parsedHTML.appendChild(fragment);
    if (options2.validate) {
      this.clearWarnings("html");
      const constructedLines = this.parsedHTML.innerHTML.split("\n");
      let count = 0;
      for (const line of constructedLines) {
        if (line != this.state.lines[count]) {
          if (!this.state.lines[count].match(/\<script\b/i)) {
            this.addWarning("html", "Invalid HTML", options2.lineNumber + count + 1);
            return;
          }
        }
        count++;
      }
      domWalk(this.textarea.value, (el, lineNumber) => {
        if (el.tagName === "SCRIPT" && !el.src && (!el.type || el.type == "javascript") && el.innerText) {
          javascript.parse(el.innerText, {
            lineNumber: lineNumber + options2.lineNumber,
            ...options2
          });
        } else if (el.tagName === "STYLE") {
        }
      });
    }
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
function escapeHTML(str) {
  return str.replace(/\</g, "&lt;");
}

// src/javascript.mjs
var javascript2 = {
  highlight: function(content2) {
    if (globalThis.Prism) {
      content2 = Prism.highlight(content2, Prism.languages.javascript, "javascript");
    }
    return content2;
  },
  parse: function(content, options) {
    options = {
      lineNumber: 0,
      ...options
    };
    if (options.validate) {
      this.clearWarnings("javascript");
    }
    if (globalThis.acorn) {
      try {
        this.state.parsedJavascript = acorn.parse(content);
      } catch (err) {
        if (options.validate) {
          this.addWarning("javascript", err.message, options.lineNumber + err.loc.line);
        }
      }
    } else {
      try {
        eval(content);
      } catch (err) {
        if (options.validate) {
          this.addWarning("javascript", err.message, options.lineNumber + err.lineNumber);
        }
      }
    }
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
      this.behaviour.indent(this.state.block);
    },
    "shift-tab": function(evt2) {
      if (this.skipNextTab) {
        delete this.skipNextTab;
        return;
      }
      this.behaviour.outdent(this.state.block);
    },
    "control-/": function(evt2) {
      this.behaviour.toggleBlockComments(this.state.block);
    }
  }
};

// src/css.mjs
var css = {
  highlight: function(content2) {
    if (globalThis.Prism) {
      content2 = Prism.highlight(content2, Prism.languages.css, "css");
    }
    return content2;
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

// src/helene.mjs
var Helene = class {
  constructor(options2) {
    if (!options2.textarea) {
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
    this.textarea = simply.dom.signal(options2.textarea);
    options2.textarea.classList.forEach((c) => {
      this.editor.classList.add(c);
    });
    options2.textarea.classList.add("helene-content");
    options2.textarea.parentElement.insertBefore(this.editor, options2.textarea);
    this.el = {
      textarea: options2.textarea,
      scroll: this.editor.querySelector(".helene-scroll"),
      viewpane: this.editor.querySelector(".helene-pane"),
      gutter: this.editor.querySelector(".helene-gutter"),
      status: this.editor.querySelector(".helene-status"),
      highlight: this.editor.querySelector(".helene-highlight"),
      warnings: this.editor.querySelector(".helene-warnings"),
      lines: this.editor.querySelector(".helene-lines"),
      cursor: this.editor.querySelector(".helene-cursor")
    };
    this.el.viewpane.replaceChild(options2.textarea, this.editor.querySelector("textarea"));
    this.history = new History();
    this.state = simply.state.signal({
      options: options2,
      content: this.textarea.value,
      prevContent: this.textarea.value,
      lines: this.textarea.value.split("\n"),
      block: null,
      selection: {
        start: 0,
        end: 0,
        before: [""],
        after: options2.textarea.value.split("\n")
      }
    });
    this.languages = {
      html,
      javascript: javascript2,
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
      let content2 = this.textarea.value;
      let changed = false;
      if (content2 !== this.state.prevContent) {
        changed = true;
        this.state.content = content2;
        if (!this.skipHistory) {
          if (!this.diff) {
            this.diff = new Diff(
              {
                start: this.state.selection.start,
                end: this.state.selection.end
              },
              this.state.prevContent.substring(this.state.selection.start, this.state.selection.end),
              content2.substring(this.state.selection.start, this.el.textarea.selectionEnd)
            );
          } else {
            this.diff.after = content2.substring(this.diff.selection.start, this.el.textarea.selectionEnd);
          }
          if (this.pendingHistory) {
            clearTimeout(this.pendingHistory);
          }
          this.pendingHistory = setTimeout(() => {
            this.updateHistory();
          }, 300);
        }
        this.state.prevContent = content2;
        this.state.lines = content2.split("\n");
      }
      const lang = this.state.languageModule;
      if (this.languages[lang]?.highlight) {
        content2 = this.languages[lang].highlight.call(this, this.textarea.value, options2);
      } else {
        content2 = escapeHTML(content2);
      }
      this.el.highlight.innerHTML = content2;
      if (changed && this.languages[lang]?.parse) {
        this.state.parsedContent = this.languages[lang].parse.call(this, this.textarea.value, options2);
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
  replace(start, end, content2) {
    this.skipHistory = true;
    this.el.textarea.setRangeText(content2, start, end, "end");
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
function helene(options2) {
  return new Helene(options2);
}
export {
  Helene,
  helene as default
};
//# sourceMappingURL=helene.js.map
