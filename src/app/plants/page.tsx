import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES = ['관엽식물', '다육·선인장', '허브', '꽃·화분']

export default async function PlantsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('plants')
    .select('id, name, price, category, image_url, purchase_url, created_at')
    .order('created_at', { ascending: false })

  if (category && CATEGORIES.includes(category)) {
    query = query.eq('category', category)
  }

  const { data: plants, error } = await query

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">식물 둘러보기</h1>
        <Link
          href="/sell"
          className="text-sm border border-gray-300 rounded px-3 py-1.5 hover:border-black transition-colors"
        >
          식물 등록
        </Link>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/plants"
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            !category
              ? 'bg-black text-white border-black'
              : 'border-gray-300 text-gray-600 hover:border-black hover:text-black'
          }`}
        >
          전체
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/plants?category=${encodeURIComponent(cat)}`}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              category === cat
                ? 'bg-black text-white border-black'
                : 'border-gray-300 text-gray-600 hover:border-black hover:text-black'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">데이터를 불러오지 못했어요: {error.message}</p>
      )}

      {!error && plants && plants.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg mb-2">아직 등록된 식물이 없어요</p>
          <Link href="/sell" className="text-sm underline text-gray-500 hover:text-black">
            첫 번째 식물을 등록해보세요
          </Link>
        </div>
      )}

      {plants && plants.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {plants.map((plant) => (
            <div key={plant.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 transition-colors">
              {/* 식물 사진 */}
              <div className="relative aspect-square bg-gray-50">
                {plant.image_url ? (
                  <Image
                    src={plant.image_url}
                    alt={plant.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* 식물 정보 */}
              <div className="p-3 space-y-1">
                <span className="text-xs text-gray-400">{plant.category}</span>
                <p className="text-sm font-medium leading-snug">{plant.name}</p>
                <p className="text-sm font-semibold">{plant.price.toLocaleString()}원</p>
              </div>

              {/* 구매 버튼 */}
              <div className="px-3 pb-3">
                <a
                  href={plant.purchase_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-xs border border-gray-300 rounded py-1.5 text-gray-600 hover:bg-black hover:text-white hover:border-black transition-colors"
                >
                  구매하러 가기
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
