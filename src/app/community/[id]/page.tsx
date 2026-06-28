import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { toggleLike, createComment, deleteComment, deletePost } from '@/app/actions/community'

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* 뒤로가기 */}
      <Link href="/community" className="text-sm text-gray-400 hover:text-black transition-colors inline-block mb-6">
        ← 목록으로
      </Link>

      {/* ── 게시글 본문 ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
            {post.category}
          </span>
          <span className="text-xs text-gray-300">{timeAgo(post.created_at)}</span>
        </div>

        <h1 className="text-xl font-semibold mb-5">{post.title}</h1>

        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full rounded mb-5 max-h-96 object-cover"
          />
        )}

        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* ── 좋아요 · 글 삭제 ── */}
      <div className="flex items-center gap-3 py-4 border-y border-gray-100 mb-8">
        <form action={toggleLike}>
          <input type="hidden" name="post_id" value={post.id} />
          <button
            type="submit"
            className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border transition-colors ${
              userHasLiked
                ? 'bg-black text-white border-black'
                : 'border-gray-300 text-gray-600 hover:border-black hover:text-black'
            }`}
          >
            {userHasLiked ? '♥' : '♡'}&nbsp;좋아요 {likeCount}
          </button>
        </form>

        {!user && (
          <Link href="/login" className="text-xs text-gray-400 hover:text-black">
            로그인하면 좋아요를 누를 수 있어요
          </Link>
        )}

        {isOwnPost && (
          <form action={deletePost} className="ml-auto">
            <input type="hidden" name="post_id" value={post.id} />
            <button type="submit" className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              글 삭제
            </button>
          </form>
        )}
      </div>

      {/* ── 댓글 ── */}
      <div>
        <h2 className="text-sm font-medium mb-5">댓글 {comments?.length ?? 0}개</h2>

        {/* 댓글 목록 */}
        <div className="space-y-5 mb-6">
          {(comments ?? []).length === 0 && (
            <p className="text-sm text-gray-400">아직 댓글이 없어요. 첫 댓글을 달아보세요!</p>
          )}
          {(comments ?? []).map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                <p className="text-xs text-gray-300 mt-1.5">{timeAgo(comment.created_at)}</p>
              </div>
              {user?.id === comment.user_id && (
                <form action={deleteComment} className="flex-shrink-0 pt-1">
                  <input type="hidden" name="comment_id" value={comment.id} />
                  <input type="hidden" name="post_id" value={post.id} />
                  <button type="submit" className="text-xs text-gray-300 hover:text-red-400 transition-colors">
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
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
            />
            <button
              type="submit"
              className="bg-black text-white text-sm px-4 py-2 rounded whitespace-nowrap"
            >
              등록
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="block text-center text-sm text-gray-400 border border-gray-200 rounded py-3 hover:border-gray-400 transition-colors"
          >
            로그인하고 댓글 달기
          </Link>
        )}
      </div>
    </div>
  )
}
