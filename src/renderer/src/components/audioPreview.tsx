import { cn } from '@renderer/lib/utils'
import { createSoundDetector } from '@stream-io/video-react-sdk'
import { useEffect, useState } from 'react'

import sniive from '@renderer/assets/sniive.svg'

export type AudioPreviewProps = {
  isRecording: boolean
  isDisabled: boolean
  audioStream: MediaStream | null
}

export function AudioPreview({ isRecording, isDisabled, audioStream }: AudioPreviewProps) {
  const [audioLevel, setAudioLevel] = useState(0)

  useEffect(() => {
    if (!audioStream) return

    const disposeSoundDetector = createSoundDetector(
      audioStream,
      ({ audioLevel: al }) => setAudioLevel(al),
      { detectionFrequencyInMs: 80, destroyStreamOnStop: false }
    )

    return () => {
      disposeSoundDetector().catch(console.error)
    }
  }, [audioStream])

  return (
    <div className="w-full h-10 relative flex items-center justify-center">
      <div
        style={{
          transform: `scaleX(${audioLevel / 100})`,
          transformOrigin: 'left center'
        }}
        className={cn(
          'w-full h-5 bg-primary absolute top-2.5 left-0 transition-transform',
          isDisabled && 'bg-gray-500 opacity-50',
          isRecording && 'bg-red-500'
        )}
      />
      <img src={sniive} alt="sniive" className="h-5 py-0.5 z-10" />
    </div>
  )
}
