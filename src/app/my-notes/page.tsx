'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, Eye, Download, Trash2, ArrowLeft, Loader2, Plus, AlertTriangle } from 'lucide-react'

export default function MyNotesPage() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadMyNotes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          subjects ( name )
        `)
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setNotes(data)
      }
      setLoading(false)
    }

    loadMyNotes()
  }, [supabase])

  const handleDelete = async (noteId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) return
    setDeletingId(noteId)

    // 1. Delete from Supabase Storage (if not local demo path)
    if (!filePath.startsWith('/demo/')) {
      await supabase.storage.from('notes').remove([filePath])
    }

    // 2. Delete from Database
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (!error) {
      setNotes(notes.filter((note) => note.id !== noteId))
    }
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans flex-1 flex flex-col">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">My Uploaded Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your study note contributions and check their view statistics.
          </p>
        </div>
        <Link
          href="/upload"
          className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow"
        >
          <Plus className="h-4 w-4" />
          <span>Upload New Note</span>
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl text-center px-4">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground">No notes contributed yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Share your notes, revision guides, and lecture transcripts to help other students!
          </p>
          <Link
            href="/upload"
            className="mt-6 inline-flex justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer"
          >
            Upload your first note
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-full relative"
            >
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary mb-3">
                    {note.subjects?.name || note.topic}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                        note.status === 'approved'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : note.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}
                    >
                      {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                    </span>
                    
                    <button
                      onClick={() => handleDelete(note.id, note.file_path)}
                      disabled={deletingId === note.id}
                      className="rounded-full p-1.5 transition-colors cursor-pointer text-muted-foreground hover:bg-red-500/10 hover:text-red-500 border border-transparent disabled:opacity-50"
                      title="Delete note"
                    >
                      {deletingId === note.id ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                  <Link href={`/notes/${note.id}`}>{note.title}</Link>
                </h3>
                
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
                  {note.description || 'No description provided.'}
                </p>

                <div className="mt-4 flex items-center space-x-4 border-t border-border/40 pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{note.views} views</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Download className="h-4 w-4" />
                    <span>{note.downloads} dl</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
