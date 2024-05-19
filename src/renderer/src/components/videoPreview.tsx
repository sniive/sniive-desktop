import { cn } from '@renderer/lib/utils'
import { useRef } from 'react'

type VideoPreviewProps = {
  isRecording: boolean
  videoStream: MediaStream | null
}

export function VideoPreview({ isRecording, videoStream }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  if (videoStream) {
    videoRef.current!.srcObject = videoStream
  }

  return (
    <video
      ref={videoRef}
      className={cn('w-full h-full', videoStream ? 'block' : 'hidden', isRecording && 'opacity-75')}
      autoPlay
      playsInline
      muted
    />
  )
}
