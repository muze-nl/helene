import { fireInput } from './keyboard.mjs'
import { indentCode, insertTab, outdentCode } from './behaviour.mjs'

export const css = {
	highlight: function(content, options) {
		return this.highlight(content, 'css', options)
	},
	parse: function(content, options) {
		const result = this.validate(content, 'css', options, validateCSS)
		if (result?.parsed) {
			this.state.parsedCSS = result.parsed
		}
		return result
	},
	behaviour: {
		indent: function(block) {
			if (this.state.block) {
				this.blockChange(block.start, block.end, indentCode)
				fireInput(evt)
			} else {
				insertTab.call(this, this.textarea.selectionStart, this.textarea.selectionEnd)
				fireInput(evt)
			}
		},
		outdent: function(block) {
			if (block) {
				this.blockChange(block.start, block.end, outdentCode)
				fireInput(evt)
			}
		}
	},
	keyboard: {
		'escape': function() {
			this.skipNextTab = true
		},
		'tab': function(evt) {
			if (this.skipNextTab) {
				delete this.skipNextTab
				return
			}
			this.behaviour.indent(this.state.block)
		},
		'shift-tab': function(evt) {
			if (this.skipNextTab) {
				delete this.skipNextTab
				return
			}
			this.behaviour.outdent(this.state.block)
		}
	}
}

export function validateCSS(content, options = {})
{
	options = {
		lineNumber: 0,
		...options
	}

	// Browser CSS parsing is intentionally forgiving, so this fallback only catches
	// syntax failures in engines that expose them through constructable stylesheets.
	// Projects that need strict CSS linting should inject a validator.
	if (globalThis.CSSStyleSheet) {
		try {
			const sheet = new globalThis.CSSStyleSheet()
			sheet.replaceSync(content)
			return { parsed: sheet }
		} catch(err) {
			return {
				message: err.message,
				line: options.lineNumber + 1
			}
		}
	}

	return null
}
