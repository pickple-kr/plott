'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addBanner } from '@/app/actions/banners'

export function BannerUploadForm() {
  const [uploading, setUploading] = useState(false)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const file = fileRef.current?.files?.[0]
    if (!file) { setError('이미지를 선택해주세요'); return }

    /* await 전에 미리 값을 꺼내 저장 — currentTarget은 비동기 후 null이 됨 */
    const linkUrl = (e.currentTarget.elements.namedItem('link_url') as HTMLInputElement)?.value ?? ''

    setUploading(true)
    try {
      /* 1. Supabase Storage에 이미지 업로드 */
      const supabase = createClient()
      const ext      = file.name.split('.').pop() ?? 'jpg'
      const fileName = `banner-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('banner-images')
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      /* 2. 공개 URL 가져오기 */
      const { data: { publicUrl } } = supabase.storage
        .from('banner-images')
        .getPublicUrl(fileName)

      /* 3. DB에 배너 저장 — FormData를 직접 만들어서 값 주입 */
      const formData = new FormData()
      formData.set('image_url', publicUrl)
      if (linkUrl) formData.set('link_url', linkUrl)

      await addBanner(formData)

      /* 초기화 */
      formRef.current?.reset()
      setPreview(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '업로드에 실패했어요')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="border border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 space-y-4"
    >
      <h2 className="font-semibold text-sm text-charcoal">새 배너 추가</h2>

      {/* 이미지 선택 */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">
          배너 이미지 <span className="text-red-400">*</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) setPreview(URL.createObjectURL(f))
            else   setPreview(null)
          }}
          className="block w-full text-sm text-gray-500
                     file:mr-3 file:py-1.5 file:px-4
                     file:rounded file:border-0
                     file:text-xs file:font-semibold
                     file:bg-charcoal file:text-white
                     hover:file:bg-gray-800 cursor-pointer"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          JPG / PNG / WEBP · 최대 5MB · 가로로 긴 이미지 권장 (예: 1920×600)
        </p>

        {/* 이미지 미리보기 */}
        {preview && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="미리보기"
              className="w-full max-h-44 object-cover"
            />
            <span className="absolute top-2 left-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded">
              미리보기
            </span>
          </div>
        )}
      </div>

      {/* 클릭 링크 (선택) */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">
          클릭 시 이동 URL <span className="text-gray-300">(선택 — 광고 배너면 입력)</span>
        </label>
        <input
          name="link_url"
          type="url"
          placeholder="https://example.com"
          className="w-full border border-gray-200 rounded-lg px-3 py-2
                     text-sm outline-none focus:border-charcoal transition-colors bg-white"
        />
      </div>

      {/* 에러 / 성공 메시지 */}
      {error   && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">배너가 추가됐어요!</p>}

      <button
        type="submit"
        disabled={uploading}
        className="px-6 py-2.5 bg-charcoal text-white text-sm font-medium rounded-lg
                   hover:bg-charcoal-soft transition-colors disabled:opacity-50"
      >
        {uploading ? '업로드 중…' : '배너 추가'}
      </button>
    </form>
  )
}
