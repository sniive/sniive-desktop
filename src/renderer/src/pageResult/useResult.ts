import { useGlobalStore } from '@renderer/globalStore'
import { useCallback, useState } from 'react'

enum ResultState {
  IDLE,
  UPLOADING,
  UPLOADING_DONE
}

type UseResultReturn = {
  state: ResultState
  progress: number
  handleUpload: () => void
}

export function useResult(): UseResultReturn {
  const { isAuth } = useGlobalStore(({ isAuth }) => ({ isAuth }))

  const [state, setState] = useState<ResultState>(ResultState.IDLE)
  const [progress, setProgress] = useState<number>(0)

  const handleUpload = useCallback(async () => {
    setState(ResultState.UPLOADING)

    // Simulate upload
    for (let i = 0; i < 100; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      setProgress(i)
    }

    setState(ResultState.UPLOADING_DONE)
  }, [isAuth])

  return { state, progress, handleUpload }
}
