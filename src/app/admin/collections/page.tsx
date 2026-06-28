import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  createCollection,
  toggleCollection,
  deleteCollection,
  moveCollectionUp,
  moveCollectionDown,
} from '@/app/actions/collections'

export default async function AdminCollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!me?.is_admin) redirect('/')

  /* 큐레이션 목록 + 각 큐레이션의 식물 수 */
  const { data: collections } = await supabase
    .from('collections')
    .select('*, collection_plants(count)')
    .order('order_index', { ascending: true })

  const list = collections ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-charcoal transition-colors">
          ← 관리자
        </Link>
        <h1 className="text-2xl font-semibold text-charcoal">큐레이션 관리</h1>
        <span className="text-sm text-gray-400">총 {list.length}개</span>
      </div>

      {/* 새 큐레이션 만들기 폼 */}
      <form
        action={createCollection}
        className="border border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 space-y-4 mb-8"
      >
        <h2 className="font-semibold text-sm text-charcoal">새 큐레이션 만들기</h2>

        <div className="grid grid-cols-[64px_1fr] gap-3">
          {/* 이모지 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">이모지</label>
            <input
              name="emoji"
              type="text"
              placeholder="🌱"
              maxLength={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-lg
                         text-center outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>
          {/* 제목 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              주제 제목 <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="예: 식물 초보 추천"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>
        </div>

        {/* 부제목 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">
            부제목 <span className="text-gray-300">(선택)</span>
          </label>
          <input
            name="description"
            type="text"
            placeholder="예: 처음 키우기 좋은 식물들"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                       outline-none focus:border-charcoal transition-colors bg-white"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-charcoal text-white text-sm font-medium rounded-lg
                     hover:bg-charcoal-soft transition-colors"
        >
          큐레이션 추가
        </button>
      </form>

      {/* 큐레이션 목록 */}
      <div className="space-y-3">
        {list.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-16">
            아직 만든 큐레이션이 없어요.
            <br />
            <span className="text-xs">위에서 첫 번째 큐레이션을 만들어보세요!</span>
          </p>
        )}

        {list.map((col, i) => {
          const plantCount = (col.collection_plants as { count: number }[])?.[0]?.count ?? 0

          return (
            <div
              key={col.id}
              className={`border rounded-xl p-4 flex items-center gap-4 ${
                col.active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              {/* 이모지 */}
              <div className="text-3xl w-10 text-center shrink-0">
                {col.emoji ?? '📦'}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-charcoal truncate">
                    {col.title}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                      col.active
                        ? 'bg-lime/40 text-charcoal'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {col.active ? '표시 중' : '숨김'}
                  </span>
                </div>
                {col.description && (
                  <p className="text-xs text-gray-400 truncate">{col.description}</p>
                )}
                <p className="text-[11px] text-gray-300 mt-0.5">식물 {plantCount}개</p>
              </div>

              {/* 버튼 모음 */}
              <div className="flex items-center gap-1 shrink-0">

                {/* ↑ */}
                <form action={moveCollectionUp}>
                  <input type="hidden" name="id"          value={col.id} />
                  <input type="hidden" name="order_index" value={col.order_index} />
                  <button type="submit" disabled={i === 0}
                    className="w-8 h-8 border border-gray-200 rounded text-sm
                               hover:bg-gray-50 disabled:opacity-25 transition-colors">
                    ↑
                  </button>
                </form>

                {/* ↓ */}
                <form action={moveCollectionDown}>
                  <input type="hidden" name="id"          value={col.id} />
                  <input type="hidden" name="order_index" value={col.order_index} />
                  <button type="submit" disabled={i === list.length - 1}
                    className="w-8 h-8 border border-gray-200 rounded text-sm
                               hover:bg-gray-50 disabled:opacity-25 transition-colors">
                    ↓
                  </button>
                </form>

                {/* 식물 관리 */}
                <Link
                  href={`/admin/collections/${col.id}`}
                  className="px-3 h-8 flex items-center border border-gray-200 rounded text-xs
                             hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  식물 관리
                </Link>

                {/* 숨기기/표시하기 */}
                <form action={toggleCollection}>
                  <input type="hidden" name="id"     value={col.id} />
                  <input type="hidden" name="active" value={String(col.active)} />
                  <button type="submit"
                    className="px-3 h-8 border border-gray-200 rounded text-xs
                               hover:bg-gray-50 transition-colors whitespace-nowrap">
                    {col.active ? '숨기기' : '표시하기'}
                  </button>
                </form>

                {/* 삭제 */}
                <form action={deleteCollection}>
                  <input type="hidden" name="id" value={col.id} />
                  <button type="submit"
                    className="px-3 h-8 border border-red-200 text-red-500 rounded text-xs
                               hover:bg-red-50 transition-colors">
                    삭제
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
