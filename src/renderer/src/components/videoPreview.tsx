import { cn } from '@renderer/lib/utils'
import { useEffect, useRef } from 'react'

type VideoPreviewProps = {
  isRecording: boolean
  videoStream: MediaStream | null
}

export function VideoPreview({ isRecording, videoStream }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current!.play()
      }
      if (videoStream) {
        videoRef.current.srcObject = videoStream
      }
    }
  }, [videoStream, videoRef.current])

  return (
    <video
      ref={videoRef}
      className={cn('w-full h-full', videoStream ? 'block' : 'hidden', isRecording && 'opacity-75')}
      playsInline
      muted
    />
  )
}
