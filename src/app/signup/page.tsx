import Link from 'next/link'
import { signup } from '@/app/actions/auth'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">회원가입</h1>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
        {message && (
          <p className="text-sm text-green-600 text-center">{message}</p>
        )}

        <form action={signup} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@email.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="6자 이상"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white rounded py-2 text-sm"
          >
            가입하기
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-black underline">로그인</Link>
        </p>
      </div>
    </main>
  )
}
