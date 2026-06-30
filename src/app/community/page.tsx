import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES = ['자랑', '고민', '팁', '자유']

const BADGE: Record<string, { bg: string; color: string }> = {
  '자랑': { bg: '#FF6BAC', color: '#fff' },
  '고민': { bg: '#FCD34D', color: '#0A0A0A' },
  '팁':   { bg: '#4A5340', color: '#fff' },
  '자유': { bg: '#E5E7EB', color: '#6B7280' },
}

const PLACEHOLDER_BG: Record<string, string> = {
  '자랑': '#FBEAF0',
  '고민': '#FAEEDA',
  '팁':   '#E1F5EE',
  '자유': '#F3F4F6',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('posts')
    .select('id, category, title, created_at, user_id, image_url, image_urls, comments(count), likes(count)')
    .order('created_at', { ascending: false })

  if (category && CATEGORIES.includes(category)) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = (data ?? []) as any[]

  /* 작성자 닉네임 */
  const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))]
  const { data: profilesData } = userIds.length > 0
    ? await supabase.from('profiles').select('id, email, display_name').in('id', userIds)
    : { data: [] as { id: string; email: string; display_name: string | null }[] }
  const profileMap = new Map(
    (profilesData ?? []).map((p) => [
      p.id,
      p.display_name || p.email?.split('@')[0] || '익명',
    ])
  )

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">

      {/* ── 페이지 제목 ── */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="relative w-fit mb-2">
            <h1 className="font-black text-4xl sm:text-5xl text-charcoal tracking-tight">
              커뮤니티
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
          <p className="text-sm text-gray-400 mt-3">식물 자랑, 고민, 팁을 나눠요</p>
        </div>

        {user ? (
          <Link
            href="/community/write"
            className="px-5 py-2 bg-charcoal text-white text-sm font-medium rounded-full
                       hover:bg-charcoal-soft transition-colors"
          >
            글쓰기
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-5 py-2 border border-gray-200 text-gray-500 text-sm font-medium
                       rounded-full hover:border-charcoal hover:text-charcoal transition-colors"
          >
            로그인하고 글쓰기
          </Link>
        )}
      </div>

      {/* ── 카테고리 필터 ── */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/community"
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
            href={`/community?category=${encodeURIComponent(cat)}`}
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

      {error && <p className="text-sm text-red-500 mb-4">불러오기 실패: {error.message}</p>}

      {/* ── 빈 상태 ── */}
      {!error && posts.length === 0 && (
        <div className="text-center py-32">
          <p className="text-2xl text-gray-200 mb-4">아직 게시글이 없어요</p>
          {user ? (
            <Link href="/community/write" className="text-sm text-forest hover:underline">첫 글을 써보세요 →</Link>
          ) : (
            <Link href="/login" className="text-sm text-forest hover:underline">로그인하고 첫 글을 써보세요 →</Link>
          )}
        </div>
      )}

      {/* ── 카드 그리드 ── */}
      {posts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {posts.map((post) => {
            const commentCount  = Number(post.comments?.[0]?.count ?? 0)
            const likeCount     = Number(post.likes?.[0]?.count ?? 0)
            const badge         = BADGE[post.category] ?? { bg: '#E5E7EB', color: '#6B7280' }
            const placeholderBg = PLACEHOLDER_BG[post.category] ?? '#F3F4F6'
            const displayName   = profileMap.get(post.user_id) ?? '익명'
            const thumbUrl      = post.image_urls?.[0] ?? post.image_url ?? null

            return (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="group rounded-2xl overflow-hidden bg-white border border-gray-100
                           hover:shadow-md hover:shadow-black/5 transition-shadow"
              >
                {/* 대표 이미지 */}
                <div
                  className="relative aspect-square w-full overflow-hidden"
                  style={{ backgroundColor: placeholderBg }}
                >
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="36" height="36" viewBox="0 0 40 40" fill="none"
                           className="text-black/10">
                        <path d="M20 6 Q28 14 28 22 A8 8 0 1 1 12 22 Q12 14 20 6Z"
                              stroke="currentColor" strokeWidth="1.2" fill="none"
                              strokeLinecap="round"/>
                        <line x1="20" y1="22" x2="20" y2="34"
                              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M16 28 Q20 25 24 28"
                              stroke="currentColor" strokeWidth="1.2" fill="none"
                              strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}

                  {/* 카테고리 뱃지 */}
                  <span
                    className="absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {post.category}
                  </span>
                </div>

                {/* 텍스트 영역 */}
                <div className="px-3 py-3">
                  <p className="text-sm font-medium text-charcoal leading-snug line-clamp-2 mb-2">
                    {post.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 truncate max-w-[60%]">
                      {displayName}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-gray-300 flex-shrink-0">
                      <span className="flex items-center gap-0.5">
                        ♥ {likeCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {commentCount}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1">{timeAgo(post.created_at)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
