import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BannerUploadForm } from '@/components/BannerUploadForm'
import { toggleBanner, deleteBanner, moveBannerUp, moveBannerDown } from '@/app/actions/banners'

export default async function AdminBannersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!me?.is_admin) redirect('/')

  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('order_index', { ascending: true })

  const list = banners ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin"
          className="text-sm text-gray-400 hover:text-charcoal transition-colors"
        >
          ← 관리자
        </Link>
        <h1 className="text-2xl font-semibold text-charcoal">배너 관리</h1>
        <span className="text-sm text-gray-400">총 {list.length}개</span>
      </div>

      {/* 업로드 폼 */}
      <BannerUploadForm />

      {/* 배너 목록 */}
      <div className="mt-8 space-y-3">
        {list.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-16">
            아직 등록된 배너가 없어요.
            <br />
            <span className="text-xs">위에서 첫 번째 배너를 추가해보세요!</span>
          </p>
        )}

        {list.map((banner, i) => (
          <div
            key={banner.id}
            className={`border rounded-xl p-4 flex gap-4 items-center ${
              banner.active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            {/* 썸네일 */}
            <div className="relative w-36 h-[72px] rounded-lg overflow-hidden bg-gray-100 shrink-0">
              <Image
                src={banner.image_url}
                alt={`배너 ${i + 1}`}
                fill
                className="object-cover"
                sizes="144px"
              />
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">#{i + 1}</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    banner.active
                      ? 'bg-lime/40 text-charcoal'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {banner.active ? '표시 중' : '숨김'}
                </span>
              </div>
              {banner.link_url && (
                <p className="text-[11px] text-gray-400 truncate">
                  링크: {banner.link_url}
                </p>
              )}
              <p className="text-[11px] text-gray-300">
                {new Date(banner.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>

            {/* 버튼 모음 */}
            <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">

              {/* ↑ 순서 올리기 */}
              <form action={moveBannerUp}>
                <input type="hidden" name="id"          value={banner.id} />
                <input type="hidden" name="order_index" value={banner.order_index} />
                <button
                  type="submit"
                  disabled={i === 0}
                  className="w-8 h-8 border border-gray-200 rounded text-sm
                             hover:bg-gray-50 disabled:opacity-25 transition-colors"
                  title="순서 올리기"
                >
                  ↑
                </button>
              </form>

              {/* ↓ 순서 내리기 */}
              <form action={moveBannerDown}>
                <input type="hidden" name="id"          value={banner.id} />
                <input type="hidden" name="order_index" value={banner.order_index} />
                <button
                  type="submit"
                  disabled={i === list.length - 1}
                  className="w-8 h-8 border border-gray-200 rounded text-sm
                             hover:bg-gray-50 disabled:opacity-25 transition-colors"
                  title="순서 내리기"
                >
                  ↓
                </button>
              </form>

              {/* 활성/비활성 토글 */}
              <form action={toggleBanner}>
                <input type="hidden" name="id"     value={banner.id} />
                <input type="hidden" name="active" value={String(banner.active)} />
                <button
                  type="submit"
                  className="px-3 h-8 border border-gray-200 rounded text-xs
                             hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {banner.active ? '숨기기' : '표시하기'}
                </button>
              </form>

              {/* 삭제 */}
              <form action={deleteBanner}>
                <input type="hidden" name="id"        value={banner.id} />
                <input type="hidden" name="image_url" value={banner.image_url} />
                <button
                  type="submit"
                  className="px-3 h-8 border border-red-200 text-red-500 rounded text-xs
                             hover:bg-red-50 transition-colors"
                >
                  삭제
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
