import { createClient } from '@/lib/supabase/server'
import { HeaderNav } from './HeaderNav'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <HeaderNav
          userEmail={user?.email ?? null}
        />
      </div>
    </header>
  )
}
