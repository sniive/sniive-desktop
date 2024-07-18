/* eslint-disable */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

class FixedLengthQueue<T> {
  private queue: T[] = []

  constructor(length: number, defaultValue: T) {
    this.queue = Array.from({ length }, () => defaultValue)
  }

  push(value: T) {
    this.queue.push(value)
    return this.queue.shift()
  }
}

export class RateLimiter {
  private fixedLengthQueue: FixedLengthQueue<number>

  constructor(
    maxActions: number,
    private interval: number
  ) {
    this.fixedLengthQueue = new FixedLengthQueue(maxActions, 0)
  }

  update() {
    const currentTime = Date.now()
    const oldestActionTime = this.fixedLengthQueue.push(currentTime)

    if (currentTime - oldestActionTime < this.interval) {
      // Rate limit exceeded
      return true
    }

    return false
  }
}
