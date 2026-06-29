import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlantCard } from '@/components/PlantCard'
import { FollowButton } from '@/components/FollowButton'
import { toggleWishlist } from '@/app/actions/wishlist'
import { toggleFollow } from '@/app/actions/follow'

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  /* 판매자 프로필 · 식물 · 찜 목록 · 팔로워 수 · 내 팔로우 여부 병렬 조회 */
  const [
    { data: seller },
    { data: plants },
    { data: wishlistData },
    { count: followerCount },
    { data: followRow },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, business_name, owner_name, seller_status')
      .eq('id', id)
      .single(),
    supabase
      .from('plants')
      .select('id, name, price, category, image_url, purchase_url, description')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    user
      ? supabase.from('wishlists').select('plant_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] as { plant_id: string }[] }),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', id),
    user
      ? supabase.from('follows').select('id')
          .eq('follower_id', user.id).eq('seller_id', id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  /* 판매자가 없거나 미승인이면 404 */
  if (!seller || seller.seller_status !== 'approved') notFound()

  const wishlistSet   = new Set((wishlistData ?? []).map(w => w.plant_id))
  const plantList     = plants ?? []
  const isFollowing   = !!followRow
  const totalFollower = followerCount ?? 0
  const isSelf        = user?.id === id

  const displayName = seller.business_name || seller.owner_name || '판매자'

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

      {/* ── 판매자 프로필 헤더 ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12
                      pb-10 border-b border-gray-100">

        {/* 아바타 */}
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
               className="text-gray-300">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>

        {/* 이름 + 통계 */}
        <div className="flex-1">
          <h1 className="font-black text-2xl sm:text-3xl text-charcoal tracking-tight mb-1">
            {displayName}
          </h1>
          {seller.owner_name && seller.business_name && (
            <p className="text-sm text-gray-400 mb-3">{seller.owner_name}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-sm text-charcoal">
              <span className="font-bold">{plantList.length}</span>
              <span className="text-gray-400">식물</span>
            </span>
            {/* 본인 페이지에서만 팔로워 수 정적 표시 (FollowButton이 없으므로) */}
            {isSelf && (
              <>
                <span className="w-px h-3 bg-gray-200"/>
                <span className="inline-flex items-center gap-1.5 text-sm text-charcoal">
                  <span className="font-bold">{totalFollower}</span>
                  <span className="text-gray-400">팔로워</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* 팔로우 버튼 (팔로워 수 포함) — 본인이면 숨김 */}
        {!isSelf && (
          <FollowButton
            sellerId={id}
            initialFollowing={isFollowing}
            followerCount={totalFollower}
            onToggle={toggleFollow}
          />
        )}
        {isSelf && (
          <span className="px-6 py-2.5 rounded-full border border-gray-200 text-sm text-gray-400 select-none">
            내 스토어
          </span>
        )}
      </div>

      {/* ── 식물 목록 ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-black text-xl text-charcoal">판매 식물</h2>
          <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-500">
            {plantList.length}
          </span>
        </div>

        {plantList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28
                          border border-dashed border-gray-200 rounded-3xl">
            <p className="text-base font-semibold text-gray-300 mb-1">아직 등록한 식물이 없어요</p>
            <p className="text-sm text-gray-300">곧 새 식물이 올라올 거예요</p>
          </div>
        )}

        {plantList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {plantList.map((plant, i) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                index={i}
                isWishlisted={wishlistSet.has(plant.id)}
                onToggle={toggleWishlist}
                className=""
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
