import { GoBackButton } from '@renderer/components/goBackButton'
import { ResultButton } from '@renderer/components/resultButton'
import { CloseButton } from '@renderer/components/utilityBar/closeButton'
import { DragButton } from '@renderer/components/utilityBar/dragButton'
import { MinimizeButton } from '@renderer/components/utilityBar/minimizeButton'
import { useResult } from './useResult'

function Result(): JSX.Element {
  const { state, progress, handleUpload } = useResult()

  return (
    <main className="min-w-screen bg-background antialiased rounded-lg flex flex-col items-center justify-center overflow-hidden pb-1 border">
      <div className="w-full grid grid-cols-3 items-center justify-center">
        <div className="flex flex-row items-center justify-start col-span-1">
          <GoBackButton />
        </div>
        <div className="flex flex-row items-center justify-center col-span-1">
          <h1 className="text-md font-bold">Results</h1>
        </div>
        <div className="flex flex-row items-center justify-end gap-2 col-span-1">
          <CloseButton />
          <MinimizeButton />
          <DragButton />
        </div>
      </div>
      <ResultButton state={state} progress={progress} handleUpload={handleUpload} />
    </main>
  )
}

export default Result
