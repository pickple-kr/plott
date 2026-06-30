'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { createPost } from '@/app/actions/community'

const CATEGORIES = ['자랑', '고민', '팁', '자유']
const MAX_IMAGES = 5

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

type PreviewItem = { file: File; previewUrl: string }

export function PostForm({ userId }: { userId: string }) {
  const [previews, setPreviews] = useState<PreviewItem[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const fileInputRef            = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const remaining = MAX_IMAGES - previews.length
    const toAdd = files.slice(0, remaining)

    const newPreviews: PreviewItem[] = toAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPreviews((prev) => [...prev, ...newPreviews])
    // 같은 파일 다시 선택 가능하도록 input 초기화
    e.target.value = ''
  }

  function removeImage(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form     = e.currentTarget
    const formData = new FormData(form)

    // 이미지 업로드
    const uploadedUrls: string[] = []
    for (const item of previews) {
      try {
        const resized  = await resizeImage(item.file)
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, resized, { contentType: 'image/jpeg' })

        if (uploadError) {
          setError('사진 업로드 실패: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('post-images').getPublicUrl(fileName)
        uploadedUrls.push(data.publicUrl)
      } catch (err) {
        setError('사진 처리 오류: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
        setLoading(false)
        return
      }
    }

    // 첫 번째 URL을 image_url(기존 호환), 전체를 image_urls_json으로 전달
    if (uploadedUrls.length > 0) {
      formData.set('image_url', uploadedUrls[0])
    }
    formData.set('image_urls_json', JSON.stringify(uploadedUrls))

    await createPost(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 카테고리 */}
      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium">
          카테고리 <span className="text-red-400">*</span>
        </label>
        <select
          id="category" name="category" required defaultValue=""
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black bg-white"
        >
          <option value="" disabled>선택하세요</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* 제목 */}
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium">
          제목 <span className="text-red-400">*</span>
        </label>
        <input
          id="title" name="title" type="text" required
          placeholder="제목을 입력하세요"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      {/* 내용 */}
      <div className="space-y-1">
        <label htmlFor="content" className="block text-sm font-medium">
          내용 <span className="text-red-400">*</span>
        </label>
        <textarea
          id="content" name="content" required rows={8}
          placeholder="내용을 입력하세요"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black resize-none"
        />
      </div>

      {/* 사진 여러 장 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">
            사진 <span className="text-gray-400 font-normal">(최대 {MAX_IMAGES}장)</span>
          </label>
          {previews.length > 0 && (
            <span className="text-xs text-gray-400">{previews.length}/{MAX_IMAGES}</span>
          )}
        </div>

        {/* 미리보기 그리드 */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((item, i) => (
              <div key={item.previewUrl} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt={`사진 ${i + 1}`}
                     className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                    대표
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full
                             flex items-center justify-center text-[11px] hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* 추가 버튼 (MAX 미만일 때만) */}
            {previews.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300
                           flex flex-col items-center justify-center gap-1
                           text-gray-400 hover:border-charcoal hover:text-charcoal transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span className="text-[11px]">추가</span>
              </button>
            )}
          </div>
        )}

        {/* 사진 없을 때 업로드 영역 */}
        {previews.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-36
                       border-2 border-dashed border-gray-300 rounded-2xl
                       text-gray-400 hover:border-charcoal hover:bg-gray-50 transition-colors"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                 className="mb-2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p className="text-sm font-medium text-charcoal">사진을 올려주세요</p>
            <p className="text-xs mt-1">최대 {MAX_IMAGES}장 · 자동으로 최적화돼요</p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
          className="hidden"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => history.back()}
          className="flex-1 border border-gray-300 rounded py-2.5 text-sm text-gray-600"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black text-white rounded py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? '등록 중...' : '등록하기'}
        </button>
      </div>
    </form>
  )
}
