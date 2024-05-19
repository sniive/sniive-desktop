import { cn } from '@renderer/lib/utils'
import { Button } from '@renderer/components/ui/button'

type RecordButtonProps = {
  isDisabled: boolean
  isRecording: boolean
  startRecording: () => void
  stopRecording: () => void
}

export function RecordButton({
  isDisabled,
  isRecording,
  startRecording,
  stopRecording
}: RecordButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'h-6 w-6 rounded-full outline outline-offset-2 transition-colors duration-200 p-0',
        'disabled:cursor-not-allowed disabled:bg-gray-500 disabled:hover:bg-gray-500 disabled:outline-gray-500 disabled:hover:outline-gray-500',
        'bg-primary hover:bg-main-800 outline-primary hover:outline-main-800',
        isRecording &&
          'bg-red-500 hover:bg-red-600 outline-red-500 hover:outline-red-600 animate-pulse duration-700'
      )}
      onClick={() => (isRecording ? stopRecording() : startRecording())}
      aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
      disabled={isDisabled}
    />
  )
}
