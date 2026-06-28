import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from './PostForm'

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await searchParams

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">글쓰기</h1>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <PostForm userId={user.id} />
    </main>
  )
}
