import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updatePost } from '@/app/actions/community'

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: post }, { data: profile }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).single(),
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
  ])

  if (!post) redirect('/community')

  const isAdmin = profile?.is_admin ?? false
  if (post.user_id !== user.id && !isAdmin) redirect(`/community/${id}`)

  return (
    <div className="max-w-2xl mx-auto px-6 sm:px-8 py-12">
      <h1 className="font-semibold text-xl text-charcoal mb-8">글 수정</h1>

      {error && (
        <p className="mb-4 text-sm text-red-500">{decodeURIComponent(error)}</p>
      )}

      <form action={updatePost} className="space-y-5">
        <input type="hidden" name="post_id" value={post.id} />

        <div>
          <label className="block text-sm font-medium mb-1.5">제목</label>
          <input
            name="title"
            type="text"
            required
            defaultValue={post.title}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                       outline-none focus:border-charcoal transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">내용</label>
          <textarea
            name="content"
            required
            rows={12}
            defaultValue={post.content}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                       outline-none focus:border-charcoal transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-charcoal text-white text-sm font-medium
                       rounded-full hover:bg-charcoal/80 transition-colors"
          >
            수정 완료
          </button>
          <Link
            href={`/community/${id}`}
            className="px-6 py-2.5 border border-gray-200 text-charcoal text-sm font-medium
                       rounded-full hover:border-charcoal transition-colors"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  )
}
