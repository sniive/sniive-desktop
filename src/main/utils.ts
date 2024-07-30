import { is } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { Menu } from 'electron'

const domain = is.dev ? 'http://localhost:3000' : 'https://sniive.com'

export interface Auth {
  spaceName: string
  access: string
  locale?: string
}

export function matchDeepLink(link: string): Auth {
  const regex = /sniive:\/\/(.+)\/(.+)\?access=(.+)/
  const match = link.match(regex)
  if (match && match.length === 4) {
    const spaceName = decodeURI(match[1]).replace(/[/\\]/g, '')
    const access = match[3]
    const locale = match[2]
    return { spaceName, access, locale }
  }
  return { spaceName: '', access: '', locale: '' }
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

type GetUploadLinkSuccess = string
type GetUploadLinkError = { error: { message: string } }
export type GetUploadLinkResponse = GetUploadLinkSuccess | GetUploadLinkError
export function isGetUploadLinkError(
  response: GetUploadLinkResponse
): response is GetUploadLinkError {
  return (response as GetUploadLinkError).error !== undefined
}

type GetUploadLinkParams = {
  spaceName: string
  access: string
  fileExtension: string
}

export async function getUploadLink({
  spaceName,
  access,
  fileExtension
}: GetUploadLinkParams): Promise<GetUploadLinkResponse> {
  return await fetch(`${domain}/api/spaces/${spaceName}/populate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ access, fileExtension })
  })
    .then((res) => res.json())
    .catch((error) => {
      console.error(error)
      return { error: 'Failed to get upload link' }
    })
}

type NotifyRecordingStatusSuccess = true
type NotifyRecordingStatusError = { error: { message: string } }
export type NotifyRecordingStatusResponse =
  | NotifyRecordingStatusSuccess
  | NotifyRecordingStatusError
export function isNotifyRecordingStatusError(
  response: NotifyRecordingStatusResponse
): response is NotifyRecordingStatusError {
  return (response as NotifyRecordingStatusError).error !== undefined
}

export async function notifyRecordingStatus({
  spaceName,
  access,
  status
}: Auth & { status: 'start' | 'stop' }): Promise<NotifyRecordingStatusResponse> {
  return await fetch(`${domain}/api/spaces/${spaceName}/notify-recording-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ access, status })
  })
    .then((res) => res.json())
    .catch((error) => {
      console.error(error)
      return { error: 'Failed to notify recording status' }
    })
}

type RunTutorialSuccess = true
type RunTutorialError = { error: { message: string } }
export type RunTutorialResponse = RunTutorialSuccess | RunTutorialError
export function isRunTutorialError(response: RunTutorialResponse): response is RunTutorialError {
  return (response as RunTutorialError).error !== undefined
}

export async function runTutorial({
  spaceName,
  access,
  metadata
}: Auth & { metadata: any }): Promise<NotifyRecordingStatusResponse> {
  return await fetch(`${domain}/api/spaces/${spaceName}/run-tutorial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ access, metadata: { ...metadata, platform: process.platform } })
  })
    .then((res) => res.json())
    .catch((error) => {
      console.error(error)
      return { error: 'Failed to run tutorial' }
    })
}
