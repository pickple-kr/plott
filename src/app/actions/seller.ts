'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function applyAsSeller(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const businessNumber   = (formData.get('business_number') as string)?.trim()
  const businessName     = (formData.get('business_name') as string)?.trim()
  const ownerName        = (formData.get('owner_name') as string)?.trim()
  const phone            = (formData.get('phone') as string)?.trim()
  const salesChannelUrl  = (formData.get('sales_channel_url') as string)?.trim()

  if (!businessNumber || !businessName || !ownerName || !phone || !salesChannelUrl) {
    redirect(`/seller/apply?error=${encodeURIComponent('모든 항목을 입력해주세요.')}`)
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      business_number:   businessNumber,
      business_name:     businessName,
      owner_name:        ownerName,
      phone:             phone,
      sales_channel_url: salesChannelUrl,
      seller_status:     'pending',
      reject_reason:     null,
    })
    .eq('id', user.id)

  if (error) {
    redirect(`/seller/apply?error=${encodeURIComponent('신청 실패: ' + error.message)}`)
  }

  redirect('/seller/apply')
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  return supabase
}

export async function approveApplication(formData: FormData) {
  const supabase  = await requireAdmin()
  const profileId = formData.get('profile_id') as string

  await supabase
    .from('profiles')
    .update({ seller_status: 'approved', reject_reason: null })
    .eq('id', profileId)

  revalidatePath('/admin')
}

export async function rejectApplication(formData: FormData) {
  const supabase     = await requireAdmin()
  const profileId    = formData.get('profile_id') as string
  const rejectReason = (formData.get('reject_reason') as string)?.trim() || null

  await supabase
    .from('profiles')
    .update({ seller_status: 'rejected', reject_reason: rejectReason })
    .eq('id', profileId)

  revalidatePath('/admin')
}
