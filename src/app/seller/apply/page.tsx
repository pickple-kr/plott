import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { applyAsSeller } from '@/app/actions/seller'

export default async function SellerApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('seller_status, business_number, business_name, owner_name, phone, reject_reason')
    .eq('id', user.id)
    .single()

  const { error } = await searchParams
  const status = profile?.seller_status ?? 'none'

  /* ── 승인 완료 ── */
  if (status === 'approved') {
    return (
      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="border border-gray-200 rounded-xl p-8 text-center space-y-3">
          <p className="text-3xl font-light text-green-600">✓</p>
          <p className="font-semibold text-lg">사업자 인증 완료</p>
          <p className="text-sm text-gray-500">이제 식물을 등록할 수 있어요.</p>
          <Link
            href="/sell"
            className="inline-block mt-2 bg-black text-white text-sm px-5 py-2 rounded"
          >
            식물 등록하러 가기
          </Link>
        </div>
      </main>
    )
  }

  /* ── 심사중 ── */
  if (status === 'pending') {
    return (
      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-6 text-center space-y-2 mb-6">
          <p className="font-semibold text-yellow-700">심사 중</p>
          <p className="text-sm text-yellow-600">신청이 접수됐어요. 관리자 검토 후 결과를 알려드릴게요.</p>
        </div>
        <div className="border border-gray-100 rounded-lg p-5 space-y-3 text-sm">
          <Row label="사업자등록번호" value={profile?.business_number} />
          <Row label="상호명"         value={profile?.business_name} />
          <Row label="대표자명"       value={profile?.owner_name} />
          <Row label="연락처"         value={profile?.phone} />
        </div>
      </main>
    )
  }

  /* ── 신청 폼 (none / rejected) ── */
  return (
    <main className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-2">판매자 신청</h1>
      <p className="text-sm text-gray-500 mb-8">
        사업자 정보를 입력하면 관리자 검토 후 판매자로 승인돼요.
      </p>

      {/* 반려 안내 */}
      {status === 'rejected' && (
        <div className="mb-6 border border-red-100 bg-red-50 rounded-lg p-4">
          <p className="text-sm font-medium text-red-600 mb-1">이전 신청이 반려됐어요</p>
          {profile?.reject_reason && (
            <p className="text-sm text-red-500">사유: {profile.reject_reason}</p>
          )}
          <p className="text-sm text-gray-400 mt-1">내용을 수정한 뒤 다시 신청해주세요.</p>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <form action={applyAsSeller} className="space-y-5">
        <Field
          id="business_number" label="사업자등록번호"
          placeholder="000-00-00000"
          defaultValue={profile?.business_number ?? ''}
        />
        <Field
          id="business_name" label="상호명"
          placeholder="예: 초록식물원"
          defaultValue={profile?.business_name ?? ''}
        />
        <Field
          id="owner_name" label="대표자명"
          placeholder="예: 홍길동"
          defaultValue={profile?.owner_name ?? ''}
        />
        <Field
          id="phone" label="연락처" type="tel"
          placeholder="010-0000-0000"
          defaultValue={profile?.phone ?? ''}
        />

        <button
          type="submit"
          className="w-full bg-black text-white rounded py-2.5 text-sm font-medium"
        >
          신청하기
        </button>
      </form>
    </main>
  )
}

/* ── 작은 컴포넌트 ── */
function Field({
  id, label, placeholder, defaultValue, type = 'text',
}: {
  id: string; label: string; placeholder: string; defaultValue: string; type?: string
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label} <span className="text-red-400">*</span>
      </label>
      <input
        id={id} name={id} type={type} required
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-700">{value ?? '-'}</span>
    </div>
  )
}
