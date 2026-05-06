import { fireInput, indentCode, insertTab, outdentCode } from './keyboard.mjs'

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
		if (el.childElements) {
			for (const child of el.childElements) {
				innerWalk(child)
			}
		}
	}
	for (const child of dom.children) {
		innerWalk(child)
	}
}

export const html = {
	highlight: function(content) {
		if (globalThis.Prism) {
			content = Prism.highlight(content, Prism.languages.html, 'html')
		} else {
			content = escapeHTML(content)
		}
		return content
	},
	parse: function(content, options) {
		options = {
			lineNumber: 0,
			...options
		}
		const fragment = globalThis.document.createRange().createContextualFragment(content)
		this.parsedHTML = document.createElement('div')
		this.parsedHTML.appendChild(fragment)
		if (options.validate) {
			this.clearWarnings('html')
			const constructedLines = this.parsedHTML.innerHTML.split("\n")
			let count = 0
			for (const line of constructedLines) {
				if (line != this.state.lines[count]) {
					if (!this.state.lines[count].match(/\<script\b/i)) {
						this.addWarning('html', 'Invalid HTML', options.lineNumber + count+1)
						return
					}
				}
				count++
			}
			// now check for script tags
			domWalk(this.textarea.value, (el, lineNumber) => {
				if (el.tagName==='SCRIPT' && !el.src && (!el.type || el.type=='javascript') && el.innerText) {
					javascript.parse(el.innerText, {
						lineNumber: lineNumber + options.lineNumber,
						...options
					})
				} else if (el.tagName==='STYLE') {
					// css.parse....
				}
			})
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
		}
	}
}

export function escapeHTML(str)
{
	return str.replace(/\</g, '&lt;')
}