import Link from 'next/link'
import Image from 'next/image'
import { WishlistButton } from './WishlistButton'

const CARD_PASTELS = ['#FFF8E6', '#EEF4E8', '#F3EEFF', '#FFF0EC', '#E8F4F2']

export type PlantCardData = {
  id: string
  name: string
  price: number
  category?: string | null
  image_url: string | null
  purchase_url: string
  description?: string | null
  created_at?: string | null
}

export function PlantCard({
  plant,
  index,
  isWishlisted,
  onToggle,
  showBadge = false,
  className = 'flex-shrink-0 w-48 sm:w-52',
}: {
  plant: PlantCardData
  index: number
  isWishlisted: boolean
  onToggle: (plantId: string) => Promise<void>
  showBadge?: boolean
  className?: string
}) {
  const bgColor = CARD_PASTELS[index % CARD_PASTELS.length]
  const isNew = showBadge && plant.created_at
    ? Date.now() - new Date(plant.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
    : false

  return (
    <div
      className={`rounded-2xl overflow-hidden group relative ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* 이미지 → 상세 페이지 링크 */}
      <Link href={`/plants/${plant.id}`} className="block">
        <div className="relative aspect-square">
          {isNew && (
            <span
              className="absolute top-3 left-3 z-10 text-charcoal text-[10px] font-black px-2.5 py-1 tracking-wider"
              style={{ backgroundColor: '#D4F034', transform: 'rotate(2deg)' }}
            >
              NEW
            </span>
          )}
          {plant.image_url ? (
            <Image
              src={plant.image_url}
              alt={plant.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              sizes="(max-width: 640px) 192px, 208px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-black/10">
                <rect x="4" y="8" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1"/>
                <circle cx="13" cy="16" r="3" stroke="currentColor" strokeWidth="1"/>
                <path d="M4 24l8-7 6 6 6-4 12 9" stroke="currentColor" strokeWidth="1"
                      strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="30" cy="10" r="5" fill="white" stroke="currentColor" strokeWidth="1"/>
                <path d="M30 7.5v5M27.5 10h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
          )}
        </div>
      </Link>

      {/* 하트(찜) 버튼 — Link 바깥에 absolute 배치 */}
      <WishlistButton
        plantId={plant.id}
        initialWishlisted={isWishlisted}
        onToggle={onToggle}
        className="absolute top-3 right-3 z-20 text-white/50"
      />

      {/* 텍스트 정보 */}
      <div className="px-4 py-4">
        <h3 className="font-semibold text-sm text-charcoal leading-snug mb-1">
          {plant.name}
        </h3>
        {plant.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {plant.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {plant.category && (
            <span
              className="px-2.5 py-1 bg-white/60 rounded-full text-[11px] text-gray-600 font-medium inline-block"
              style={{ transform: 'rotate(-1.5deg)' }}
            >
              {plant.category}
            </span>
          )}
          <span
            className="px-2.5 py-1 bg-white/60 rounded-full text-[11px] text-gray-600 font-medium inline-block"
            style={{ transform: 'rotate(1deg)' }}
          >
            {plant.price.toLocaleString()}원
          </span>
        </div>
        <a
          href={plant.purchase_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-charcoal transition-colors"
        >
          구매하러 가기
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 8L8 2M8 2H4M8 2V6"/>
          </svg>
        </a>
      </div>
    </div>
  )
}
