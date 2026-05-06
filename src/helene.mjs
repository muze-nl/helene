import history, { Change, Diff } from './history.mjs'
import { html } from './html.mjs'
import { javascript } from './javascript.mjs'
import { css } from './css.mjs'
import { getKeyString } from './keyboard.mjs'

export class Helene
{
	constructor(options)
	{
		if (!options.textarea) {
			throw new Error('Helene: missing options.textarea')
		}
		if (!globalThis.simply?.state) {
			throw new Error('Helene: missing simply.state library')
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
	</div>`

    const fragment = globalThis.document.createRange().createContextualFragment(decoration)
		this.editor = fragment.firstChild
		this.textarea = simply.dom.signal(options.textarea)
		options.textarea.classList.forEach((c) => {
			this.editor.classList.add(c)
		})
		for (const d in options.textarea.dataset) {
			this.editor.dataset[d] = options.textarea.dataset[d]
		}
		options.textarea.classList.add('helene-content')
		options.textarea.parentElement.insertBefore(this.editor, options.textarea)
		this.el = {
			textarea:  options.textarea,
			scroll:    this.editor.querySelector('.helene-scroll'),
			viewpane:  this.editor.querySelector('.helene-pane'),
			gutter:    this.editor.querySelector('.helene-gutter'),
			status:    this.editor.querySelector('.helene-status'),
			highlight: this.editor.querySelector('.helene-highlight'),
			warnings:  this.editor.querySelector('.helene-warnings'),
			lines:     this.editor.querySelector('.helene-lines'),
			cursor:    this.editor.querySelector('.helene-cursor')
		}
		this.el.viewpane.replaceChild(options.textarea, this.editor.querySelector('textarea'))
		this.state = simply.state.signal({
			options,
			prevContent: options.textarea.value,
			lines: options.textarea.value.split("\n")
		})

		this.languages = {
			html,
			javascript,
			css
		}
		simply.state.effect(() => {
			const lang = this.textarea.dataset.heleneLanguage
			if (this.languages[lang]) {
				this.state.languageModule = lang // if we set this to the actual module, the functions get rebound by signal()
			}
		})

		// called whenever this.textarea.value changes, so oninput among others
		simply.state.effect(() => {
			let content = this.textarea.value
			let changed = false
			if (content!==this.state.prevContent) {
				changed = true
				if (!this.skipHistory) {
					// TODO:
					// create a Diff for this change - update if time since last change < x
					// if debounced: create a Change and push it onto the undo stack
				}
				this.state.prevContent = content
				this.state.lines = content.split("\n")
			}
			const lang = this.state.languageModule
			if (this.languages[lang]?.highlight) {
				content = this.languages[lang].highlight.call(this, this.textarea.value, options)
			} else {
				content = escapeHTML(content)
			}
			this.el.highlight.innerHTML = content
			if (changed && this.languages[lang]?.parse) {
				content = this.languages[lang].parse.call(this, this.textarea.value, options)
			}
		})

		simply.state.effect(() => {
			this.el.lines.innerHTML = Array.from(this.state.lines, (_, i) => i+1).join("\n")
		})
		// TODO: explicitly listen to oninput to catch historyRedo/historyUndo evt.inputType

		this.state.selection = null
		this.textarea.addEventListener('selectionchange', (evt) => {
			this.state.selection = {
				start: this.textarea.selectionStart,
				end: this.textarea.selectionEnd,
				before: this.textarea.value.substring(0, this.textarea.selectionStart).split("\n"),
				after: this.textarea.value.substring(this.textarea.selectionEnd).split("\n")
			}
		})
		simply.state.effect(() => {
			const lines = {
				start: this.state.selection?.before.length-1
			}
			lines.end = this.state.lines.length - this.state.selection?.after.length
			if (lines.start == lines.end) {
				this.state.block = null
			} else {
				this.state.block = lines
			}
		})

		this.state.cursor = {
		  line: 1,
		  column: 1
		}
		simply.state.effect(() => {
		  if (this.state.selection?.before) {
		    this.state.cursor = {
		      line: this.state.selection.before.length ?? 1,
		      column: this.state.selection.before[this.state.selection.before.length-1]?.length+1
		    }
		  }
		})
		simply.state.effect(() => {
		  if (this.state.selection?.start!=this.state.selection?.end) {
		    let lines = ''
		    if (this.state.block) {
		      lines = this.state.block.end - this.state.block.start + 1
		      if (lines===1) {
		        lines += ' line, '
		      } else {
		        lines += ' lines, '
		      }
		    }
		    this.el.cursor.innerHTML = lines + (this.state.selection.end - this.state.selection.start) + ' characters selected'
		  } else {
		    this.el.cursor.innerHTML = 'Line '+this.state.cursor.line+', column '+this.state.cursor.column
		  }
		})

		simply.state.effect(() => {
			const lang = this.state.languageModule
			if (lang && this.languages[lang]?.keyboard) {
				this.keyboard = this.languages[lang].keyboard
			}
		})

		this.textarea.helene = this
		this.textarea.addEventListener('keydown', function(evt) {
			const key = getKeyString(evt)
			if (this.helene.keyboard[key]) {
				this.helene.keyboard[key].call(this.helene, evt)
			}
		})
	}

	addWarning(type, message, line, icon=null)
	{
		const warning = document.createElement('span')
		warning.classList.add('helene-warning')
		warning.classList.add('helene-warning-'+type)
		warning.style=`--line: ${line}`
		warning.title = message
		if (!icon) {
			icon = '⚠'
		}
		warning.innerHTML = icon
		this.el.warnings.appendChild(warning)
	}
	
	clearWarnings(type)
	{
		if (!type) {
			this.el.warnings.innerHTML = ''
		} else {
			this.el.warnings.querySelectorAll('.helene-warning-'+type)?.forEach(w => w.remove())
		}
	}

	// needed by undo/redo, update content without triggering history
	replace(start, end, content) {
		this.skipHistory = true
		this.el.textarea.setRangeText(content, start, end, 'end')
		setTimeout(() => {
			this.skipHistory = false
		})
	}

	select(selection) {
		//TODO: check that cursor is scrolled into view
		this.el.textarea.selectionStart = selection.start
		this.el.textarea.selectionEnd = selection.end
	}

	blockChange(start, end, fn)
	{
		const textarea = this.el.textarea
	  const block = this.state.lines.slice(start, end)
	  let outblock, outcount;
	  [ outblock, outcount ] = fn(block)
	  const selection = { start: this.state.selection.start, end: this.state.selection.end}
	  textarea.value = this.state.lines.slice(0, start)
	  	.concat(outblock)
	  	.concat(this.state.lines.slice(end))
	  	.join("\n")
	  textarea.selectionStart = selection.start
	  textarea.selectionEnd = selection.end + outcount
	}
}


export default function helene(options)
{
	return new Helene(options)
}

