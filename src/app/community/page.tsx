import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES = ['자랑', '고민', '팁', '자유']

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

type Post = {
  id: string
  category: string
  title: string
  created_at: string
  comments: { count: number }[]
  likes: { count: number }[]
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
    .select('id, category, title, created_at, comments(count), likes(count)')
    .order('created_at', { ascending: false })

  if (category && CATEGORIES.includes(category)) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  const posts = data as Post[] | null

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">커뮤니티</h1>
        {user ? (
          <Link
            href="/community/write"
            className="text-sm bg-black text-white rounded px-3 py-1.5"
          >
            글쓰기
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm border border-gray-300 rounded px-3 py-1.5 text-gray-600"
          >
            로그인하고 글쓰기
          </Link>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Link
          href="/community"
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            !category
              ? 'bg-black text-white border-black'
              : 'border-gray-300 text-gray-600 hover:border-black hover:text-black'
          }`}
        >
          전체
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/community?category=${encodeURIComponent(cat)}`}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              category === cat
                ? 'bg-black text-white border-black'
                : 'border-gray-300 text-gray-600 hover:border-black hover:text-black'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* 에러 */}
      {error && (
        <p className="text-sm text-red-500">불러오기 실패: {error.message}</p>
      )}

      {/* 글 없을 때 */}
      {!error && posts && posts.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <p className="mb-2">아직 게시글이 없어요</p>
          {user ? (
            <Link href="/community/write" className="text-sm underline hover:text-black">
              첫 글을 써보세요
            </Link>
          ) : (
            <Link href="/login" className="text-sm underline hover:text-black">
              로그인하고 첫 글을 써보세요
            </Link>
          )}
        </div>
      )}

      {/* 글 목록 */}
      {posts && posts.length > 0 && (
        <div className="divide-y divide-gray-100">
          {posts.map((post) => {
            const commentCount = Number(post.comments[0]?.count ?? 0)
            const likeCount = Number(post.likes[0]?.count ?? 0)
            return (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block py-4 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-300">{timeAgo(post.created_at)}</span>
                </div>
                <p className="text-sm font-medium">{post.title}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span>댓글 {commentCount}</span>
                  <span>좋아요 {likeCount}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
