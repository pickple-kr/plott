import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlantForm } from '@/app/sell/PlantForm'
import { updatePlant } from '@/app/actions/plants'

export default async function EditPlantPage({
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

  const [{ data: plant }, { data: profile }] = await Promise.all([
    supabase
      .from('plants')
      .select('id, name, price, category, description, purchase_url, image_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('seller_status')
      .eq('id', user.id)
      .single(),
  ])

  if (!plant) notFound()
  if (profile?.seller_status !== 'approved') redirect('/my')

  return (
    <main className="max-w-lg mx-auto px-6 py-12">
      <Link
        href="/my"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400
                   hover:text-charcoal transition-colors mb-8"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
             stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2L4 7l5 5"/>
        </svg>
        마이페이지로 돌아가기
      </Link>

      <h1 className="text-2xl font-semibold mb-6">식물 수정</h1>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <PlantForm userId={user.id} plant={plant} action={updatePlant} />
    </main>
  )
}
