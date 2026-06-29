import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { toggleLike, createComment, deleteComment, deletePost } from '@/app/actions/community'

const BADGE: Record<string, { bg: string; color: string }> = {
  '자랑': { bg: '#FF6BAC', color: '#fff' },
  '고민': { bg: '#FCD34D', color: '#0A0A0A' },
  '팁':   { bg: '#4A5340', color: '#fff' },
  '자유': { bg: '#E5E7EB', color: '#6B7280' },
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

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: post }, { data: comments }, { data: likes }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).single(),
    supabase.from('comments').select('id, content, created_at, user_id').eq('post_id', id).order('created_at'),
    supabase.from('likes').select('user_id').eq('post_id', id),
  ])

  if (!post) notFound()

  const likeCount    = likes?.length ?? 0
  const userHasLiked = user ? (likes ?? []).some((l) => l.user_id === user.id) : false
  const isOwnPost    = user?.id === post.user_id
  const badge        = BADGE[post.category] ?? { bg: '#E5E7EB', color: '#6B7280' }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
      <div className="max-w-2xl">

        {/* 뒤로가기 */}
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-charcoal transition-colors mb-8"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 2L4 7l5 5"/>
          </svg>
          커뮤니티로 돌아가기
        </Link>

        {/* ── 게시글 본문 ── */}
        <article>
          {/* 카테고리 뱃지 + 시간 */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-[11px] font-black px-2.5 py-1 rounded-full tracking-wide"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {post.category}
            </span>
            <span className="text-xs text-gray-300">{timeAgo(post.created_at)}</span>
          </div>

          {/* 제목 */}
          <h1 className="font-black text-2xl sm:text-3xl text-charcoal tracking-tight leading-snug mb-6">
            {post.title}
          </h1>

          {/* 사진 */}
          {post.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.image_url}
              alt={post.title}
              className="block mx-auto max-w-full w-auto h-auto max-h-[80vh] rounded-2xl mb-6"
            />
          )}

          {/* 본문 */}
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </article>

        {/* ── 좋아요 · 삭제 ── */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 mb-10">
          <form action={toggleLike}>
            <input type="hidden" name="post_id" value={post.id} />
            <button
              type="submit"
              className={`flex items-center gap-2 text-sm px-5 py-2 rounded-full border font-medium transition-colors ${
                userHasLiked
                  ? 'bg-charcoal text-white border-charcoal'
                  : 'border-gray-200 text-gray-500 hover:border-charcoal hover:text-charcoal'
              }`}
            >
              {userHasLiked ? '♥' : '♡'}&nbsp;좋아요 {likeCount}
            </button>
          </form>

          {!user && (
            <Link href="/login" className="text-xs text-gray-400 hover:text-charcoal transition-colors">
              로그인하면 좋아요를 누를 수 있어요
            </Link>
          )}

          {isOwnPost && (
            <form action={deletePost} className="ml-auto">
              <input type="hidden" name="post_id" value={post.id} />
              <button type="submit" className="text-xs text-gray-400 hover:text-red-400 transition-colors">
                글 삭제
              </button>
            </form>
          )}
        </div>

        {/* ── 댓글 ── */}
        <section>
          <h2 className="font-semibold text-sm text-charcoal mb-5">
            댓글 <span className="text-gray-400 font-normal">{comments?.length ?? 0}개</span>
          </h2>

          {/* 댓글 목록 */}
          <div className="space-y-3 mb-6">
            {(comments ?? []).length === 0 && (
              <p className="text-sm text-gray-400 py-6 text-center">
                아직 댓글이 없어요. 첫 댓글을 달아보세요!
              </p>
            )}
            {(comments ?? []).map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
                  <p className="text-sm text-charcoal whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                  <p className="text-[11px] text-gray-300 mt-1.5">{timeAgo(comment.created_at)}</p>
                </div>
                {user?.id === comment.user_id && (
                  <form action={deleteComment} className="flex-shrink-0 pt-2">
                    <input type="hidden" name="comment_id" value={comment.id} />
                    <input type="hidden" name="post_id"    value={post.id} />
                    <button type="submit"
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                      삭제
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>

          {/* 댓글 입력 */}
          {user ? (
            <form action={createComment} className="flex gap-2">
              <input type="hidden" name="post_id" value={post.id} />
              <input
                name="content"
                type="text"
                required
                placeholder="댓글을 입력하세요"
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm
                           outline-none focus:border-charcoal transition-colors bg-white"
              />
              <button
                type="submit"
                className="bg-charcoal text-white text-sm px-5 py-2 rounded-full
                           hover:bg-charcoal-soft transition-colors whitespace-nowrap"
              >
                등록
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="block text-center text-sm text-gray-400 border border-gray-200
                         rounded-2xl py-3 hover:border-charcoal hover:text-charcoal transition-colors"
            >
              로그인하고 댓글 달기
            </Link>
          )}
        </section>

      </div>
    </div>
  )
}
