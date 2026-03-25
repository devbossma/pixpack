import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { WorkspaceClient } from '@/components/WorkspaceClient'

export default function WorkspacePage() {
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <div className="hidden md:block">
        <Topbar />
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
