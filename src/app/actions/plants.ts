'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES = ['관엽식물', '다육·선인장', '허브', '꽃·화분']

export async function createPlant(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name        = formData.get('name') as string
  const priceRaw    = formData.get('price') as string
  const category    = formData.get('category') as string
  const description = formData.get('description') as string
  const purchaseUrl = formData.get('purchase_url') as string
  const imageUrl    = (formData.get('image_url') as string) || null

  if (!name || !priceRaw || !CATEGORIES.includes(category) || !purchaseUrl) {
    redirect(`/sell?error=${encodeURIComponent('필수 항목을 모두 입력해주세요.')}`)
  }

  const price = parseInt(priceRaw, 10)
  if (isNaN(price) || price < 0) {
    redirect(`/sell?error=${encodeURIComponent('가격을 올바르게 입력해주세요.')}`)
  }

  const { error } = await supabase.from('plants').insert({
    name,
    price,
    category,
    description: description || null,
    purchase_url: purchaseUrl,
    image_url: imageUrl || null,
    user_id: user.id,
  })

  if (error) redirect(`/sell?error=${encodeURIComponent('등록 실패: ' + error.message)}`)

  revalidatePath('/plants')
  revalidatePath('/')
  redirect('/my')
}

export async function updatePlant(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plantId         = formData.get('plant_id') as string
  const name            = formData.get('name') as string
  const priceRaw        = formData.get('price') as string
  const category        = formData.get('category') as string
  const description     = formData.get('description') as string
  const purchaseUrl     = formData.get('purchase_url') as string
  const newImageUrl     = (formData.get('image_url') as string) || null
  const existingImageUrl = (formData.get('existing_image_url') as string) || null

  if (!name || !priceRaw || !CATEGORIES.includes(category) || !purchaseUrl) {
    redirect(`/sell/edit/${plantId}?error=${encodeURIComponent('필수 항목을 모두 입력해주세요.')}`)
  }

  const price = parseInt(priceRaw, 10)
  if (isNaN(price) || price < 0) {
    redirect(`/sell/edit/${plantId}?error=${encodeURIComponent('가격을 올바르게 입력해주세요.')}`)
  }

  const { error } = await supabase
    .from('plants')
    .update({
      name,
      price,
      category,
      description: description || null,
      purchase_url: purchaseUrl,
      image_url: newImageUrl ?? existingImageUrl,
    })
    .eq('id', plantId)
    .eq('user_id', user.id)

  if (error) redirect(`/sell/edit/${plantId}?error=${encodeURIComponent('수정 실패: ' + error.message)}`)

  revalidatePath('/my')
  revalidatePath('/plants')
  revalidatePath('/')
  redirect('/my')
}

export async function deletePlant(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plantId = formData.get('plant_id') as string
  await supabase.from('plants').delete().eq('id', plantId).eq('user_id', user.id)

  revalidatePath('/my')
  revalidatePath('/plants')
  revalidatePath('/')
}
