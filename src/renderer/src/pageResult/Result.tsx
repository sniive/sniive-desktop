import { CloseButton } from '@renderer/components/utilityBar/closeButton'
import { DragButton } from '@renderer/components/utilityBar/dragButton'
import { MinimizeButton } from '@renderer/components/utilityBar/minimizeButton'
import { useGlobalStore } from '@renderer/globalStore'

function Result(): JSX.Element {
  const { memory, sendInfo } = useGlobalStore(({ memory, sendInfo }) => ({ memory, sendInfo }))

  console.log(memory, sendInfo)

  return (
    <main className="min-w-screen bg-background antialiased rounded-lg flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full grid grid-cols-3 items-center justify-center">
        <div className="flex flex-row items-center justify-start col-span-2">Results</div>
        <div className="flex flex-row items-center justify-end gap-2 col-span-1">
          <CloseButton />
          <MinimizeButton />
          <DragButton />
        </div>
      </div>
    </main>
  )
}

export default Result
