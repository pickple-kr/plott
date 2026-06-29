'use client'

export function DeletePlantButton({
  plantId,
  onDelete,
}: {
  plantId: string
  onDelete: (formData: FormData) => Promise<void>
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm('정말 삭제할까요?')) e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} action={onDelete}>
      <input type="hidden" name="plant_id" value={plantId} />
      <button
        type="submit"
        className="px-3 py-1.5 border border-gray-200 rounded-full text-xs
                   text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors"
      >
        삭제
      </button>
    </form>
  )
}
