import { ResultButton } from '@renderer/components/resultButton'
import { CloseButton } from '@renderer/components/utilityBar/closeButton'
import { DragButton } from '@renderer/components/utilityBar/dragButton'
import { MinimizeButton } from '@renderer/components/utilityBar/minimizeButton'
import { useResult } from './useResult'
import { useGlobalStore } from '@renderer/globalStore'
import { getText } from '@renderer/lib/locales'
import { useMemo } from 'react'

function Result(): JSX.Element {
  const { state, progress, handleUpload } = useResult()
  const { locale } = useGlobalStore(({ locale }) => ({ locale }))
  const title = useMemo(() => getText(locale, 'results'), [locale])

  return (
    <main className="min-w-screen bg-background antialiased rounded-lg flex flex-col items-center justify-center overflow-hidden pb-1 border">
      <div className="w-full grid grid-cols-3 items-center justify-center h-10">
        <div className="flex flex-row items-center justify-center col-span-1 col-start-2">
          <h1 className="text-md font-bold">{title}</h1>
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
