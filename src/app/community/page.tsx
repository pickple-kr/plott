import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES = ['자랑', '고민', '팁', '자유']

const BADGE: Record<string, { bg: string; color: string }> = {
  '자랑': { bg: '#FBEAF0', color: '#993556' },
  '고민': { bg: '#FAEEDA', color: '#854F0B' },
  '팁':   { bg: '#E1F5EE', color: '#0F6E56' },
  '자유': { bg: '#F3F4F6', color: '#6B7280' },
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
    .select('id, category, title, created_at, user_id, comments(count), likes(count)')
    .order('created_at', { ascending: false })

  if (category && CATEGORIES.includes(category)) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = (data ?? []) as any[]

  /* 작성자 이메일: user_id 목록으로 profiles 따로 조회 */
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

      {/* 빈 상태 */}
      {!error && posts.length === 0 && (
        <div className="text-center py-32">
          <p className="font-serif text-2xl text-gray-200 mb-4">아직 게시글이 없어요</p>
          {user ? (
            <Link href="/community/write" className="text-sm text-forest hover:underline">첫 글을 써보세요 →</Link>
          ) : (
            <Link href="/login" className="text-sm text-forest hover:underline">로그인하고 첫 글을 써보세요 →</Link>
          )}
        </div>
      )}

      {/* ── 게시글 목록 ── */}
      {posts.length > 0 && (
        <div className="border-t border-gray-100">
          {posts.map((post) => {
            const commentCount = Number(post.comments?.[0]?.count ?? 0)
            const badge        = BADGE[post.category] ?? { bg: '#F3F4F6', color: '#6B7280' }
            const displayName  = profileMap.get(post.user_id) ?? '익명'

            return (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="flex items-center gap-3 sm:gap-4 py-4 border-b border-gray-100
                           hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
              >
                {/* 카테고리 뱃지 */}
                <span
                  className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded"
                  style={{ backgroundColor: badge.bg, color: badge.color }}
                >
                  {post.category}
                </span>

                {/* 제목 */}
                <span className="flex-1 text-sm font-medium text-charcoal truncate">
                  {post.title}
                </span>

                {/* 댓글 수 */}
                <span className="flex-shrink-0 text-xs text-gray-400">
                  댓글 {commentCount}
                </span>

                {/* 작성자 */}
                <span className="flex-shrink-0 text-xs text-gray-300 hidden sm:block">
                  {displayName}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
