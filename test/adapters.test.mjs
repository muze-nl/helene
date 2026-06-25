import test from 'node:test'
import assert from 'node:assert/strict'
import { Helene, validationWarnings } from '../src/helene.mjs'

function fakeEditor(properties = {}) {
	return Object.assign(Object.create(Helene.prototype), properties)
}

test('highlight uses an injected highlighter object', () => {
	const editor = fakeEditor({
		state: {
			options: {
				highlighter: {
					highlight(code, language) {
						return `<mark data-language="${language}">${code}</mark>`
					}
				}
			}
		}
	})

	assert.equal(
		editor.highlight('const answer = 42', 'javascript'),
		'<mark data-language="javascript">const answer = 42</mark>'
	)
})

test('highlight safely escapes code without a highlighter', () => {
	const editor = fakeEditor({
		state: { options: {} }
	})

	assert.equal(
		editor.highlight('<button>Save</button>', 'html'),
		'&lt;button&gt;Save&lt;/button&gt;'
	)
})

test('validate uses an injected language validator', () => {
	const warnings = []
	const editor = fakeEditor({
		state: {
			options: {
				validators: {
					javascript() {
						return { message: 'Broken JavaScript', line: 3 }
					}
				}
			}
		},
		clearWarnings(type) {
			assert.equal(type, 'javascript')
		},
		addWarning(type, message, line) {
			warnings.push({ type, message, line })
		}
	})

	editor.validate('broken', 'javascript', { validate: true })

	assert.deepEqual(warnings, [
		{ type: 'javascript', message: 'Broken JavaScript', line: 3 }
	])
})

test('validationWarnings accepts common validator return shapes', () => {
	assert.deepEqual(validationWarnings(null), [])
	assert.deepEqual(validationWarnings(true), [])
	assert.deepEqual(validationWarnings('Bad'), ['Bad'])
	assert.deepEqual(validationWarnings({ warnings: ['Bad'] }), ['Bad'])
	assert.deepEqual(validationWarnings([{ message: 'A' }, { warnings: ['B'] }]), [
		{ message: 'A' },
		'B'
	])
})
