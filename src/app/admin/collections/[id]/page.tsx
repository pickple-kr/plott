import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  addPlantToCollection,
  removePlantFromCollection,
  movePlantUp,
  movePlantDown,
} from '@/app/actions/collections'

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!me?.is_admin) redirect('/')

  /* 이 큐레이션 정보 */
  const { data: collection } = await supabase
    .from('collections')
    .select('id, title, description, emoji')
    .eq('id', id)
    .single()

  if (!collection) notFound()

  /* 이 큐레이션에 이미 들어있는 식물 */
  const { data: added } = await supabase
    .from('collection_plants')
    .select('id, order_index, plants(id, name, image_url, category)')
    .eq('collection_id', id)
    .order('order_index', { ascending: true })

  type PlantInfo = { id: string; name: string; image_url: string | null; category: string }
  type AddedItem = { id: string; order_index: number; plants: PlantInfo | null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addedList: AddedItem[] = (added ?? []) as any

  /* 아직 이 큐레이션에 없는 식물 (추가 가능 목록) */
  const addedPlantIds = addedList.map((item) => item.plants?.id).filter(Boolean)

  let availablePlantsQuery = supabase
    .from('plants')
    .select('id, name, image_url, category')
    .order('name', { ascending: true })

  if (addedPlantIds.length > 0) {
    availablePlantsQuery = availablePlantsQuery.not('id', 'in', `(${addedPlantIds.join(',')})`)
  }

  const { data: availablePlants } = await availablePlantsQuery

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/collections" className="text-sm text-gray-400 hover:text-charcoal transition-colors">
          ← 큐레이션 목록
        </Link>
        <h1 className="text-xl font-semibold text-charcoal">
          {collection.emoji && <span className="mr-1.5">{collection.emoji}</span>}
          {collection.title}
        </h1>
      </div>

      {collection.description && (
        <p className="text-sm text-gray-400 mb-8 -mt-4">{collection.description}</p>
      )}

      {/* ── 식물 추가 폼 ── */}
      {(availablePlants?.length ?? 0) > 0 ? (
        <form
          action={addPlantToCollection}
          className="border border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 flex gap-3 items-end mb-8"
        >
          <input type="hidden" name="collection_id" value={id} />

          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1.5">
              추가할 식물 선택
            </label>
            <select
              name="plant_id"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                         outline-none focus:border-charcoal transition-colors bg-white"
            >
              <option value="">식물을 선택하세요</option>
              {availablePlants?.map(plant => (
                <option key={plant.id} value={plant.id}>
                  {plant.name} ({plant.category})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-charcoal text-white text-sm font-medium rounded-lg
                       hover:bg-charcoal-soft transition-colors whitespace-nowrap"
          >
            추가
          </button>
        </form>
      ) : (
        <div className="border border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 mb-8 text-center">
          <p className="text-sm text-gray-400">
            {addedList.length === 0
              ? '등록된 식물이 없어요. 먼저 식물을 등록해주세요.'
              : '등록된 모든 식물이 이미 이 큐레이션에 들어있어요.'}
          </p>
          {addedList.length === 0 && (
            <Link href="/sell" className="text-xs text-forest hover:underline mt-1 inline-block">
              식물 등록하러 가기 →
            </Link>
          )}
        </div>
      )}

      {/* ── 이 큐레이션의 식물 목록 ── */}
      <h2 className="text-sm font-semibold text-charcoal mb-3">
        이 큐레이션의 식물 <span className="text-gray-400 font-normal">({addedList.length}개)</span>
      </h2>

      {addedList.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12 border border-gray-100 rounded-xl">
          아직 추가된 식물이 없어요.
        </p>
      )}

      <div className="space-y-2">
        {addedList.map((item, i) => {
          const plant = item.plants

          if (!plant) return null

          return (
            <div key={item.id} className="border border-gray-200 rounded-xl p-3 flex items-center gap-3">

              {/* 순서 번호 */}
              <span className="text-xs text-gray-300 w-5 text-center shrink-0">{i + 1}</span>

              {/* 식물 썸네일 */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {plant.image_url ? (
                  <Image src={plant.image_url} alt={plant.name} fill className="object-cover" sizes="48px"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    없음
                  </div>
                )}
              </div>

              {/* 식물 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">{plant.name}</p>
                <p className="text-xs text-gray-400">{plant.category}</p>
              </div>

              {/* 버튼 */}
              <div className="flex items-center gap-1 shrink-0">

                {/* ↑ */}
                <form action={movePlantUp}>
                  <input type="hidden" name="id"            value={item.id} />
                  <input type="hidden" name="collection_id" value={id} />
                  <input type="hidden" name="order_index"   value={item.order_index} />
                  <button type="submit" disabled={i === 0}
                    className="w-7 h-7 border border-gray-200 rounded text-xs
                               hover:bg-gray-50 disabled:opacity-25 transition-colors">
                    ↑
                  </button>
                </form>

                {/* ↓ */}
                <form action={movePlantDown}>
                  <input type="hidden" name="id"            value={item.id} />
                  <input type="hidden" name="collection_id" value={id} />
                  <input type="hidden" name="order_index"   value={item.order_index} />
                  <button type="submit" disabled={i === addedList.length - 1}
                    className="w-7 h-7 border border-gray-200 rounded text-xs
                               hover:bg-gray-50 disabled:opacity-25 transition-colors">
                    ↓
                  </button>
                </form>

                {/* 제거 */}
                <form action={removePlantFromCollection}>
                  <input type="hidden" name="id"            value={item.id} />
                  <input type="hidden" name="collection_id" value={id} />
                  <button type="submit"
                    className="px-2.5 h-7 border border-red-200 text-red-500 rounded text-xs
                               hover:bg-red-50 transition-colors">
                    제거
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
