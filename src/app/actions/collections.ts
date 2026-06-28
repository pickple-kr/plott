'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('관리자 권한이 없습니다')
  return supabase
}

/* ── 큐레이션(주제) 생성 ── */
export async function createCollection(formData: FormData) {
  const supabase = await adminClient()

  const title       = formData.get('title')       as string
  const description = (formData.get('description') as string) || null
  const emoji       = (formData.get('emoji')       as string) || null

  const { data: last } = await supabase
    .from('collections')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('collections').insert({
    title,
    description,
    emoji,
    order_index: (last?.order_index ?? -1) + 1,
    active: true,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/collections')
  revalidatePath('/')
}

/* ── 활성/비활성 토글 ── */
export async function toggleCollection(formData: FormData) {
  const supabase = await adminClient()
  const id     = formData.get('id')     as string
  const active = formData.get('active') === 'true'
  await supabase.from('collections').update({ active: !active }).eq('id', id)
  revalidatePath('/admin/collections')
  revalidatePath('/')
}

/* ── 삭제 (연결된 collection_plants도 CASCADE 삭제) ── */
export async function deleteCollection(formData: FormData) {
  const supabase = await adminClient()
  const id = formData.get('id') as string
  await supabase.from('collections').delete().eq('id', id)
  revalidatePath('/admin/collections')
  revalidatePath('/')
}

/* ── 순서 위로 ── */
export async function moveCollectionUp(formData: FormData) {
  const supabase     = await adminClient()
  const id           = formData.get('id')          as string
  const currentOrder = Number(formData.get('order_index'))

  const { data: target } = await supabase
    .from('collections').select('id, order_index')
    .lt('order_index', currentOrder)
    .order('order_index', { ascending: false })
    .limit(1).maybeSingle()

  if (!target) return
  await supabase.from('collections').update({ order_index: target.order_index }).eq('id', id)
  await supabase.from('collections').update({ order_index: currentOrder }).eq('id', target.id)
  revalidatePath('/admin/collections')
  revalidatePath('/')
}

/* ── 순서 아래로 ── */
export async function moveCollectionDown(formData: FormData) {
  const supabase     = await adminClient()
  const id           = formData.get('id')          as string
  const currentOrder = Number(formData.get('order_index'))

  const { data: target } = await supabase
    .from('collections').select('id, order_index')
    .gt('order_index', currentOrder)
    .order('order_index', { ascending: true })
    .limit(1).maybeSingle()

  if (!target) return
  await supabase.from('collections').update({ order_index: target.order_index }).eq('id', id)
  await supabase.from('collections').update({ order_index: currentOrder }).eq('id', target.id)
  revalidatePath('/admin/collections')
  revalidatePath('/')
}

/* ── 큐레이션에 식물 추가 ── */
export async function addPlantToCollection(formData: FormData) {
  const supabase       = await adminClient()
  const collection_id  = formData.get('collection_id') as string
  const plant_id       = formData.get('plant_id')      as string

  const { data: last } = await supabase
    .from('collection_plants').select('order_index')
    .eq('collection_id', collection_id)
    .order('order_index', { ascending: false })
    .limit(1).maybeSingle()

  const { error } = await supabase.from('collection_plants').insert({
    collection_id,
    plant_id,
    order_index: (last?.order_index ?? -1) + 1,
  })
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/collections/${collection_id}`)
  revalidatePath('/')
}

/* ── 큐레이션에서 식물 제거 ── */
export async function removePlantFromCollection(formData: FormData) {
  const supabase       = await adminClient()
  const id             = formData.get('id')            as string
  const collection_id  = formData.get('collection_id') as string
  await supabase.from('collection_plants').delete().eq('id', id)
  revalidatePath(`/admin/collections/${collection_id}`)
  revalidatePath('/')
}

/* ── 큐레이션 내 식물 순서 위로 ── */
export async function movePlantUp(formData: FormData) {
  const supabase       = await adminClient()
  const id             = formData.get('id')            as string
  const collection_id  = formData.get('collection_id') as string
  const currentOrder   = Number(formData.get('order_index'))

  const { data: target } = await supabase
    .from('collection_plants').select('id, order_index')
    .eq('collection_id', collection_id)
    .lt('order_index', currentOrder)
    .order('order_index', { ascending: false })
    .limit(1).maybeSingle()

  if (!target) return
  await supabase.from('collection_plants').update({ order_index: target.order_index }).eq('id', id)
  await supabase.from('collection_plants').update({ order_index: currentOrder }).eq('id', target.id)
  revalidatePath(`/admin/collections/${collection_id}`)
  revalidatePath('/')
}

/* ── 큐레이션 내 식물 순서 아래로 ── */
export async function movePlantDown(formData: FormData) {
  const supabase       = await adminClient()
  const id             = formData.get('id')            as string
  const collection_id  = formData.get('collection_id') as string
  const currentOrder   = Number(formData.get('order_index'))

  const { data: target } = await supabase
    .from('collection_plants').select('id, order_index')
    .eq('collection_id', collection_id)
    .gt('order_index', currentOrder)
    .order('order_index', { ascending: true })
    .limit(1).maybeSingle()

  if (!target) return
  await supabase.from('collection_plants').update({ order_index: target.order_index }).eq('id', id)
  await supabase.from('collection_plants').update({ order_index: currentOrder }).eq('id', target.id)
  revalidatePath(`/admin/collections/${collection_id}`)
  revalidatePath('/')
}
