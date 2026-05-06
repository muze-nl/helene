undo/redo
- textarea resets undo stack on each value change, even if using setRangeText
  so helene must implement its own undo/redo stack
- each undo/redo must update the textarea.value, without changing the undo stack itself
- each undo/redo must recover the selection/cursor state as well
- to prevent the stack becoming too large, undo/redo information should be minimal.. diff instead of full content
- undo history shouldn't grow for each character press/input. Either by word or a minimum time between key presses

https://w3c.github.io/input-events/#overview
onbeforeinput
evt.inputType
- historyUndo
- historyRedo
(- insertFromDrop, insertReplacementText)

https://github.com/codemirror/history/blob/main/src/history.ts

class History
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

class Change
{
	constructor(diff, selection, editor) {
		this.diff = diff
		this.selection = selection,
		this.editor = editor
	}

	apply(direction) {
		switch(direction) {
			case 'redo':
				this.editor.replace(this.diff.start, this.diff.before, this.diff.after)
				this.editor.select(this.selection.after)
			break;
			case 'undo':
				this.editor.replace(this.diff.start, this.diff.after, this.diff.before)
				this.editor.select(this.selection.before)
			break;
		}
	}
}

class Diff
{
	constructor(line, column, content, replacement)
	{
		this.start = {
			line,
			column
		}
		this.before = {
			content
		}
		this.after = {
			replacement
		}
	}
}

- oninput register change
	keep track of last contents, each change must set previous textarea contents (just one)
	oninput
		set diff to last contents
		check if lastupdate timestamp > 500 (ms)
		if so, add a new Change to the history
		update last contents, clear diff

	if inputType=='historyUndo'
		undo instead
	if inputType=='historyRedo'
		redo instead
