import { is } from '@electron-toolkit/utils'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { App, Menu } from 'electron'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'

const domain = is.dev ? 'http://localhost:3000' : 'https://sniive.com'

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

type GetUploadLinkSuccess = { uploadLink: string }
type GetUploadLinkError = { error: string }
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

export async function getUploadLink(params: GetUploadLinkParams): Promise<GetUploadLinkResponse> {
  return await fetch(`${domain}/api/dashboard/populateSpace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  }).then((res) => res.json())
}

type NotifyRecordingStatusSuccess = { status: 'success' }
type NotifyRecordingStatusError = { error: string }
export type NotifyRecordingStatusResponse =
  | NotifyRecordingStatusSuccess
  | NotifyRecordingStatusError
export function isNotifyRecordingStatusError(
  response: NotifyRecordingStatusResponse
): response is NotifyRecordingStatusError {
  return (response as NotifyRecordingStatusError).error !== undefined
}

export async function notifyRecordingStatus(
  params: Auth & { status: 'start' | 'stop' }
): Promise<NotifyRecordingStatusResponse> {
  return await fetch(`${domain}/api/dashboard/notifyRecordingStatus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  }).then((res) => res.json())
}

export async function convertWebmToWav(audioBuffer: ArrayBuffer, app: App): Promise<Buffer> {
  if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic.replace('app.asar', 'app.asar.unpacked'))
  }

  ffmpeg.setFfprobePath(ffprobeStatic.path.replace('app.asar', 'app.asar.unpacked'))

  // get "userData" path
  const tempPath = app.getPath('temp')

  // create temporary files
  const inputPath = path.join(tempPath, 'input.webm')
  const outputPath = path.join(tempPath, 'output.wav')

  // write the audio buffer to the temporary file
  await fs.promises.writeFile(inputPath, Buffer.from(audioBuffer))

  // convert the temporary file to wav (16000 Hz, 1 channel, 16 bit, signed, little-endian)
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .inputFormat('webm')
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .outputFormat('wav')
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .run()
  })

  // read the wav file
  const wavBuffer = await fs.promises.readFile(outputPath).catch((error) => {
    console.error(error)
    return Buffer.alloc(0)
  })

  // delete the temporary files
  await fs.promises.unlink(inputPath)
  await fs.promises.unlink(outputPath)

  return wavBuffer
}
