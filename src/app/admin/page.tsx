import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { approveApplication, rejectApplication } from '@/app/actions/seller'

const STATUS_LABEL: Record<string, string> = {
  pending:  '심사중',
  approved: '승인',
  rejected: '반려',
}

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100  text-green-700',
  rejected: 'bg-gray-100   text-gray-500',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '오늘'
  if (days < 7)   return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* ── 관리자 확인 ── */
  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!me?.is_admin) redirect('/')

  /* ── 신청 목록 (none 제외, 심사중 먼저) ── */
  const { data } = await supabase
    .from('profiles')
    .select('id, email, seller_status, business_number, business_name, owner_name, phone, reject_reason, sales_channel_url, created_at')
    .neq('seller_status', 'none')

  const applications = [...(data ?? [])].sort((a, b) => {
    const order: Record<string, number> = { pending: 0, rejected: 1, approved: 2 }
    return (order[a.seller_status] ?? 9) - (order[b.seller_status] ?? 9)
  })

  const pendingCount = applications.filter((a) => a.seller_status === 'pending').length

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl font-semibold">관리자</h1>
        {pendingCount > 0 && (
          <span className="ml-auto text-sm font-medium text-yellow-600">
            심사 대기 {pendingCount}건
          </span>
        )}
      </div>

      {/* 관리자 메뉴 */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        <Link
          href="/admin/banners"
          className="border border-gray-200 rounded-xl p-4 hover:border-charcoal transition-colors"
        >
          <p className="font-semibold text-sm text-charcoal">배너 관리</p>
          <p className="text-xs text-gray-400 mt-1">메인 슬라이드 배너 등록·수정·삭제</p>
        </Link>
        <Link
          href="/admin/collections"
          className="border border-gray-200 rounded-xl p-4 hover:border-charcoal transition-colors"
        >
          <p className="font-semibold text-sm text-charcoal">큐레이션 관리</p>
          <p className="text-xs text-gray-400 mt-1">주제별 식물 묶음 생성·편집</p>
        </Link>
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-lg font-semibold">판매자 신청 목록</h2>
        <span className="text-sm text-gray-400">전체 {applications.length}건</span>
      </div>

      {applications.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-20">아직 신청이 없어요.</p>
      )}

      <div className="space-y-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className={`border rounded-xl p-5 space-y-4 ${
              app.seller_status === 'pending' ? 'border-yellow-200' : 'border-gray-200'
            }`}
          >
            {/* 상단: 상태 + 이메일 + 날짜 */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[app.seller_status]}`}>
                {STATUS_LABEL[app.seller_status]}
              </span>
              <span className="text-sm font-medium">{app.email ?? '(이메일 없음)'}</span>
              <span className="ml-auto text-xs text-gray-300">{timeAgo(app.created_at)}</span>
            </div>

            {/* 사업자 정보 */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <Info label="사업자등록번호" value={app.business_number} />
              <Info label="상호명"         value={app.business_name} />
              <Info label="대표자명"       value={app.owner_name} />
              <Info label="연락처"         value={app.phone} />
            </div>
            {app.sales_channel_url && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 shrink-0">판매 채널</span>
                <a
                  href={app.sales_channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {app.sales_channel_url}
                </a>
              </div>
            )}

            {/* 반려 사유 (있을 때만) */}
            {app.reject_reason && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">
                반려 사유: {app.reject_reason}
              </p>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-1">
              <form action={approveApplication}>
                <input type="hidden" name="profile_id" value={app.id} />
                <button
                  type="submit"
                  disabled={app.seller_status === 'approved'}
                  className="px-4 py-1.5 text-sm bg-black text-white rounded disabled:opacity-30"
                >
                  승인
                </button>
              </form>

              <form action={rejectApplication} className="flex gap-2 flex-1">
                <input type="hidden" name="profile_id" value={app.id} />
                <input
                  name="reject_reason"
                  type="text"
                  placeholder="반려 사유 (선택)"
                  defaultValue={app.reject_reason ?? ''}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-black min-w-0"
                />
                <button
                  type="submit"
                  disabled={app.seller_status === 'rejected'}
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded text-gray-600 hover:border-black disabled:opacity-30 whitespace-nowrap"
                >
                  반려
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-700">{value ?? '-'}</span>
    </div>
  )
}
