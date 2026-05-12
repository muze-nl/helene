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
