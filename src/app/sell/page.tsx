import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlantForm } from './PlantForm'

const GATE_MESSAGE: Record<string, { title: string; desc: string; btn: string }> = {
  none: {
    title: '판매자 인증이 필요해요',
    desc:  '식물을 등록하려면 먼저 사업자 인증을 신청해야 해요.',
    btn:   '판매자 신청하기',
  },
  pending: {
    title: '인증 심사 중이에요',
    desc:  '사업자 인증 심사가 진행 중이에요. 승인 후에 식물을 등록할 수 있어요.',
    btn:   '신청 현황 보기',
  },
  rejected: {
    title: '인증이 반려됐어요',
    desc:  '사업자 인증이 반려됐어요. 내용을 수정하고 다시 신청해주세요.',
    btn:   '다시 신청하기',
  },
}

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('seller_status')
    .eq('id', user.id)
    .single()

  const status = profile?.seller_status ?? 'none'

  /* ── 미승인: 안내 화면 ── */
  if (status !== 'approved') {
    const msg = GATE_MESSAGE[status] ?? GATE_MESSAGE.none
    return (
      <main className="max-w-lg mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-xl font-semibold">{msg.title}</p>
        <p className="text-sm text-gray-500">{msg.desc}</p>
        <Link
          href="/seller/apply"
          className="inline-block bg-black text-white text-sm px-5 py-2.5 rounded"
        >
          {msg.btn}
        </Link>
      </main>
    )
  }

  /* ── 승인된 판매자: 등록 폼 ── */
  const { error } = await searchParams

  return (
    <main className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">식물 등록</h1>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <PlantForm userId={user.id} />
    </main>
  )
}
