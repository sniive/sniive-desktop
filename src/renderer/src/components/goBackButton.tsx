import { Button } from '@renderer/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { Undo2Icon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function GoBackButton() {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(-1)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={handleClick}>
            <Undo2Icon className="w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Go back</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
