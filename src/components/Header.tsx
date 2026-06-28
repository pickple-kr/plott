import { createClient } from '@/lib/supabase/server'
import { HeaderNav } from './HeaderNav'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin      = false
  let sellerStatus = 'none'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, seller_status')
      .eq('id', user.id)
      .single()

    isAdmin      = profile?.is_admin      ?? false
    sellerStatus = profile?.seller_status ?? 'none'
  }

  return (
    <header className="border-b border-gray-200 bg-white px-4">
      <div className="max-w-5xl mx-auto">
        <HeaderNav
          userEmail={user?.email ?? null}
          isAdmin={isAdmin}
          sellerStatus={sellerStatus}
        />
      </div>
    </header>
  )
}
