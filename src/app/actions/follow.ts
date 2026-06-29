'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(sellerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('seller_id', sellerId)
    .maybeSingle()

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id)
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, seller_id: sellerId })
  }

  revalidatePath(`/seller/${sellerId}`)
}
