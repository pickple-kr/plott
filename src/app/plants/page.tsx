import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlantCard } from '@/components/PlantCard'
import { toggleWishlist } from '@/app/actions/wishlist'
import { PLANT_CATEGORIES } from '@/lib/constants'

export default async function PlantsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('plants')
    .select('id, name, price, category, image_url, purchase_url, description, created_at')
    .order('created_at', { ascending: false })

  if (category && PLANT_CATEGORIES.includes(category)) {
    query = query.eq('category', category)
  }

  const [{ data: plants, error }, { data: wishlistData }] = await Promise.all([
    query,
    user
      ? supabase.from('wishlists').select('plant_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] as { plant_id: string }[] }),
  ])

  const wishlistSet = new Set((wishlistData ?? []).map((w) => w.plant_id))

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">

      {/* ── 페이지 제목 ── */}
      <div className="mb-10">
        <div className="relative w-fit mb-2">
          <h1 className="font-black text-4xl sm:text-5xl text-charcoal tracking-tight">
            식물 둘러보기
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
        <p className="text-sm text-gray-400 mt-3">지금 만날 수 있는 모든 식물</p>
      </div>

      {/* ── 카테고리 필터 ── */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/plants"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category
              ? 'bg-charcoal text-white'
              : 'border border-gray-200 text-gray-500 hover:border-charcoal hover:text-charcoal'
          }`}
        >
          전체
        </Link>
        {PLANT_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/plants?category=${encodeURIComponent(cat)}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-charcoal text-white'
                : 'border border-gray-200 text-gray-500 hover:border-charcoal hover:text-charcoal'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* ── 에러 ── */}
      {error && (
        <p className="text-sm text-red-500 mb-4">데이터를 불러오지 못했어요: {error.message}</p>
      )}

      {/* ── 빈 상태 ── */}
      {!error && plants && plants.length === 0 && (
        <div className="text-center py-32">
          <p className="font-serif text-2xl text-gray-200 mb-4">아직 등록된 식물이 없어요</p>
          <Link href="/sell" className="text-sm text-forest hover:underline">
            첫 번째 식물을 등록해보세요 →
          </Link>
        </div>
      )}

      {/* ── 식물 그리드 ── */}
      {plants && plants.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {plants.map((plant, i) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              index={i}
              isWishlisted={wishlistSet.has(plant.id)}
              onToggle={toggleWishlist}
              showBadge
              className=""
            />
          ))}
        </div>
      )}
    </div>
  )
}
