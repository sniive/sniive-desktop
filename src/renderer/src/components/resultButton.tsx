import { Button } from '@renderer/components/ui/button'
import { useGlobalStore } from '@renderer/globalStore'
import { getText } from '@renderer/lib/locales'

enum ResultState {
  IDLE,
  UPLOADING,
  UPLOADING_DONE
}

type ResultButtonProps = {
  state: ResultState
  progress: number
  handleUpload: () => void
}

export function ResultButton({ state, progress, handleUpload }: ResultButtonProps) {
  const { locale } = useGlobalStore(({ locale }) => ({ locale }))
  switch (state) {
    case ResultState.IDLE:
      return (
        <Button variant="default" size="lg" onClick={handleUpload} className="p-0 h-8 w-32 my-0.5">
          <div className="relative w-full h-full">
            <div className="absolute top-0 left-0 z-20 flex items-center justify-center h-full w-full">
              {getText(locale, 'resultUpload')}
            </div>
          </div>
        </Button>
      )
    case ResultState.UPLOADING:
      return (
        <Button variant="default" className="p-0 h-8 w-32" size="lg" disabled>
          <div className="relative w-full h-full">
            <div
              className="rounded-md absolute top-0 left-0 z-10 h-full bg-main-300"
              style={{ width: `${progress * 100}%` }}
            />
            <div className="absolute top-0 left-0 z-20 flex items-center justify-center h-full w-full">
              {getText(locale, 'resultUploading')}
            </div>
          </div>
        </Button>
      )
    case ResultState.UPLOADING_DONE:
      return (
        <Button variant="outline" className="p-0 h-8 w-32" size="lg" disabled>
          {getText(locale, 'resultDone')}
        </Button>
      )
  }
}
