import { Button } from '@renderer/components/ui/button'

enum ResultState {
  IDLE,
  CONVERTING,
  CONVERTING_DONE,
  UPLOADING,
  UPLOADING_DONE
}

type ResultButtonProps = {
  state: ResultState
  progress: number
  handleConvert: () => void
  handleUpload: () => void
}

export function ResultButton({ state, progress, handleConvert, handleUpload }: ResultButtonProps) {
  switch (state) {
    case ResultState.IDLE:
      return (
        <Button variant="default" size="lg" onClick={handleConvert} className="p-0 h-8 w-32">
          <div className="relative w-full h-full">
            <div className="absolute top-0 left-0 z-20 flex items-center justify-center h-full w-full">
              Convert
            </div>
          </div>
        </Button>
      )
    case ResultState.CONVERTING:
      return (
        <Button variant="default" className="p-0 h-8 w-32" size="lg" disabled>
          <div className="relative w-full h-full">
            <div
              className="rounded-md absolute top-0 left-0 z-10 h-full bg-main-300"
              style={{ width: `${progress * 100}%` }}
            />
            <div className="absolute top-0 left-0 z-20 flex items-center justify-center h-full w-full">
              Converting...
            </div>
          </div>
        </Button>
      )
    case ResultState.CONVERTING_DONE:
      return (
        <Button variant="default" size="lg" onClick={handleUpload} className="p-0 h-8 w-32">
          <div className="relative w-full h-full">
            <div className="absolute top-0 left-0 z-20 flex items-center justify-center h-full w-full">
              Upload
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
              Uploading...
            </div>
          </div>
        </Button>
      )
    case ResultState.UPLOADING_DONE:
      return (
        <Button variant="outline" className="p-0 h-8 w-32" size="lg" disabled>
          Done
        </Button>
      )
  }
}
