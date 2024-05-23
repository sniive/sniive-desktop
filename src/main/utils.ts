import { ChildProcessWithoutNullStreams } from 'child_process'

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
