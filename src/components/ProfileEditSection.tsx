'use client'

import { useState, useTransition } from 'react'

export function ProfileEditSection({
  userEmail,
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  onSave,
}: {
  userEmail: string
  initialDisplayName: string | null
  initialBio: string | null
  initialAvatarUrl: string | null
  onSave: (formData: FormData) => Promise<{ error: string } | null>
}) {
  const [open,       setOpen]       = useState(false)
  const [preview,    setPreview]    = useState<string | null>(initialAvatarUrl)
  const [isPending,  startTransition] = useTransition()
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setErrorMsg(null)
    startTransition(async () => {
      const result = await onSave(formData)
      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  const shownName = initialDisplayName || userEmail.split('@')[0]

  return (
    <div className="mb-12 pb-10 border-b border-gray-100">

      {/* ── 프로필 요약 ── */}
      <div className="flex items-center gap-5">
        {/* 아바타 */}
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="프로필 사진" className="w-full h-full object-cover" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
                 className="text-gray-300">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </div>

        {/* 이름 + 소개 */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-charcoal truncate">{shownName}</p>
          {initialDisplayName && (
            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
          )}
          {initialBio && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{initialBio}</p>
          )}
        </div>

        {/* 편집 토글 */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-shrink-0 px-4 py-2 border border-gray-200 rounded-full text-sm
                     text-charcoal hover:border-charcoal transition-colors"
        >
          {open ? '취소' : '프로필 편집'}
        </button>
      </div>

      {/* ── 편집 폼 ── */}
      {open && (
        <form onSubmit={handleSubmit} className="mt-7 space-y-6 max-w-sm">

          {/* 프로필 사진 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">프로필 사진</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.2" className="text-gray-300">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 border border-gray-200 rounded-full
                                text-sm text-charcoal hover:border-charcoal transition-colors">
                사진 선택
                <input
                  name="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* 활동명 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              활동명{' '}
              <span className="font-normal text-gray-400">(커뮤니티 글·댓글에 표시)</span>
            </label>
            <input
              name="display_name"
              type="text"
              defaultValue={initialDisplayName ?? ''}
              maxLength={20}
              placeholder={userEmail.split('@')[0]}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                         outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>

          {/* 한 줄 소개 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              한 줄 소개{' '}
              <span className="font-normal text-gray-400">(선택, 최대 60자)</span>
            </label>
            <input
              name="bio"
              type="text"
              defaultValue={initialBio ?? ''}
              maxLength={60}
              placeholder="나를 한 줄로 소개해보세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                         outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isPending}
              className="px-7 py-2.5 bg-charcoal text-white rounded-full text-sm font-medium
                         hover:bg-charcoal/80 transition-colors disabled:opacity-60"
            >
              {isPending ? '저장 중...' : '저장하기'}
            </button>
            {errorMsg && (
              <p className="text-sm text-red-500">{errorMsg}</p>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
