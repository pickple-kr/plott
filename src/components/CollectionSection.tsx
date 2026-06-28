import Image from 'next/image'

type Plant = {
  id: string
  name: string
  price: number
  category: string
  image_url: string | null
  purchase_url: string
}

type CollectionPlantEntry = {
  id: string
  order_index: number
  plants: Plant | null
}

export type CollectionData = {
  id: string
  title: string
  description: string | null
  emoji: string | null
  collection_plants: CollectionPlantEntry[]
}

const CARD_BG = ['#FFF8E6', '#EEF4E8', '#F3EEFF', '#FFF0EC', '#E8F4F2']

export function CollectionSection({ collection }: { collection: CollectionData }) {
  /* order_index 기준으로 정렬 후 null 제거 */
  const plants = [...collection.collection_plants]
    .sort((a, b) => a.order_index - b.order_index)
    .map(cp => cp.plants)
    .filter((p): p is Plant => p !== null)

  if (plants.length === 0) return null

  return (
    <div className="py-10">

      {/* 섹션 헤더 */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mb-5">
        <h2 className="font-black text-2xl sm:text-3xl text-charcoal tracking-tight">
          {collection.emoji && (
            <span className="mr-2 font-normal">{collection.emoji}</span>
          )}
          {collection.title}
        </h2>
        {collection.description && (
          <p className="text-sm text-gray-400 mt-1">{collection.description}</p>
        )}
      </div>

      {/* 가로 스크롤 트랙
          overflow-x-auto 는 바깥에, 카드 패딩을 안쪽 flex에 줘야
          첫 번째·마지막 카드가 페이지 여백과 나란히 시작·끝남 */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 sm:gap-4 px-6 sm:px-8 max-w-7xl mx-auto">
          {plants.map((plant, i) => (
            <div
              key={plant.id}
              className="flex-shrink-0 w-[168px] sm:w-[184px] rounded-2xl overflow-hidden group"
              style={{ backgroundColor: CARD_BG[i % CARD_BG.length] }}
            >
              {/* 이미지 영역 */}
              <div className="relative aspect-square overflow-hidden">
                {plant.image_url ? (
                  <Image
                    src={plant.image_url}
                    alt={plant.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    sizes="184px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-black/10">
                      <rect x="3" y="6" width="30" height="24" rx="3"
                            stroke="currentColor" strokeWidth="1"/>
                      <circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1"/>
                      <path d="M3 24l8-7 6 6 6-4 10 8"
                            stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* 텍스트 정보 */}
              <div className="px-3 py-3 space-y-1">
                <p className="font-semibold text-xs text-charcoal leading-snug line-clamp-2">
                  {plant.name}
                </p>
                <p className="text-[11px] text-gray-400">
                  {plant.price.toLocaleString()}원
                </p>
                <a
                  href={plant.purchase_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[11px] text-gray-400
                             hover:text-charcoal transition-colors"
                >
                  구매하기
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1.5 7.5L7.5 1.5M7.5 1.5H3.5M7.5 1.5V5.5"/>
                  </svg>
                </a>
              </div>
            </div>
          ))}

          {/* 스크롤 끝 여백 */}
          <div className="flex-shrink-0 w-2" />
        </div>
      </div>
    </div>
  )
}
