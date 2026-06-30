'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES = ['자랑', '고민', '팁', '자유']

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const category = formData.get('category') as string
  const title    = formData.get('title') as string
  const content  = formData.get('content') as string
  const imageUrl = (formData.get('image_url') as string) || null

  if (!category || !CATEGORIES.includes(category) || !title?.trim() || !content?.trim()) {
    redirect(`/community/write?error=${encodeURIComponent('카테고리, 제목, 내용은 필수예요.')}`)
  }

  const { error } = await supabase.from('posts').insert({
    user_id:   user.id,
    category,
    title:     title.trim(),
    content:   content.trim(),
    image_url: imageUrl,
  })

  if (error) {
    redirect(`/community/write?error=${encodeURIComponent('등록 실패: ' + error.message)}`)
  }

  redirect('/community')
}

export async function toggleLike(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId = formData.get('post_id') as string

  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id)
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
  }

  revalidatePath(`/community/${postId}`)
}

export async function createComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId  = formData.get('post_id') as string
  const content = (formData.get('content') as string)?.trim()

  if (content) {
    await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
  }

  revalidatePath(`/community/${postId}`)
}

export async function deleteComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const commentId = formData.get('comment_id') as string
  const postId    = formData.get('post_id') as string

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  const isAdmin = profile?.is_admin ?? false

  if (isAdmin) {
    await supabase.from('comments').delete().eq('id', commentId)
  } else {
    await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id)
  }

  revalidatePath(`/community/${postId}`)
}

export async function deletePost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId = formData.get('post_id') as string

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  const isAdmin = profile?.is_admin ?? false

  if (isAdmin) {
    await supabase.from('posts').delete().eq('id', postId)
  } else {
    await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id)
  }

  redirect('/community')
}

export async function updatePost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postId  = formData.get('post_id') as string
  const title   = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim()

  if (!title || !content) {
    redirect(`/community/edit/${postId}?error=${encodeURIComponent('제목과 내용은 필수예요.')}`)
  }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  const isAdmin = profile?.is_admin ?? false

  if (isAdmin) {
    await supabase.from('posts').update({ title, content }).eq('id', postId)
  } else {
    await supabase.from('posts').update({ title, content }).eq('id', postId).eq('user_id', user.id)
  }

  revalidatePath(`/community/${postId}`)
  redirect(`/community/${postId}`)
}
