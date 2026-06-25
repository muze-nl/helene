import { fireInput } from './keyboard.mjs'
import { indentCode, insertTab, outdentCode } from './behaviour.mjs'
import { javascript } from './javascript.mjs'
import { css } from './css.mjs'

export function domWalk(htmlStr, callback)
{
  const dom = globalThis.document.createRange().createContextualFragment(htmlStr)
	const lines = htmlStr.split("\n")
	let lineNumber = 0
	const tagRE = /^[a-zA-Z][a-zA-Z\-]*/
	const tagStack = lines.map(l => l.split('<').map(s => tagRE.exec(s)?.[0]).filter(Boolean))
	let alltags = []
	for (let line=0; line<tagStack.length; line++) {
		for (const tag of tagStack[line]) {
			alltags.push({tag, line})
		}
	}
	const findTag = function(tag) {
		while (alltags.length && alltags[0]?.tag.toUpperCase()!==tag) {
			alltags = alltags.slice(1)
		}
		if (alltags[0]?.tag) {
			const line = alltags[0].line
			alltags = alltags.slice(1)
			return line
		}
	}
	const innerWalk = function(el) {
		lineNumber = findTag(el.tagName)
		callback(el, lineNumber)
		if (el.children) {
			for (const child of el.children) {
				innerWalk(child)
			}
		}
	}
	for (const child of dom.children) {
		innerWalk(child)
	}
}

export const html = {
	highlight: function(content, options) {
		return this.highlight(content, 'html', options)
	},
	parse: function(content, options) {
		const result = this.validate(content, 'html', options, validateHTML)
		if (result?.parsed) {
			this.parsedHTML = result.parsed
		}

		options = {
			lineNumber: 0,
			...options
		}
		if (options.validate) {
			domWalk(this.textarea.value, (el, lineNumber) => {
				if (el.tagName==='SCRIPT' && !el.src && (!el.type || el.type==='javascript' || el.type==='module') && el.innerText) {
					javascript.parse.call(this, el.innerText, {
						lineNumber: lineNumber + options.lineNumber,
						...options
					})
				} else if (el.tagName==='STYLE' && el.innerText) {
					css.parse.call(this, el.innerText, {
						lineNumber: lineNumber + options.lineNumber,
						...options
					})
				}
			})
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

export function validateHTML(content, options = {})
{
	options = {
		lineNumber: 0,
		...options
	}
	const fragment = globalThis.document.createRange().createContextualFragment(content)
	const parsedHTML = document.createElement('div')
	parsedHTML.appendChild(fragment)

	if (options.validate) {
		const constructedLines = parsedHTML.innerHTML.split("\n")
		const sourceLines = content.split("\n")
		let count = 0
		for (const line of constructedLines) {
			if (line != sourceLines[count]) {
				if (!sourceLines[count]?.match(/\<script\b/i)) {
					return {
						message: 'Invalid HTML',
						line: options.lineNumber + count + 1
					}
				}
			}
			count++
		}
	}

	return { parsed: parsedHTML }
}

export function escapeHTML(str)
{
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
}
