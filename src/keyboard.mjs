const KEY = Object.freeze({
  Compose: 229,
  Control: 17,
  Meta:    224,
  Alt:     18,
  Shift:   16
})

export function getKeyString(e)
{
  if (e.isComposing || e.keyCode === KEY.Compose) {
      return
  }
  if (e.defaultPrevented) {
      return
  }
  if (!e.target) {
      return
  }
  let keyCombination = []
  if (e.ctrlKey && e.keyCode!=KEY.Control) {
      keyCombination.push('control')
  }
  if (e.metaKey && e.keyCode!=KEY.Meta) {
      keyCombination.push('meta')
  }
  if (e.altKey && e.keyCode!=KEY.Alt) {
      keyCombination.push('alt')
  }
  if (e.shiftKey && e.keyCode!=KEY.Shift) {
      keyCombination.push('shift')
  }
  keyCombination.push(e.key.toLowerCase())
  return keyCombination.join('-')
}

export function fireInput(evt)
{
  evt.preventDefault()
  evt.target.dispatchEvent(new Event('input', { bubbles: true }));
}

export function insertTab(start, end)
{
	const textarea = this.el.textarea
  textarea.value = textarea.value.substring(0, start) + "\t" + textarea.value.substring(end)
  textarea.selectionStart = start + 1
  textarea.selectionEnd = textarea.selectionStart
}


export function indentCode(block)
{
  let count = 0
  const indented = block.map(line => {
    count++ //inserted characters
    return "\t"+line
  })
  return [ indented, count ]
}

export function outdentCode(block)
{
  let count = 0
  const outdented = block.map(line => {
    if (line[0]==="\t") {
      count-- //removed characters
      return line.substring(1)
    }
    return line
  })
  return [ outdented, count ]
}

export function toggleBlockComments(block)
{
  if (block[0].substring(0,3)=="//\t") {
    return uncommentBlock(block)
  } else {
    return commentBlock(block)
  }
}

export function commentBlock(block)
{
  let count = 0
  block = block.map(line => {
    count += 3
    return "//\t" + line
  })
  return [block, count]
}

export function uncommentBlock(block)
{
  let count = 0
  block = block.map(line => {
    if (line.substring(0,3)=="//\t") {
      line = line.substring(3)
      count -= 3
    }
    return line
  })
  return [block, count]
}
