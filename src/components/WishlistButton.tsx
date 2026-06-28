'use client'

import { useState, useTransition } from 'react'

export function WishlistButton({
  plantId,
  initialWishlisted,
  onToggle,
  size = 18,
  className = '',
}: {
  plantId: string
  initialWishlisted: boolean
  onToggle: (plantId: string) => Promise<void>
  size?: number
  className?: string
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [isPending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted((prev) => !prev)
    startTransition(() => { onToggle(plantId) })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={wishlisted ? '찜 취소' : '찜하기'}
      className={`transition-colors disabled:opacity-60 ${className}`}
    >
      <svg
        width={size} height={size}
        viewBox="0 0 24 24"
        fill={wishlisted ? '#ef4444' : 'none'}
        stroke={wishlisted ? '#ef4444' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                 a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  )
}
