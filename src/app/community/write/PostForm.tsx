'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { createPost } from '@/app/actions/community'

const CATEGORIES = ['자랑', '고민', '팁', '자유']

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

export function PostForm({ userId }: { userId: string }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setPreview(null); return }
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form     = e.currentTarget
    const formData = new FormData(form)
    const file     = form.querySelector<HTMLInputElement>('#image')?.files?.[0]

    if (file) {
      try {
        const resized  = await resizeImage(file)
        const fileName = `${userId}/${Date.now()}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, resized, { contentType: 'image/jpeg' })

        if (uploadError) {
          setError('사진 업로드 실패: ' + uploadError.message)
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('post-images').getPublicUrl(fileName)
        formData.set('image_url', data.publicUrl)
      } catch (err) {
        setError('사진 처리 오류: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
        setLoading(false)
        return
      }
    }

    formData.delete('image')
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

      {/* 사진 */}
      <div className="space-y-2">
        <label htmlFor="image" className="block text-sm font-medium">
          사진 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        {preview && (
          <img
            src={preview}
            alt="미리보기"
            className="w-full max-h-64 object-cover rounded border border-gray-200"
          />
        )}
        <input
          id="image" name="image" type="file" accept="image/*"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-500
            file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0
            file:text-sm file:bg-gray-100 file:text-gray-700 file:cursor-pointer"
        />
        <p className="text-xs text-gray-400">자동으로 1200px / JPEG로 압축돼요</p>
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
