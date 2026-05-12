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

