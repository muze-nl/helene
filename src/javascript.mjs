import { fireInput } from './keyboard.mjs'
import { indentCode, insertTab, outdentCode, toggleBlockComments } from './behaviour.mjs'

export const javascript = {
	highlight: function(content, options) {
		return this.highlight(content, 'javascript', options)
	},
	parse: function(content, options) {
		const result = this.validate(content, 'javascript', options, validateJavascript)
		if (result?.parsed) {
			this.state.parsedJavascript = result.parsed
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
		},
		toggleBlockComments: function(block) {
			this.blockChange.call(this, this.state.block.start, this.state.block.end, toggleBlockComments)
			fireInput(evt)
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
		},
		'control-/': function(evt) {
			this.behaviour.toggleBlockComments(this.state.block)
		}
	}
}

export function validateJavascript(content, options = {})
{
	options = {
		lineNumber: 0,
		...options
	}

	if (globalThis.acorn) {
		try {
			const parsed = globalThis.acorn.parse(content, {
				ecmaVersion: 'latest',
				sourceType: 'module',
				...(options.acornOptions || {})
			})
			return { parsed }
		} catch(err) {
			return warningFromError(err, options.lineNumber)
		}
	}

	try {
		new Function(content)
		return null
	} catch(err) {
		return warningFromError(err, options.lineNumber)
	}
}

function warningFromError(err, lineNumber = 0)
{
	return {
		message: err.message,
		line: lineNumber + (err.loc?.line || err.lineNumber || 1),
		column: err.loc?.column || err.columnNumber
	}
}
