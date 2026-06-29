'use client'

import { useState, useTransition } from 'react'

export function SellerActions({
  plantCount,
  followerCount: initialCount,
  isFollowing: initialFollowing,
  isSelf,
  sellerId,
  onToggle,
}: {
  plantCount: number
  followerCount: number
  isFollowing: boolean
  isSelf: boolean
  sellerId: string
  onToggle: (sellerId: string) => Promise<void>
}) {
  const [following, setFollowing]   = useState(initialFollowing)
  const [count,     setCount]       = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleFollow() {
    const next = !following
    setFollowing(next)
    setCount(prev => next ? prev + 1 : Math.max(0, prev - 1))
    startTransition(async () => { await onToggle(sellerId) })
  }

  return (
    <div className="flex items-center gap-4 flex-wrap mt-3">

      {/* 통계 */}
      <div className="flex items-center gap-3 text-sm">
        <span>
          <span className="text-gray-400">판매식물</span>
          <strong className="text-charcoal ml-1.5">{plantCount}</strong>
        </span>
        <span className="w-px h-3 bg-gray-200"/>
        <span>
          <span className="text-gray-400">팔로워</span>
          <strong className="text-charcoal ml-1.5">{count}</strong>
        </span>
      </div>

      {/* 팔로우 버튼 / 내 스토어 */}
      {!isSelf ? (
        <button
          onClick={handleFollow}
          disabled={isPending}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors
                      disabled:opacity-60 ${
            following
              ? 'bg-charcoal text-white hover:bg-charcoal/80'
              : 'border border-gray-300 text-charcoal hover:border-charcoal'
          }`}
        >
          {following ? '팔로잉 ✓' : '+ 팔로우'}
        </button>
      ) : (
        <span className="px-5 py-2 rounded-full border border-gray-200 text-sm text-gray-400 select-none">
          내 스토어
        </span>
      )}
    </div>
  )
}
