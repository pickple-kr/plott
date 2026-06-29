import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WishlistButton } from '@/components/WishlistButton'
import { toggleWishlist } from '@/app/actions/wishlist'

const CARD_PASTELS = ['#FFF8E6', '#EEF4E8', '#F3EEFF', '#FFF0EC', '#E8F4F2']

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  /* 식물 정보 */
  const { data: plant } = await supabase
    .from('plants')
    .select('id, name, price, category, image_url, purchase_url, description, created_at, user_id')
    .eq('id', id)
    .single()

  if (!plant) notFound()

  /* 찜 여부 + 판매자 정보 병렬 조회 */
  const [{ data: wishlistRow }, { data: sellerData }] = await Promise.all([
    user
      ? supabase.from('wishlists').select('id').eq('user_id', user.id).eq('plant_id', id).maybeSingle()
      : Promise.resolve({ data: null }),
    plant.user_id
      ? supabase.from('profiles').select('business_name, owner_name').eq('id', plant.user_id).single()
      : Promise.resolve({ data: null }),
  ])

  const isWishlisted = !!wishlistRow

  /* 이 식물의 index 위치를 알 수 없으므로 id 해시로 파스텔 색상 결정 */
  const pasteIdx = id.charCodeAt(0) % CARD_PASTELS.length
  const bgColor  = CARD_PASTELS[pasteIdx]

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">

      {/* 뒤로가기 */}
      <Link
        href="/plants"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400
                   hover:text-charcoal transition-colors mb-10"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
             stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2L4 7l5 5"/>
        </svg>
        식물 둘러보기로 돌아가기
      </Link>

      {/* ── 본문 2컬럼 레이아웃 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* ── 왼쪽: 사진 ── */}
        <div
          className="rounded-3xl overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: bgColor, minHeight: '320px' }}
        >
          {plant.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plant.image_url}
              alt={plant.name}
              className="block w-full h-auto max-h-[70vh] object-contain"
            />
          ) : (
            <div className="flex items-center justify-center py-24">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-black/10">
                <rect x="6" y="12" width="52" height="40" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="21" cy="26" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 40l13-12 10 10 10-7 19 15"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>

        {/* ── 오른쪽: 정보 ── */}
        <div className="flex flex-col gap-6">

          {/* 카테고리 뱃지 */}
          <div>
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-500">
              {plant.category}
            </span>
          </div>

          {/* 식물 이름 */}
          <div>
            <h1 className="font-black text-3xl sm:text-4xl text-charcoal tracking-tight leading-tight">
              {plant.name}
            </h1>
          </div>

          {/* 가격 */}
          <div>
            <p className="text-2xl font-bold text-charcoal">
              {plant.price.toLocaleString()}
              <span className="text-lg font-normal text-gray-400 ml-1">원</span>
            </p>
          </div>

          {/* 설명 */}
          {plant.description && (
            <div>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                {plant.description}
              </p>
            </div>
          )}

          {/* 구매 버튼 + 찜 버튼 */}
          <div className="flex gap-3 pt-2">
            <a
              href={plant.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2
                         bg-charcoal text-white rounded-full py-4 text-sm font-medium
                         hover:bg-charcoal-soft transition-colors"
            >
              구매하러 가기
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 10L10 2M10 2H5M10 2V7"/>
              </svg>
            </a>

            {/* 찜 버튼 */}
            <WishlistButton
              plantId={plant.id}
              initialWishlisted={isWishlisted}
              onToggle={toggleWishlist}
              size={20}
              className="w-14 h-14 flex items-center justify-center rounded-full
                         border border-gray-200 text-gray-300 flex-shrink-0
                         hover:border-red-200"
            />
          </div>

          {/* 판매자 정보 — 클릭하면 판매자 페이지로 이동 */}
          {sellerData && (sellerData.business_name || sellerData.owner_name) && plant.user_id && (
            <div className="border-t border-gray-100 pt-5 mt-2">
              <p className="text-xs text-gray-400 mb-2">판매자 정보</p>
              <Link
                href={`/seller/${plant.user_id}`}
                className="flex items-center gap-3 group w-fit"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0
                                group-hover:bg-gray-200 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                       className="text-gray-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  {sellerData.business_name && (
                    <p className="text-sm font-medium text-charcoal group-hover:text-gray-600 transition-colors">
                      {sellerData.business_name}
                    </p>
                  )}
                  {sellerData.owner_name && (
                    <p className="text-xs text-gray-400">{sellerData.owner_name}</p>
                  )}
                </div>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                     className="text-gray-300 group-hover:text-gray-400 transition-colors ml-1">
                  <path d="M4 2l5 4.5L4 11"/>
                </svg>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
