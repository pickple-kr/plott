import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">

        {/* PLOTT 로고 */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="font-logo font-black text-3xl tracking-[0.25em] text-charcoal
                       inline-flex items-center gap-2 select-none"
          >
            PLOTT
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none"
                 stroke="#D4F034" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="7.5" y1="1"   x2="7.5" y2="14"/>
              <line x1="1"   y1="7.5" x2="14"  y2="7.5"/>
              <line x1="3"   y1="3"   x2="12"  y2="12"/>
              <line x1="12"  y1="3"   x2="3"   y2="12"/>
            </svg>
          </Link>
        </div>

        {/* 제목 */}
        <div className="mb-8">
          <div className="relative w-fit mb-2">
            <h1 className="font-black text-3xl text-charcoal tracking-tight">
              로그인
            </h1>
            <svg
              className="absolute left-0 w-full overflow-visible pointer-events-none"
              style={{ bottom: '-3px' }}
              height="8" viewBox="0 0 100 8"
              preserveAspectRatio="none" aria-hidden="true"
            >
              <path d="M1 5 C 20 2, 50 7, 70 4 C 85 2, 95 6, 99 4"
                    fill="none" stroke="#FF6BAC" strokeWidth="5"
                    strokeLinecap="round" opacity="0.85"/>
            </svg>
          </div>
          <p className="text-sm text-gray-400">식물과 함께하는 커뮤니티에 오신 걸 환영해요</p>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 rounded-2xl">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-5 px-4 py-3 bg-green-50 rounded-2xl">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        {/* 폼 */}
        <form action={login} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-charcoal">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@email.com"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm
                         outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-charcoal">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="비밀번호를 입력하세요"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm
                         outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-charcoal text-white rounded-full py-3 text-sm font-medium
                         hover:bg-charcoal-soft transition-colors"
            >
              로그인하기
            </button>
          </div>
        </form>

        {/* 회원가입 링크 */}
        <p className="text-center text-sm text-gray-400 mt-6">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-charcoal font-medium hover:underline">
            회원가입
          </Link>
        </p>

      </div>
    </div>
  )
}
