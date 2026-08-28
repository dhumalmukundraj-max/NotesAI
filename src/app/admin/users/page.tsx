'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Users, ShieldAlert, Award, UserCheck } from 'lucide-react'

export default function UserManagementPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modifyingId, setModifyingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function initUserList() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      setChecking(false)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profileData) setProfiles(profileData)
      setLoading(false)
    }

    initUserList()
  }, [supabase, router])

  const toggleUserRole = async (profileId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin'
    setModifyingId(profileId)

    const res = await fetch(`/api/admin/users/${profileId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })

    const data = await res.json()
    if (!data.error) {
      setProfiles(
        profiles.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      )
    }
    setModifyingId(null)
  }

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans space-y-8 flex-1">
      <div className="flex items-center space-x-3 mb-2">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Control Panel</span>
        </Link>
      </div>

      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-extrabold text-foreground flex items-center space-x-2">
          <Users className="h-8 w-8 text-primary" />
          <span>User Permissions Management</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review student accounts, search rosters, and toggle administrator credentials.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-bold text-foreground mt-4">No users registered</h3>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60">
              <thead className="bg-secondary/40 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">College</th>
                  <th className="px-6 py-4">Branch / Semester</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {p.full_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {p.email}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {p.college || '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {p.branch ? `${p.branch} (Sem ${p.semester})` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          p.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}
                      >
                        {p.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleUserRole(p.id, p.role)}
                        disabled={modifyingId === p.id}
                        className="inline-flex items-center space-x-1 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2.5 py-1.5 text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-55"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Toggle Admin role</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
