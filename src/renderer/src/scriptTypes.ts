export type KeyAction = {
  action: 'pressed_key' | 'released_key'
  key: string
  time: number
}

export type MouseAction = {
  action: 'clicked' | 'unclicked'
  button: string
  x: number
  y: number
  time: number
}

export type ScrollAction = {
  action: 'scrolled'
  vertical_direction: number
  horizontal_direction: number
  x: number
  y: number
  time: number
}

export type ScriptAction = KeyAction | MouseAction | ScrollAction
