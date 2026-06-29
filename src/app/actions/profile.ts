'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const displayName = (formData.get('display_name') as string)?.trim() || null
  const bio         = (formData.get('bio')          as string)?.trim() || null
  const avatarFile  = formData.get('avatar') as File | null

  let avatarUrl: string | undefined

  if (avatarFile && avatarFile.size > 0) {
    const ext  = avatarFile.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)
      avatarUrl = urlData.publicUrl
    }
  }

  /* 활동명 중복 확인 — 자기 자신 제외하고 같은 이름 있으면 거절 */
  if (displayName) {
    const { data: conflict } = await supabase
      .from('profiles')
      .select('id')
      .eq('display_name', displayName)
      .neq('id', user.id)
      .maybeSingle()

    if (conflict) {
      return { error: '이미 사용 중인 활동명이에요. 다른 이름을 써보세요.' }
    }
  }

  const updates: {
    display_name: string | null
    bio: string | null
    avatar_url?: string
  } = { display_name: displayName, bio }

  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

  await supabase.from('profiles').update(updates).eq('id', user.id)

  revalidatePath('/my')
  revalidatePath('/community')
  return null
}
