import { fireInput, indentCode, insertTab, outdentCode, toggleBlockComments } from './keyboard.mjs'

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
	keyboard: {
		'tab': function(evt) {
			if (this.state.block) {
				this.blockChange.call(this, this.state.block.start, this.state.block.end, indentCode)
				fireInput(evt)
			} else {
				insertTab.call(this, this.textarea.selectionStart, this.textarea.selectionEnd)
				fireInput(evt)
			}
		},
		'shift-tab': function(evt) {
			if (this.state.block) {
				this.blockChange.call(this, this.state.block.start, this.state.block.end, outdentCode)
				fireInput(evt)
			}
		},
		'control-/': function(evt) {
			this.blockChange.call(this, this.state.block.start, this.state.block.end, toggleBlockComments)
			fireInput(evt)
		}
	}
}
