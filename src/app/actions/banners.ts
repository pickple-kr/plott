'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/* 관리자 여부를 확인하고 supabase client 반환 */
async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('관리자 권한이 없습니다')
  return supabase
}

/* 배너 추가 */
export async function addBanner(formData: FormData) {
  const supabase = await adminClient()

  const image_url = formData.get('image_url') as string
  const link_url  = (formData.get('link_url') as string) || null

  /* 현재 가장 큰 순서 번호 다음으로 추가 */
  const { data: last } = await supabase
    .from('banners')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const order_index = (last?.order_index ?? -1) + 1

  const { error } = await supabase.from('banners').insert({
    image_url,
    link_url,
    order_index,
    active: true,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/banners')
  revalidatePath('/')
}

/* 활성/비활성 토글 */
export async function toggleBanner(formData: FormData) {
  const supabase = await adminClient()

  const id     = formData.get('id')     as string
  const active = formData.get('active') === 'true'

  await supabase.from('banners').update({ active: !active }).eq('id', id)

  revalidatePath('/admin/banners')
  revalidatePath('/')
}

/* 배너 삭제 (Storage 이미지도 함께) */
export async function deleteBanner(formData: FormData) {
  const supabase  = await adminClient()
  const id        = formData.get('id')        as string
  const image_url = formData.get('image_url') as string

  /* URL에서 파일 경로 추출 후 Storage 삭제 */
  const filePath = image_url.split('/banner-images/')[1]
  if (filePath) {
    await supabase.storage.from('banner-images').remove([filePath])
  }

  await supabase.from('banners').delete().eq('id', id)

  revalidatePath('/admin/banners')
  revalidatePath('/')
}

/* 순서 위로 */
export async function moveBannerUp(formData: FormData) {
  const supabase     = await adminClient()
  const id           = formData.get('id')          as string
  const currentOrder = Number(formData.get('order_index'))

  const { data: target } = await supabase
    .from('banners')
    .select('id, order_index')
    .lt('order_index', currentOrder)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!target) return

  await supabase.from('banners').update({ order_index: target.order_index }).eq('id', id)
  await supabase.from('banners').update({ order_index: currentOrder }).eq('id', target.id)

  revalidatePath('/admin/banners')
  revalidatePath('/')
}

/* 순서 아래로 */
export async function moveBannerDown(formData: FormData) {
  const supabase     = await adminClient()
  const id           = formData.get('id')          as string
  const currentOrder = Number(formData.get('order_index'))

  const { data: target } = await supabase
    .from('banners')
    .select('id, order_index')
    .gt('order_index', currentOrder)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!target) return

  await supabase.from('banners').update({ order_index: target.order_index }).eq('id', id)
  await supabase.from('banners').update({ order_index: currentOrder }).eq('id', target.id)

  revalidatePath('/admin/banners')
  revalidatePath('/')
}
