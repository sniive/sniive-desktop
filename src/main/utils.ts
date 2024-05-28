import { ChildProcessWithoutNullStreams } from 'child_process'
import { Menu } from 'electron'

export interface Auth {
  spaceName: string
  access: string
}

export function matchDeepLink(link: string): Auth {
  const regex = /sniive:\/\/(.+)\?access=(.+)/
  const match = link.match(regex)
  if (match && match.length === 3) {
    const spaceName = match[1]
    const access = match[2]
    return { spaceName, access }
  }
  return { spaceName: '', access: '' }
}

export function killScriptSubprocess(
  scriptSubprocess: ChildProcessWithoutNullStreams | null
): boolean {
  if (scriptSubprocess) {
    try {
      scriptSubprocess.stdout.removeAllListeners()
      scriptSubprocess.stderr.removeAllListeners()
      const res = scriptSubprocess.kill('SIGTERM')
      scriptSubprocess = null
      return res
    } catch (error) {
      console.error(error)
      return false
    }
  } else {
    return true
  }
}

export async function handleMenu(template: string[]) {
  let result = -1
  const templateWithClick = template.map((label, index) => ({
    label,
    click: (): void => {
      // copy the index to the result (works because of closure)
      result = index
    }
  }))

  const menu = Menu.buildFromTemplate(templateWithClick)
  menu.popup()

  await new Promise((resolve) => {
    menu.once('menu-will-close', () => {
      // wait 100ms to ensure the click event has been processed
      setTimeout(resolve, 100)
    })
  })

  return result
}
