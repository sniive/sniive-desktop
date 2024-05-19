import { MinusIcon } from 'lucide-react'

export function MinimizeButton() {
  const handleClick = async () => await window.electron.ipcRenderer.invoke('minimize')

  return (
    <button
      className="group h-4 w-4 rounded-full bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
      onClick={handleClick}
    >
      <MinusIcon className="group-hover:opacity-100 opacity-0 h-full w-full p-1 transition-opacity" />
    </button>
  )
}
