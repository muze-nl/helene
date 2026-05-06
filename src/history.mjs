export default class History
{
	constructor(options) {
		this.undo = []
		this.redo = []
		this.applyChange = options.apply
	}

	undo() {
		if (this.undo.length) {
			const change = this.undo.pop()
			this.redo.push(change)
			this.applyChange(change, 'undo')
		}
	}

	redo() {
		if (this.redo.length) {
			const change = this.redo.pop()
			this.undo.push(change)
			this.applyChange(change, 'redo')
		}
	}

	clear() {
		this.undo = []
		this.redo = []
	}
}

export class Change
{
	constructor(diff, selection, editor) {
		this.diff = diff
		this.selection = selection,
		this.editor = editor
	}

	apply(direction) {
		switch(direction) {
			case 'redo':
				this.editor.replace(this.diff.start, this.diff.start + this.diff.before.length, this.diff.after)
				this.editor.select(this.selection.after)
			break;
			case 'undo':
				this.editor.replace(this.diff.start, this.diff.start + this.diff.after.length, this.diff.before)
				this.editor.select(this.selection.before)
			break;
		}
	}
}

export class Diff
{
	constructor(start, content, replacement)
	{
		this.start = start // selectionStart
		this.before = {
			content // content of selectionStart-selectionEnd
		}
		this.after = {
			replacement
		}
	}
}
