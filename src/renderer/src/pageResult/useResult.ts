import { useGlobalStore } from '@renderer/globalStore'
import { useCallback, useState } from 'react'
import { Buffer } from 'buffer'

enum ResultState {
  IDLE,
  CONVERTING,
  CONVERTING_DONE,
  UPLOADING,
  UPLOADING_DONE
}

type SendableResult = {
  base64Image: string
  data: string
}

type UseResultReturn = {
  state: ResultState
  progress: number
  handleConvert: () => void
  handleUpload: () => void
}

const convertImage = async (image: ImageBitmap): Promise<string> => {
  const canvas = new OffscreenCanvas(image.width, image.height)
  const context = canvas.getContext('2d')
  context?.drawImage(image, 0, 0)
  return canvas
    .convertToBlob({ type: 'image/jpeg' })
    .then(async (blob) => Buffer.from(await blob.arrayBuffer()).toString('base64'))
}

export function useResult(): UseResultReturn {
  const { memory, sendInfo } = useGlobalStore(({ memory, sendInfo }) => ({ memory, sendInfo }))

  const [state, setState] = useState<ResultState>(ResultState.IDLE)
  const [sendableResults, setSendableResults] = useState<SendableResult[]>([])
  const [progress, setProgress] = useState<number>(0)

  const handleConvert = useCallback(async () => {
    setState(ResultState.CONVERTING)

    const conversions = memory.map<Promise<SendableResult>>(async ({ image, data }) => ({
      base64Image: await convertImage(image),
      data
    }))
    for await (const conversion of conversions) {
      setProgress((progress) => progress + 1 / memory.length)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSendableResults((results) => [...results, conversion])
    }

    setState(ResultState.CONVERTING_DONE)
    setProgress(0)
  }, [memory])

  const handleUpload = useCallback(async () => {
    setState(ResultState.UPLOADING)

    if (sendInfo === null) return
    await fetch('https://api.example.com/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...sendInfo, results: sendableResults })
    })

    setState(ResultState.UPLOADING_DONE)
  }, [sendInfo, sendableResults])

  return { state, progress, handleConvert, handleUpload }
}
