import { fireInput } from './keyboard.mjs'
import { indentCode, insertTab, outdentCode } from './behaviour.mjs'

export const css = {
	highlight: function(content) {
		if (globalThis.Prism) {
			content = Prism.highlight(content, Prism.languages.css, 'css')
		}
		return content
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
