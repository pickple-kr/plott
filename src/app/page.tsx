import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HeroBanner } from '@/components/HeroBanner'
import { CollectionSection } from '@/components/CollectionSection'
import { PlantCard } from '@/components/PlantCard'
import { toggleWishlist } from '@/app/actions/wishlist'

/* ── 가이드 바 데이터 ─────────────────────────────── */
const GUIDES = [
  {
    title: '반려동물 안전 정보',
    sub:   '펫 프렌들리 식물 가이드',
    icon: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* 발바닥 */}
        <ellipse cx="17" cy="22" rx="7.5" ry="8"/>
        <ellipse cx="8.5"  cy="13" rx="3.2" ry="4"/>
        <ellipse cx="17"   cy="10" rx="3.2" ry="4"/>
        <ellipse cx="25.5" cy="13" rx="3.2" ry="4"/>
      </svg>
    ),
  },
  {
    title: '햇빛 가이드',
    sub:   '식물의 빛 요구량 안내',
    icon: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="17" cy="17" r="5.5"/>
        <line x1="17" y1="3"  x2="17" y2="7.5"/>
        <line x1="17" y1="26.5" x2="17" y2="31"/>
        <line x1="3"  y1="17" x2="7.5" y2="17"/>
        <line x1="26.5" y1="17" x2="31" y2="17"/>
        <line x1="7.5"  y1="7.5"  x2="10.8" y2="10.8"/>
        <line x1="23.2" y1="23.2" x2="26.5" y2="26.5"/>
        <line x1="26.5" y1="7.5"  x2="23.2" y2="10.8"/>
        <line x1="10.8" y1="23.2" x2="7.5"  y2="26.5"/>
      </svg>
    ),
  },
  {
    title: '물주기 가이드',
    sub:   '초보자도 쉽게 키워요',
    icon: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 4 Q27 16 27 22 A10 10 0 1 1 7 22 Q7 16 17 4Z"/>
      </svg>
    ),
  },
  {
    title: '플로팅 가이드',
    sub:   'PLOTT가 제안하는 식물 생활',
    icon: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none"
           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* 화분 */}
        <path d="M10 20 L12 30 L22 30 L24 20Z"/>
        <rect x="9" y="17" width="16" height="4" rx="1.5"/>
        {/* 줄기·잎 */}
        <line x1="17" y1="17" x2="17" y2="10"/>
        <path d="M17 14 Q21 11 23 13"/>
        <path d="M17 11.5 Q13 9 11 11"/>
      </svg>
    ),
  },
]

const CARD_PASTELS = ['#FFF8E6', '#EEF4E8', '#F3EEFF', '#FFF0EC', '#E8F4F2']

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  /* 식물 목록 + 배너 + 큐레이션을 동시에 가져오기 */
  const [{ data: plants }, { data: banners }, { data: rawCollections }] = await Promise.all([
    supabase
      .from('plants')
      .select('id, name, price, category, image_url, purchase_url, description')
      .order('created_at', { ascending: false }),
    supabase
      .from('banners')
      .select('id, image_url, link_url, order_index')
      .eq('active', true)
      .order('order_index', { ascending: true }),
    supabase
      .from('collections')
      .select(`
        id, title, description, emoji, order_index,
        collection_plants(
          id, order_index,
          plants(id, name, price, category, image_url, purchase_url)
        )
      `)
      .eq('active', true)
      .order('order_index', { ascending: true }),
  ])

  /* 찜 목록 (로그인한 경우만) */
  const { data: wishlistData } = user
    ? await supabase.from('wishlists').select('plant_id').eq('user_id', user.id)
    : { data: [] as { plant_id: string }[] }

  const wishlistSet = new Set((wishlistData ?? []).map((w) => w.plant_id))

  return (
    <div>

      {/* ═══════════════════════════════════════════════
          히어로 슬라이드 배너 (DB에서 불러온 실제 배너)
      ═══════════════════════════════════════════════ */}
      <HeroBanner banners={banners ?? []} />

      {/* ═══════════════════════════════════════════════
          가이드 바 (반려동물/햇빛/물주기/플로팅)
      ═══════════════════════════════════════════════ */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {GUIDES.map(({ title, sub, icon }) => (
              <div key={title}
                   className="flex items-center gap-3 px-4 sm:px-6 py-5 cursor-pointer
                              hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 text-gray-500">{icon}</div>
                <div>
                  <p className="text-sm font-semibold text-charcoal leading-tight">{title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════
          PLOTT'S PICK
      ═══════════════════════════════════════════════ */}
      <section className="py-14">

        {/* 헤더 */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 mb-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="relative w-fit mb-2">
                <h2 className="font-black text-4xl sm:text-5xl text-charcoal uppercase tracking-tight">
                  PLOTT&apos;S PICK!
                </h2>
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
              <p className="text-sm text-gray-400">지금 가장 사랑받는 식물들</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                   stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round">
                <line x1="9" y1="1"  x2="9"  y2="17"/>
                <line x1="1" y1="9"  x2="17" y2="9"/>
                <line x1="3" y1="3"  x2="15" y2="15"/>
                <line x1="15" y1="3" x2="3"  y2="15"/>
              </svg>
              <Link href="/plants"
                    className="text-sm text-gray-400 hover:text-charcoal transition-colors">
                모두 보기 →
              </Link>
            </div>
          </div>
        </div>

        {/* 빈 상태 */}
        {(!plants || plants.length === 0) && (
          <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center py-28">
            <p className="font-serif text-2xl text-gray-200 mb-4">아직 등록된 식물이 없어요</p>
            <Link href="/sell" className="text-sm text-forest hover:underline">
              첫 번째 식물을 등록해보세요 →
            </Link>
          </div>
        )}

        {/* 가로 스크롤 카드 */}
        {plants && plants.length > 0 && (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 sm:gap-4 px-6 sm:px-8 max-w-7xl mx-auto">
              {plants.map((plant, i) => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  index={i}
                  isWishlisted={wishlistSet.has(plant.id)}
                  onToggle={toggleWishlist}
                  showBadge
                />
              ))}
              <div className="flex-shrink-0 w-2" />
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════
          큐레이션 섹션 (넷플릭스 스타일 가로 스크롤)
      ═══════════════════════════════════════════════ */}
      {rawCollections && rawCollections.length > 0 && (
        <div className="pb-16">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(rawCollections as any[]).map((col) => (
            <CollectionSection
              key={col.id}
              collection={col}
              wishlistSet={wishlistSet}
              onToggle={toggleWishlist}
            />
          ))}
        </div>
      )}

    </div>
  )
}
