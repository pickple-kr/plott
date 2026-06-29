import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlantCard } from '@/components/PlantCard'
import { toggleWishlist } from '@/app/actions/wishlist'
import { logout } from '@/app/actions/auth'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase
      .from('wishlists')
      .select('plants(id, name, price, category, image_url, purchase_url, description)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('is_admin, seller_status')
      .eq('id', user.id)
      .single(),
  ])

  type Plant = {
    id: string; name: string; price: number; category: string | null
    image_url: string | null; purchase_url: string; description: string | null
  }

  const plants = (rows ?? [])
    .map(r => r.plants as unknown as Plant | null)
    .filter((p): p is Plant => p !== null)

  const isAdmin      = profile?.is_admin      ?? false
  const sellerStatus = profile?.seller_status ?? 'none'

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">

      {/* ── 페이지 제목 ── */}
      <div className="mb-12">
        <div className="relative w-fit mb-2">
          <h1 className="font-black text-4xl sm:text-5xl text-charcoal tracking-tight">
            마이페이지
          </h1>
          <svg
            className="absolute left-0 w-full overflow-visible pointer-events-none"
            style={{ bottom: '-4px' }}
            height="10" viewBox="0 0 200 10"
            preserveAspectRatio="none" aria-hidden="true"
          >
            <path d="M2 7 C 45 2, 92 9, 135 5 C 168 2, 192 8, 198 5"
                  fill="none" stroke="#FF6BAC" strokeWidth="6"
                  strokeLinecap="round" opacity="0.85"/>
          </svg>
        </div>
        <p className="text-sm text-gray-400 mt-3">{user.email}</p>
      </div>

      {/* ── 찜한 식물 ── */}
      <section className="mb-16">

        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-black text-xl text-charcoal">찜한 식물</h2>
          <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-500">
            {plants.length}
          </span>
        </div>

        {/* 빈 상태 */}
        {plants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28
                          border border-dashed border-gray-200 rounded-3xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                 className="text-gray-200 mb-5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                       a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                       1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <p className="text-lg font-semibold text-gray-300 mb-1">아직 찜한 식물이 없어요</p>
            <p className="text-sm text-gray-300 mb-8">마음에 드는 식물의 하트를 눌러보세요</p>
            <Link
              href="/plants"
              className="inline-flex items-center gap-2 bg-charcoal text-white
                         rounded-full px-6 py-3 text-sm font-medium
                         hover:opacity-80 transition-opacity"
            >
              식물 둘러보기
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
                   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 9L9 2M9 2H4.5M9 2V6.5"/>
              </svg>
            </Link>
          </div>
        )}

        {/* 식물 그리드 */}
        {plants.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {plants.map((plant, i) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                index={i}
                isWishlisted={true}
                onToggle={toggleWishlist}
                className=""
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 계정 ── */}
      <section className="border-t border-gray-100 pt-10">
        <h2 className="font-black text-xl text-charcoal mb-6">계정</h2>
        <div className="flex flex-wrap gap-3">
          {sellerStatus === 'approved' ? (
            <Link href="/sell"
              className="px-5 py-2.5 border border-gray-200 rounded-full text-sm
                         text-charcoal hover:border-charcoal transition-colors">
              식물 등록
            </Link>
          ) : (
            <Link href="/seller/apply"
              className="px-5 py-2.5 border border-gray-200 rounded-full text-sm
                         text-charcoal hover:border-charcoal transition-colors">
              판매자 신청
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin"
              className="px-5 py-2.5 border border-gray-200 rounded-full text-sm
                         text-charcoal hover:border-charcoal transition-colors">
              관리자
            </Link>
          )}
          <form action={logout}>
            <button type="submit"
              className="px-5 py-2.5 border border-gray-200 rounded-full text-sm
                         text-gray-400 hover:border-gray-300 hover:text-charcoal transition-colors">
              로그아웃
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}
