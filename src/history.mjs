export default class History
{
	constructor(options) {
		this.undoStack = []
		this.redoStack = []
	}

	undo() {
		if (this.undoStack.length) {
			const change = this.undoStack.pop()
			this.redoStack.push(change)
			change.undo()
		}
	}

	redo() {
		if (this.redoStack.length) {
			const change = this.redoStack.pop()
			this.undoStack.push(change)
			change.redo()
		}
	}

	clear() {
		this.undoStack = []
		this.redoStack = []
	}
}

export class Change
{
	constructor(diff, selection, editor) {
		this.diff = diff
		this.selection = selection,
		this.editor = editor
	}

	undo() {
		this.editor.replace(this.diff.selection.start, this.diff.selection.start + this.diff.after.length, this.diff.before)
		this.editor.select(this.selection.before)
	}

	redo() {
		this.editor.replace(this.diff.selection.start, this.diff.selection.start + this.diff.before.length, this.diff.after)
		this.editor.select(this.selection.after)
	}
}

export class Diff
{
	constructor(selection, content, replacement)
	{
		this.selection = selection
		this.before = content // content of selectionStart-selectionEnd
		this.after = replacement
	}
}
