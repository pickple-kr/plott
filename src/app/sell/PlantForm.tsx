'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { PLANT_CATEGORIES } from '@/lib/constants'

type Plant = {
  id: string
  name: string
  price: number
  category: string
  description: string | null
  purchase_url: string
  image_url: string | null
}

async function resizeImage(file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('이미지 변환 실패'))),
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('이미지를 읽을 수 없어요'))
      img.src = e.target!.result as string
    }
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsDataURL(file)
  })
}

export function PlantForm({
  userId,
  plant,
  action,
}: {
  userId: string
  plant?: Plant
  action: (formData: FormData) => Promise<void>
}) {
  const [preview, setPreview] = useState<string | null>(plant?.image_url ?? null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setPreview(plant?.image_url ?? null); return }
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const file = form.querySelector<HTMLInputElement>('#image')?.files?.[0]

    if (file) {
      try {
        const resized   = await resizeImage(file)
        const fileName  = `${userId}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('plant-images')
          .upload(fileName, resized, { contentType: 'image/jpeg' })

        if (uploadError) {
          setError('사진 업로드 실패: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('plant-images').getPublicUrl(fileName)
        formData.set('image_url', data.publicUrl)
      } catch (err) {
        setError('사진 처리 오류: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
        setLoading(false)
        return
      }
    }

    formData.delete('image')
    await action(formData)
  }

  const isEdit = !!plant

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 수정 모드일 때 plant_id + 기존 이미지 URL hidden 전달 */}
      {isEdit && (
        <>
          <input type="hidden" name="plant_id" value={plant.id} />
          <input type="hidden" name="existing_image_url" value={plant.image_url ?? ''} />
        </>
      )}

      {/* 사진 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          식물 사진 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <label
          htmlFor="image"
          className="flex flex-col items-center justify-center w-full min-h-[200px]
                     border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer
                     hover:border-charcoal hover:bg-gray-50 transition-colors overflow-hidden"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-gray-400 select-none">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <p className="text-sm font-semibold text-charcoal">식물 사진을 올려주세요</p>
              <p className="text-xs text-gray-400">탭하거나 파일을 끌어다 놓으세요</p>
              <p className="text-[11px] text-gray-300 mt-1">폰 사진도 OK — 자동으로 최적화돼요</p>
            </div>
          )}
        </label>
        <input
          id="image" name="image" type="file" accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 식물 이름 */}
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          식물 이름 <span className="text-red-400">*</span>
        </label>
        <input
          id="name" name="name" type="text" required
          defaultValue={plant?.name ?? ''}
          placeholder="예: 몬스테라 델리시오사"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      {/* 가격 */}
      <div className="space-y-1">
        <label htmlFor="price" className="block text-sm font-medium">
          가격 (원) <span className="text-red-400">*</span>
        </label>
        <input
          id="price" name="price" type="number" required min={0}
          defaultValue={plant?.price ?? ''}
          placeholder="예: 15000"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      {/* 카테고리 */}
      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium">
          카테고리 <span className="text-red-400">*</span>
        </label>
        <select
          id="category" name="category" required
          defaultValue={plant?.category ?? ''}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black bg-white"
        >
          <option value="" disabled>선택하세요</option>
          {PLANT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* 설명 */}
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium">
          설명 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <textarea
          id="description" name="description" rows={4}
          defaultValue={plant?.description ?? ''}
          placeholder="식물의 특징, 크기, 관리 방법 등을 적어주세요"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black resize-none"
        />
      </div>

      {/* 구매 링크 */}
      <div className="space-y-1">
        <label htmlFor="purchase_url" className="block text-sm font-medium">
          구매하러 가기 링크 <span className="text-red-400">*</span>
        </label>
        <input
          id="purchase_url" name="purchase_url" type="url" required
          defaultValue={plant?.purchase_url ?? ''}
          placeholder="https://smartstore.naver.com/..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full bg-black text-white rounded py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {loading ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '수정하기' : '등록하기')}
      </button>
    </form>
  )
}
