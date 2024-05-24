import { useGlobalStore } from '@renderer/globalStore'
import { useCallback, useState } from 'react'

type UseAudioReturn = {
  audioInput: MediaDeviceInfo | null
  setAudio: () => void
  stopAudio: () => void
  audioStream: MediaStream | null
  audioRecorder: MediaRecorder | null
}

const audioChunks: Blob[] = []

export function useAudio(): UseAudioReturn {
  const [audioInput, setAudioInput] = useState<MediaDeviceInfo | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null)

  const { setAudioString } = useGlobalStore(({ setAudioString }) => ({ setAudioString }))

  const startRecorder = async (stream: MediaStream): Promise<void> => {
    // setup audio context
    const audioContext = new AudioContext({
      sampleRate: 16000,
      latencyHint: 'interactive'
    })
    const source = audioContext.createMediaStreamSource(stream)
    const recorder = new MediaRecorder(source.mediaStream)
    recorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
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

  const stopAudio = useCallback(async () => {
    audioStream?.getTracks().forEach((track) => track.stop())
    setAudioStream(null)
    const blob = new Blob(audioChunks, { type: 'audio/webm' })
    audioChunks.length = 0

    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => {
      setAudioString(reader.result as string)
    }
  }, [audioStream])

  return { audioInput, setAudio, stopAudio, audioStream, audioRecorder }
}
