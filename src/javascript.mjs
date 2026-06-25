import { fireInput } from './keyboard.mjs'
import { indentCode, insertTab, outdentCode, toggleBlockComments } from './behaviour.mjs'

export const javascript = {
	highlight: function(content) {
		if (globalThis.Prism) {
			content = Prism.highlight(content, Prism.languages.javascript, 'javascript')
		}
		return content
	},
	parse: function(content, options) {
		options = {
			lineNumber: 0,
			...options
		}
		if (options.validate) {
			this.clearWarnings('javascript')
		}
		if (globalThis.acorn) {
			try {
				this.state.parsedJavascript = acorn.parse(content)
			} catch(err) {
				if (options.validate) {
					this.addWarning('javascript', err.message, options.lineNumber + err.loc.line)
				}
			}
		} else {
			try {
				eval(content) // new Function is unreliable
			} catch(err) {
				if (options.validate) {
					this.addWarning('javascript', err.message, options.lineNumber + err.lineNumber)
				}
			}
		}
	},
	behaviour: {
		indent: function(block) {
			if (this.state.block) {
				this.blockChange(block.start, block.end, indentCode)
			} else {
				insertTab.call(this, this.textarea.selectionStart, this.textarea.selectionEnd)
			}
		},
		outdent: function(block) {
			if (block) {
				this.blockChange(block.start, block.end, outdentCode)
			}
		},
		toggleBlockComments: function(block) {
			this.blockChange.call(this, this.state.block.start, this.state.block.end, toggleBlockComments)
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
			javascript.behaviour.indent.call(this, this.state.block)
			fireInput(evt)
		},
		'shift-tab': function(evt) {
			if (this.skipNextTab) {
				delete this.skipNextTab
				return
			}
			javascript.behaviour.outdent.call(this, this.state.block)
			fireInput(evt)
		},
		'control-/': function(evt) {
			javascript.behaviour.toggleBlockComments.call(this, this.state.block)
			fireInput(evt)
		}
	}
}
