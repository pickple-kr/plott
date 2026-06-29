'use client'

import { useState, useTransition } from 'react'

export function FollowButton({
  sellerId,
  initialFollowing,
  followerCount: initialCount,
  onToggle,
}: {
  sellerId: string
  initialFollowing: boolean
  followerCount: number
  onToggle: (sellerId: string) => Promise<void>
}) {
  const [following, setFollowing]   = useState(initialFollowing)
  const [count,     setCount]       = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const next = !following
    setFollowing(next)
    setCount(prev => next ? prev + 1 : Math.max(0, prev - 1))
    startTransition(() => { onToggle(sellerId) })
  }

  return (
    <div className="flex items-center gap-4">
      {/* 팔로워 수 — 낙관적 업데이트로 즉시 반영 */}
      <span className="text-sm text-charcoal">
        <strong>{count}</strong>
        <span className="text-gray-400 ml-1">팔로워</span>
      </span>

      <button
        onClick={handleClick}
        disabled={isPending}
        className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors
                    disabled:opacity-60 ${
          following
            ? 'bg-charcoal text-white hover:bg-charcoal/80'
            : 'border border-gray-300 text-charcoal hover:border-charcoal'
        }`}
      >
        {following ? '팔로잉 ✓' : '+ 팔로우'}
      </button>
    </div>
  )
}
