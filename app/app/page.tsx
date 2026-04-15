import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { WorkspaceClient } from '@/components/WorkspaceClient'
import { getAuthUser } from '@/lib/supabase-auth'
import { redirect } from 'next/navigation'

export default async function WorkspacePage() {
  const user = await getAuthUser()

  // Defensive — middleware should already redirect, but double-check
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <div className="shrink-0">
        <Topbar user={user} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">
          <WorkspaceClient />
        </main>
      </div>
    </div>
  )
}
