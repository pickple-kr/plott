import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-black">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">PLOTT</h1>

        {user ? (
          <>
            <p className="text-gray-500 text-sm">{user.email} 로 로그인 중</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/sell"
                className="bg-black text-white rounded px-4 py-2 text-sm"
              >
                식물 등록
              </Link>
              <Link
                href="/plants"
                className="border border-gray-300 rounded px-4 py-2 text-sm"
              >
                둘러보기
              </Link>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-400 underline"
              >
                로그아웃
              </button>
            </form>
          </>
        ) : (
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="border border-gray-300 rounded px-4 py-2 text-sm"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="bg-black text-white rounded px-4 py-2 text-sm"
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
