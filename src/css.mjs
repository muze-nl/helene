import { fireInput, indentCode, insertTab, outdentCode } from './keyboard.mjs'

export const css = {
	highlight: function(content) {
		if (globalThis.Prism) {
			content = Prism.highlight(content, Prism.languages.css, 'css')
		}
		return content
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
		}
	}
}
