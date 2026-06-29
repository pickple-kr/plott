import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HeroBanner } from '@/components/HeroBanner'
import { CollectionSection } from '@/components/CollectionSection'
import { PlantCard } from '@/components/PlantCard'
import { toggleWishlist } from '@/app/actions/wishlist'
import { PLANT_CATEGORIES } from '@/lib/constants'


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
          카테고리 바로가기
      ═══════════════════════════════════════════════ */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
            <Link
              href="/plants"
              className="flex-shrink-0 px-5 py-2.5 rounded-full border border-gray-200
                         text-sm font-medium text-gray-500
                         hover:bg-charcoal hover:text-white hover:border-charcoal transition-colors"
            >
              전체 식물
            </Link>
            {PLANT_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/plants?category=${encodeURIComponent(cat)}`}
                className="flex-shrink-0 px-5 py-2.5 rounded-full border border-gray-200
                           text-sm font-medium text-charcoal
                           hover:bg-charcoal hover:text-white hover:border-charcoal transition-colors"
              >
                {cat}
              </Link>
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
