import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlantCard } from '@/components/PlantCard'
import { ProfileEditSection } from '@/components/ProfileEditSection'
import { toggleWishlist } from '@/app/actions/wishlist'
import { updateProfile } from '@/app/actions/profile'
import { deletePlant } from '@/app/actions/plants'
import { DeletePlantButton } from '@/components/DeletePlantButton'
import { logout } from '@/app/actions/auth'

const BADGE: Record<string, { bg: string; color: string }> = {
  '자랑': { bg: '#FBEAF0', color: '#993556' },
  '고민': { bg: '#FAEEDA', color: '#854F0B' },
  '팁':   { bg: '#E1F5EE', color: '#0F6E56' },
  '자유': { bg: '#F3F4F6', color: '#6B7280' },
}

const CARD_PASTELS = ['#FFF8E6', '#EEF4E8', '#F3EEFF', '#FFF0EC', '#E8F4F2']

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: wishlistRows },
    { data: profile },
    { data: likeRows },
    { data: myPostRows },
    { data: myPlantRows },
  ] = await Promise.all([
    supabase
      .from('wishlists')
      .select('plants(id, name, price, category, image_url, purchase_url, description)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('is_admin, seller_status, display_name, bio, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('likes')
      .select('posts(id, title, category, created_at, user_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('posts')
      .select('id, title, category, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('plants')
      .select('id, name, price, category, image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  /* ── 찜한 식물 ── */
  type Plant = {
    id: string; name: string; price: number; category: string | null
    image_url: string | null; purchase_url: string; description: string | null
  }
  const plants = (wishlistRows ?? [])
    .map(r => r.plants as unknown as Plant | null)
    .filter((p): p is Plant => p !== null)

  /* ── 좋아요한 글 ── */
  type Post = { id: string; title: string; category: string; created_at: string; user_id: string | null }
  const likedPosts = (likeRows ?? [])
    .map(r => r.posts as unknown as Post | null)
    .filter((p): p is Post => p !== null)

  const postUserIds = [...new Set(likedPosts.map(p => p.user_id).filter(Boolean))] as string[]
  const { data: postProfiles } = postUserIds.length > 0
    ? await supabase.from('profiles').select('id, email, display_name').in('id', postUserIds)
    : { data: [] as { id: string; email: string; display_name: string | null }[] }
  const postProfileMap = new Map(
    (postProfiles ?? []).map(p => [p.id, p.display_name || p.email?.split('@')[0] || '익명'])
  )

  /* ── 내가 쓴 글 ── */
  const myPosts = myPostRows ?? []

  /* ── 내 판매 식물 ── */
  const myPlants = myPlantRows ?? []

  const isAdmin      = profile?.is_admin      ?? false
  const sellerStatus = profile?.seller_status ?? 'none'

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">

      {/* ── 페이지 제목 ── */}
      <div className="mb-10">
        <div className="relative w-fit mb-2">
          <h1 className="font-black text-4xl sm:text-5xl text-charcoal tracking-tight">
            마이페이지
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
      </div>

      {/* ── 프로필 편집 ── */}
      <ProfileEditSection
        userEmail={user.email ?? ''}
        initialDisplayName={profile?.display_name ?? null}
        initialBio={profile?.bio ?? null}
        initialAvatarUrl={profile?.avatar_url ?? null}
        onSave={updateProfile}
      />

      {/* ════════════════════════════════
          내 판매 식물 (승인된 판매자만)
      ════════════════════════════════ */}
      {sellerStatus === 'approved' && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-black text-xl text-charcoal">내 판매 식물</h2>
              <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-500">
                {myPlants.length}
              </span>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-charcoal text-white
                         rounded-full text-sm font-medium hover:bg-charcoal/80 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5.5 1v9M1 5.5h9"/>
              </svg>
              새 식물 등록
            </Link>
          </div>

          {myPlants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20
                            border border-dashed border-gray-200 rounded-3xl">
              <p className="text-base font-semibold text-gray-300 mb-1">아직 등록한 식물이 없어요</p>
              <p className="text-sm text-gray-300 mb-7">첫 번째 식물을 등록해보세요</p>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 bg-charcoal text-white
                           rounded-full px-6 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                식물 등록하기
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {myPlants.map((plant, i) => {
                const bg = CARD_PASTELS[i % CARD_PASTELS.length]
                return (
                  <li key={plant.id} className="flex items-center gap-4 px-5 py-4">
                    {/* 썸네일 */}
                    <div
                      className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: bg }}
                    >
                      {plant.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={plant.image_url} alt={plant.name}
                             className="w-full h-full object-cover" />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="1.2" className="text-black/20">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                      )}
                    </div>

                    {/* 이름·카테고리 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal truncate">{plant.name}</p>
                      <p className="text-xs text-gray-400">
                        {plant.price.toLocaleString()}원 · {plant.category}
                      </p>
                    </div>

                    {/* 수정·삭제 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/sell/edit/${plant.id}`}
                        className="px-3 py-1.5 border border-gray-200 rounded-full text-xs
                                   text-charcoal hover:border-charcoal transition-colors"
                      >
                        수정
                      </Link>
                      <DeletePlantButton plantId={plant.id} onDelete={deletePlant} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {/* ════════════════════════════════
          내가 쓴 글
      ════════════════════════════════ */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-black text-xl text-charcoal">내가 쓴 글</h2>
          <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-500">
            {myPosts.length}
          </span>
        </div>

        {myPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20
                          border border-dashed border-gray-200 rounded-3xl">
            <p className="text-base font-semibold text-gray-300 mb-1">아직 쓴 글이 없어요</p>
            <p className="text-sm text-gray-300 mb-7">커뮤니티에서 첫 글을 써보세요</p>
            <Link
              href="/community/write"
              className="inline-flex items-center gap-2 bg-charcoal text-white
                         rounded-full px-6 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              글 쓰러 가기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {myPosts.map((post) => {
              const badge = BADGE[post.category] ?? { bg: '#F3F4F6', color: '#6B7280' }
              return (
                <li key={post.id}>
                  <Link
                    href={`/community/${post.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <span
                      className="flex-shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full tracking-wide"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {post.category}
                    </span>
                    <span className="flex-1 text-sm font-medium text-charcoal
                                     group-hover:text-gray-600 transition-colors truncate">
                      {post.title}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-300 hidden sm:block">
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                         className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors">
                      <path d="M5 2l5 5-5 5"/>
                    </svg>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ════════════════════════════════
          찜한 식물
      ════════════════════════════════ */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-black text-xl text-charcoal">찜한 식물</h2>
          <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-500">
            {plants.length}
          </span>
        </div>

        {plants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20
                          border border-dashed border-gray-200 rounded-3xl">
            <p className="text-base font-semibold text-gray-300 mb-1">아직 찜한 식물이 없어요</p>
            <p className="text-sm text-gray-300 mb-7">마음에 드는 식물의 하트를 눌러보세요</p>
            <Link
              href="/plants"
              className="inline-flex items-center gap-2 bg-charcoal text-white
                         rounded-full px-6 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              식물 둘러보기
            </Link>
          </div>
        )}

        {plants.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {plants.map((plant, i) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                index={i}
                isWishlisted={true}
                onToggle={toggleWishlist}
                className=""
              />
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════════
          좋아요한 글
      ════════════════════════════════ */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-black text-xl text-charcoal">좋아요한 글</h2>
          <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-500">
            {likedPosts.length}
          </span>
        </div>

        {likedPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20
                          border border-dashed border-gray-200 rounded-3xl">
            <p className="text-base font-semibold text-gray-300 mb-1">아직 좋아요한 글이 없어요</p>
            <p className="text-sm text-gray-300 mb-7">커뮤니티에서 마음에 드는 글에 좋아요를 눌러보세요</p>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 bg-charcoal text-white
                         rounded-full px-6 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              커뮤니티 보러가기
            </Link>
          </div>
        )}

        {likedPosts.length > 0 && (
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {likedPosts.map((post) => {
              const badge  = BADGE[post.category] ?? { bg: '#F3F4F6', color: '#6B7280' }
              const author = postProfileMap.get(post.user_id ?? '') ?? '알 수 없음'
              return (
                <li key={post.id}>
                  <Link
                    href={`/community/${post.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <span
                      className="flex-shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full tracking-wide"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {post.category}
                    </span>
                    <span className="flex-1 text-sm font-medium text-charcoal
                                     group-hover:text-gray-600 transition-colors truncate">
                      {post.title}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-300 hidden sm:block">
                      {author}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                         className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors">
                      <path d="M5 2l5 5-5 5"/>
                    </svg>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ════════════════════════════════
          계정
      ════════════════════════════════ */}
      <section className="border-t border-gray-100 pt-10">
        <h2 className="font-black text-xl text-charcoal mb-6">계정</h2>
        <div className="flex flex-wrap gap-3">
          {sellerStatus !== 'approved' && (
            <Link href="/seller/apply"
              className="px-5 py-2.5 border border-gray-200 rounded-full text-sm
                         text-charcoal hover:border-charcoal transition-colors">
              판매자 신청
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin"
              className="px-5 py-2.5 border border-gray-200 rounded-full text-sm
                         text-charcoal hover:border-charcoal transition-colors">
              관리자
            </Link>
          )}
          <form action={logout}>
            <button type="submit"
              className="px-5 py-2.5 border border-gray-200 rounded-full text-sm
                         text-gray-400 hover:border-gray-300 hover:text-charcoal transition-colors">
              로그아웃
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}
