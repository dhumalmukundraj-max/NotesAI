'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Users, FileText, Download, AlertTriangle, Check, Trash2, Loader2, ArrowRight } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [stats, setStats] = useState({
    usersCount: 0,
    notesCount: 0,
    downloadsCount: 0,
    reportsCount: 0,
  })
  const [reports, setReports] = useState<any[]>([])
  const [recentUploads, setRecentUploads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function checkAdminAndLoad() {
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

      const [
        { count: users },
        { count: notes },
        { count: downloads },
        { count: reps }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('downloads').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      setStats({
        usersCount: users || 0,
        notesCount: notes || 0,
        downloadsCount: downloads || 0,
        reportsCount: reps || 0,
      })

      const { data: repData } = await supabase
        .from('reports')
        .select(`
          *,
          notes ( id, title, file_path ),
          profiles ( full_name )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (repData) setReports(repData)

      const { data: uploadData } = await supabase
        .from('notes')
        .select(`
          *,
          profiles ( full_name )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      if (uploadData) setRecentUploads(uploadData)

      setLoading(false)
    }

    checkAdminAndLoad()
  }, [supabase, router])

  const resolveReport = async (reportId: string, status: 'resolved' | 'ignored') => {
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId)

    if (!error) {
      setReports(reports.filter((r) => r.id !== reportId))
      setStats((prev) => ({ ...prev, reportsCount: Math.max(0, prev.reportsCount - 1) }))
    }
  }

  const deleteReportedNote = async (reportId: string, noteId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this reported note?')) return

    if (!filePath.startsWith('/demo/')) {
      await supabase.storage.from('notes').remove([filePath])
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (!error) {
      await resolveReport(reportId, 'resolved')
    }
  }

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans space-y-8 flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Moderate notes, inspect report violations, and manage platform permissions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Link
            href="/admin/notes"
            className="inline-flex justify-center items-center rounded-xl bg-card border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-all shadow-sm"
          >
            <span>Notes Moderation</span>
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex justify-center items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm"
          >
            <span>User Management</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { name: 'Total Users', value: stats.usersCount, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
          { name: 'Uploaded Notes', value: stats.notesCount, icon: FileText, color: 'text-indigo-500 bg-indigo-500/10' },
          { name: 'Total Downloads', value: stats.downloadsCount, icon: Download, color: 'text-emerald-500 bg-emerald-500/10' },
          { name: 'Pending Reports', value: stats.reportsCount, icon: AlertTriangle, color: 'text-red-500 bg-red-500/10' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-card border border-border p-5 rounded-2xl flex items-center space-x-4">
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs font-semibold text-muted-foreground">{stat.name}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Reported Notes Moderation</span>
            </h2>

            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                All clear! No pending notes reports.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {reports.map((rep) => (
                  <div key={rep.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-foreground text-sm line-clamp-1">
                          {rep.notes ? (
                            <Link href={`/notes/${rep.notes.id}`} className="hover:text-primary transition-colors">
                              {rep.notes.title}
                            </Link>
                          ) : (
                            <span className="text-red-500">[Deleted Note]</span>
                          )}
                        </h3>
                        <p className="text-xs text-red-500 font-semibold mt-1">
                          Reason: {rep.reason}
                        </p>
                      </div>
                      
                      {rep.notes && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => resolveReport(rep.id, 'ignored')}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                            title="Dismiss / Ignore report"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteReportedNote(rep.id, rep.notes.id, rep.notes.file_path)}
                            className="p-1.5 rounded-lg border border-red-500/10 text-red-500 hover:bg-red-500/10 cursor-pointer"
                            title="Approve report & delete note"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      "{rep.description}" — reported by <span className="font-medium">{rep.profiles?.full_name}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 h-fit">
          <h2 className="font-bold text-foreground border-b border-border pb-3 font-sans">Recent Uploads</h2>
          <div className="space-y-4">
            {recentUploads.map((n) => (
              <div key={n.id} className="text-sm">
                <Link href={`/notes/${n.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                  {n.title}
                </Link>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                  <span>By {n.profiles?.full_name || 'Student'}</span>
                  <span
                    className={`font-semibold ${
                      n.status === 'approved' ? 'text-green-500' : 'text-yellow-500'
                    }`}
                  >
                    {n.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
