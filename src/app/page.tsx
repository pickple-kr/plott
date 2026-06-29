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

  /* 최근 커뮤니티 글 4개 */
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, title, category, comments(count)')
    .order('created_at', { ascending: false })
    .limit(4)

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

      {/* ═══════════════════════════════════════════════
          커뮤니티 유도 섹션
      ═══════════════════════════════════════════════ */}
      <section className="py-16 bg-[#F7F5F0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">

          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">

            {/* ── 왼쪽: 헤드카피 + 버튼 ── */}
            <div className="md:w-72 flex-shrink-0">
              <div className="relative w-fit mb-3">
                <h2 className="font-black text-3xl sm:text-4xl text-charcoal tracking-tight leading-tight">
                  PLOTT<br/>커뮤니티
                </h2>
                <svg
                  className="absolute left-0 w-full overflow-visible pointer-events-none"
                  style={{ bottom: '-4px' }}
                  height="10" viewBox="0 0 200 10"
                  preserveAspectRatio="none" aria-hidden="true"
                >
                  <path d="M2 7 C 45 2, 92 9, 135 5 C 168 2, 192 8, 198 5"
                        fill="none" stroke="#c8f135" strokeWidth="6"
                        strokeLinecap="round" opacity="0.9"/>
                </svg>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed mt-5 mb-7">
                식물 키우다 궁금한 게 생겼나요?<br/>
                자랑도, 고민도, 팁도<br/>
                여기서 함께 나눠요.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/community/write"
                  className="px-5 py-2.5 bg-charcoal text-white text-sm font-medium
                             rounded-full hover:bg-charcoal/80 transition-colors"
                >
                  글쓰기
                </Link>
                <Link
                  href="/community"
                  className="px-5 py-2.5 border border-gray-300 text-charcoal text-sm font-medium
                             rounded-full hover:border-charcoal transition-colors"
                >
                  커뮤니티 가기
                </Link>
              </div>
            </div>

            {/* ── 오른쪽: 최근 글 목록 ── */}
            <div className="flex-1 w-full">
              {(!recentPosts || recentPosts.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-16
                                border border-dashed border-gray-200 rounded-3xl bg-white">
                  <p className="text-sm text-gray-300 mb-3">아직 게시글이 없어요</p>
                  <Link href="/community/write"
                        className="text-sm text-forest hover:underline">
                    첫 글을 써보세요 →
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(recentPosts as any[]).map((post) => {
                    const commentCount = Number(post.comments?.[0]?.count ?? 0)
                    const BADGE: Record<string, { bg: string; color: string }> = {
                      '자랑': { bg: '#FBEAF0', color: '#993556' },
                      '고민': { bg: '#FAEEDA', color: '#854F0B' },
                      '팁':   { bg: '#E1F5EE', color: '#0F6E56' },
                      '자유': { bg: '#F3F4F6', color: '#6B7280' },
                    }
                    const badge = BADGE[post.category] ?? { bg: '#F3F4F6', color: '#6B7280' }
                    return (
                      <li key={post.id}>
                        <Link
                          href={`/community/${post.id}`}
                          className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4
                                     hover:shadow-sm transition-shadow group"
                        >
                          <span
                            className="flex-shrink-0 text-[11px] font-black px-2.5 py-1
                                       rounded-full tracking-wide"
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                          >
                            {post.category}
                          </span>
                          <span className="flex-1 text-sm font-medium text-charcoal
                                           truncate group-hover:text-gray-600 transition-colors">
                            {post.title}
                          </span>
                          <span className="flex-shrink-0 flex items-center gap-1
                                           text-xs text-gray-300">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14
                                       a2 2 0 0 1 2 2z"/>
                            </svg>
                            {commentCount}
                          </span>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                               className="flex-shrink-0 text-gray-300
                                          group-hover:text-gray-400 transition-colors">
                            <path d="M5 2l5 5-5 5"/>
                          </svg>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* 더보기 */}
              {recentPosts && recentPosts.length > 0 && (
                <div className="mt-5 text-right">
                  <Link
                    href="/community"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400
                               hover:text-charcoal transition-colors"
                  >
                    더보기
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M4 2l5 4.5L4 11"/>
                    </svg>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
