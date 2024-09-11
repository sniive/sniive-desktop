import { cn, useError } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/state';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';

export function RecordButton() {
  const navigate = useNavigate();
  const error = useError();
  const { recordButtonDisabled, isRecording, setIsRecording } = useAppStore(({ recordButtonDisabled, isRecording, setIsRecording }) => ({ recordButtonDisabled, isRecording, setIsRecording }));

  const startRecording = async () => {
    await invoke<void>('start_input')
      .then(() => setIsRecording(true))
      .catch((err) => error(String(err)))
  }

  const stopRecording = async () => {
    await invoke<void>('stop_input')
      .then(() => {
        setIsRecording(false)
        navigate('/result')
      })
      .catch((err) => error(String(err)))
  }

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
      disabled={recordButtonDisabled}
    />
  )
}
