import { useEffect } from 'react'
import { ProfileWorkspace } from '../components/ProfileWorkspace'
import type { ToastDraft } from '../components/ToastViewport'
import type { AuthSession } from '../types'

interface ProfilePageProps {
  session: AuthSession
  onSessionChange: (session: AuthSession) => void
  onToast: (toast: ToastDraft) => void
}

export function ProfilePage({ session, onSessionChange, onToast }: ProfilePageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <section className="container py-3 py-sm-5 px-3 px-sm-4">
      <ProfileWorkspace session={session} onSessionChange={onSessionChange} onToast={onToast} />
    </section>
  )
}
