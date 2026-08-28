'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Check, X, ShieldAlert, FileText, Trash2 } from 'lucide-react'

export default function NotesModerationPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modifyingId, setModifyingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function initModeration() {
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

      const { data: noteData } = await supabase
        .from('notes')
        .select(`
          *,
          subjects ( name ),
          profiles ( full_name )
        `)
        .order('created_at', { ascending: false })

      if (noteData) setNotes(noteData)
      setLoading(false)
    }

    initModeration()
  }, [supabase, router])

  const handleUpdateStatus = async (noteId: string, newStatus: 'approved' | 'rejected') => {
    setModifyingId(noteId)
    const res = await fetch(`/api/admin/notes/${noteId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    const data = await res.json()
    if (!data.error) {
      setNotes(notes.map((n) => (n.id === noteId ? { ...n, status: newStatus } : n)))
    }
    setModifyingId(null)
  }

  const handleDeleteNote = async (noteId: string, filePath: string) => {
    if (!confirm('Are you sure you want to permanently delete this note?')) return
    setModifyingId(noteId)

    if (!filePath.startsWith('/demo/')) {
      await supabase.storage.from('notes').remove([filePath])
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (!error) {
      setNotes(notes.filter((n) => n.id !== noteId))
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
          <ShieldAlert className="h-8 w-8 text-primary" />
          <span>Notes Moderation Library</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review notes approvals, reject violations, or permanently remove uploads.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-bold text-foreground mt-4">No notes uploaded</h3>
          <p className="text-sm text-muted-foreground mt-1">There are no study materials to moderate.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60">
              <thead className="bg-secondary/40 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Uploader</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {notes.map((n) => (
                  <tr key={n.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground max-w-xs truncate">
                      <Link href={`/notes/${n.id}`} className="hover:text-primary transition-colors">
                        {n.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {n.profiles?.full_name || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {n.subjects?.name || n.topic}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          n.status === 'approved'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : n.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}
                      >
                        {n.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {n.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(n.id, 'approved')}
                          disabled={modifyingId === n.id}
                          className="inline-flex items-center space-x-1 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1.5 text-xs font-bold hover:bg-green-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                      
                      {n.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(n.id, 'rejected')}
                          disabled={modifyingId === n.id}
                          className="inline-flex items-center space-x-1 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1.5 text-xs font-bold hover:bg-yellow-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteNote(n.id, n.file_path)}
                        disabled={modifyingId === n.id}
                        className="inline-flex items-center space-x-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1.5 text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
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
