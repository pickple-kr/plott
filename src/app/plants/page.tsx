import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { WishlistButton } from '@/components/WishlistButton'
import { toggleWishlist } from '@/app/actions/wishlist'

const CATEGORIES = ['관엽식물', '다육·선인장', '허브', '꽃·화분']
const CARD_PASTELS = ['#FFF8E6', '#EEF4E8', '#F3EEFF', '#FFF0EC', '#E8F4F2']

export default async function PlantsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('plants')
    .select('id, name, price, category, image_url, purchase_url, description, created_at')
    .order('created_at', { ascending: false })

  if (category && CATEGORIES.includes(category)) {
    query = query.eq('category', category)
  }

  const [{ data: plants, error }, { data: wishlistData }] = await Promise.all([
    query,
    user
      ? supabase.from('wishlists').select('plant_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] as { plant_id: string }[] }),
  ])

  const wishlistSet = new Set((wishlistData ?? []).map((w) => w.plant_id))

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">

      {/* ── 페이지 제목 ── */}
      <div className="mb-10">
        <div className="relative w-fit mb-2">
          <h1 className="font-black text-4xl sm:text-5xl text-charcoal tracking-tight">
            식물 둘러보기
          </h1>
          <svg
            className="absolute left-0 w-full overflow-visible pointer-events-none"
            style={{ bottom: '-4px' }}
            height="10" viewBox="0 0 200 10"
            preserveAspectRatio="none" aria-hidden="true"
          >
            <path d="M2 7 C 45 2, 92 9, 135 5 C 168 2, 192 8, 198 5"
                  fill="none" stroke="#FF6BAC" strokeWidth="6"
                  strokeLinecap="round" opacity="0.85"/>
          </svg>
        </div>
        <p className="text-sm text-gray-400 mt-3">지금 만날 수 있는 모든 식물</p>
      </div>

      {/* ── 카테고리 필터 ── */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/plants"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category
              ? 'bg-charcoal text-white'
              : 'border border-gray-200 text-gray-500 hover:border-charcoal hover:text-charcoal'
          }`}
        >
          전체
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/plants?category=${encodeURIComponent(cat)}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-charcoal text-white'
                : 'border border-gray-200 text-gray-500 hover:border-charcoal hover:text-charcoal'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* ── 에러 ── */}
      {error && (
        <p className="text-sm text-red-500 mb-4">데이터를 불러오지 못했어요: {error.message}</p>
      )}

      {/* ── 빈 상태 ── */}
      {!error && plants && plants.length === 0 && (
        <div className="text-center py-32">
          <p className="font-serif text-2xl text-gray-200 mb-4">아직 등록된 식물이 없어요</p>
          <Link href="/sell" className="text-sm text-forest hover:underline">
            첫 번째 식물을 등록해보세요 →
          </Link>
        </div>
      )}

      {/* ── 식물 그리드 ── */}
      {plants && plants.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {plants.map((plant, i) => (
            <div
              key={plant.id}
              className="rounded-2xl overflow-hidden group relative"
              style={{ backgroundColor: CARD_PASTELS[i % CARD_PASTELS.length] }}
            >
              {/* 이미지 → 상세 페이지 링크 */}
              <Link href={`/plants/${plant.id}`} className="block">
                <div className="relative aspect-square">
                  {i === 0 && (
                    <span
                      className="absolute top-3 left-3 z-10 text-white text-[10px] font-black px-2.5 py-1 tracking-wider"
                      style={{ backgroundColor: '#FF4FA3', transform: 'rotate(-2deg)' }}
                    >
                      BEST
                    </span>
                  )}
                  {(i === 1 || i === 2) && (
                    <span
                      className="absolute top-3 left-3 z-10 text-charcoal text-[10px] font-black px-2.5 py-1 tracking-wider"
                      style={{ backgroundColor: '#D4F034', transform: 'rotate(2deg)' }}
                    >
                      NEW
                    </span>
                  )}
                  {plant.image_url ? (
                    <Image
                      src={plant.image_url} alt={plant.name} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
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
                initialWishlisted={wishlistSet.has(plant.id)}
                onToggle={toggleWishlist}
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
                  <span
                    className="px-2.5 py-1 bg-white/60 rounded-full text-[11px] text-gray-600 font-medium inline-block"
                    style={{ transform: 'rotate(-1.5deg)' }}
                  >
                    {plant.category}
                  </span>
                  <span
                    className="px-2.5 py-1 bg-white/60 rounded-full text-[11px] text-gray-600 font-medium inline-block"
                    style={{ transform: 'rotate(1deg)' }}
                  >
                    {plant.price.toLocaleString()}원
                  </span>
                </div>
                <a
                  href={plant.purchase_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-charcoal transition-colors"
                >
                  구매하러 가기
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 8L8 2M8 2H4M8 2V6"/>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
