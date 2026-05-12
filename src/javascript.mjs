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
