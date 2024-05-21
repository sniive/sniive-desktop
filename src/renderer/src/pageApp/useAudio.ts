import { useState } from 'react'

type UseAudioReturn = {
  audioInput: MediaDeviceInfo | null
  setAudio: () => void
  audioStream: MediaStream | null
  audioRecorder: MediaRecorder | null
}

export function useAudio(): UseAudioReturn {
  const [audioInput, setAudioInput] = useState<MediaDeviceInfo | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])

  const startRecorder = async (stream: MediaStream): Promise<void> => {
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    recorder.ondataavailable = (event) => {
      setAudioChunks((chunks) => [...chunks, event.data])
    }
    recorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      console.log(url)
      setAudioChunks([])
    }
    setAudioRecorder(recorder)
  }

  const startAudioStream = async (source: MediaDeviceInfo): Promise<void> =>
    await navigator.mediaDevices
      .getUserMedia({
        audio: {
          deviceId: source.deviceId
        },
        video: false
      })
      .then((stream) => {
        setAudioStream(stream)
        startRecorder(stream)
      })

  const getAudioDevices = async (): Promise<MediaDeviceInfo | null> => {
    const audioInputs: MediaDeviceInfo[] = await navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => devices.filter((device) => device.kind === 'audioinput'))
      .catch(() => [])

    const options = ['- None -', ...audioInputs.map(({ label }) => label || 'Unknown device')]

    return await window.electron.ipcRenderer
      .invoke('useMenu', options)
      .then((result: number | null) => {
        if (result === null) return null
        if (result === 0) return null
        return audioInputs[result - 1]
      })
  }

  const setAudio = async () =>
    getAudioDevices().then((source) => {
      setAudioInput(source)
      if (source) {
        startAudioStream(source)
      } else {
        setAudioStream(null)
        setAudioRecorder(null)
      }
    })

  return { audioInput, setAudio, audioStream, audioRecorder }
}
