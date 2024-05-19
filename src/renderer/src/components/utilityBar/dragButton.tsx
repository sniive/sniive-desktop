import { GripVerticalIcon } from 'lucide-react'

export function DragButton() {
  return (
    <div
      className="hover:bg-accent hover:text-accent-foreground"
      style={
        {
          WebkitAppRegion: 'drag'
        } as any
      }
    >
      <GripVerticalIcon className="h-6" />
    </div>
  )
}
