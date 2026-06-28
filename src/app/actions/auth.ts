'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    const msg =
      typeof error.message === 'string' && error.message.length > 0
        ? error.message
        : JSON.stringify(error)
    redirect(`/signup?error=${encodeURIComponent(msg)}`)
  }

  if (!data.session) {
    redirect(`/signup?message=${encodeURIComponent('가입 완료! 이메일로 인증 링크가 발송됐어요. 링크를 클릭한 뒤 로그인해주세요.')}`)
  }

  redirect(`/login?message=${encodeURIComponent('가입이 완료됐어요. 로그인해주세요.')}`)
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg =
      error.message === 'Invalid login credentials'
        ? '이메일 또는 비밀번호가 올바르지 않아요. 회원가입 후 이메일 인증을 완료했는지도 확인해주세요.'
        : error.message
    redirect(`/login?error=${encodeURIComponent(msg)}`)
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
