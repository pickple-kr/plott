import { PlantCard, PlantCardData } from './PlantCard'

type CollectionPlantEntry = {
  id: string
  order_index: number
  plants: PlantCardData | null
}

export type CollectionData = {
  id: string
  title: string
  description: string | null
  emoji: string | null
  collection_plants: CollectionPlantEntry[]
}

export function CollectionSection({
  collection,
  wishlistSet,
  onToggle,
}: {
  collection: CollectionData
  wishlistSet: Set<string>
  onToggle: (plantId: string) => Promise<void>
}) {
  const plants = [...collection.collection_plants]
    .sort((a, b) => a.order_index - b.order_index)
    .map(cp => cp.plants)
    .filter((p): p is PlantCardData => p !== null)

  if (plants.length === 0) return null

  return (
    <div className="py-3">

      {/* 섹션 헤더 */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mb-3 flex items-baseline gap-2.5">
        <h2 className="font-semibold text-lg sm:text-xl text-charcoal shrink-0">
          {collection.emoji && (
            <span className="mr-2 font-normal">{collection.emoji}</span>
          )}
          {collection.title}
        </h2>
        {collection.description && (
          <p className="text-sm text-gray-400">{collection.description}</p>
        )}
      </div>

      {/* 가로 스크롤 */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 sm:gap-4 px-6 sm:px-8 max-w-7xl mx-auto">
          {plants.map((plant, i) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              index={i}
              isWishlisted={wishlistSet.has(plant.id)}
              onToggle={onToggle}
              className="flex-shrink-0 w-[168px] sm:w-[184px]"
            />
          ))}
          <div className="flex-shrink-0 w-2" />
        </div>
      </div>
    </div>
  )
}
