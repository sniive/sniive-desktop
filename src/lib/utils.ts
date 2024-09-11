import { clsx, type ClassValue } from "clsx"
import { useNavigate } from "react-router-dom"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useError() {
  const navigate = useNavigate()

  return (error: string) => {
    navigate(`/error?error=${encodeURIComponent(error)}`)
  }
}