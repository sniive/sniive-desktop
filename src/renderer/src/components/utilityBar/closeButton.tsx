import { XIcon } from 'lucide-react'

export function CloseButton() {
  const handleClick = async () => await window.electron.ipcRenderer.invoke('close')

  return (
    <button
      className="group h-4 w-4 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer"
      onClick={handleClick}
    >
      <XIcon className="group-hover:opacity-100 opacity-0 h-full w-full p-1 transition-opacity" />
    </button>
  )
}
