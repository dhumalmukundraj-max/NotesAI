'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, GraduationCap, Eye, Download, BookmarkX, Loader2 } from 'lucide-react'

export default function SavedNotesPage() {
  const [savedNotes, setSavedNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadSavedNotes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('bookmarks')
        .select(`
          id,
          notes (
            id,
            title,
            description,
            topic,
            branch,
            semester,
            views,
            downloads,
            subjects ( name )
          )
        `)
        .eq('user_id', user.id)

      if (data) {
        const filtered = data
          .map((bk: any) => bk.notes)
          .filter((n) => n !== null)
        setSavedNotes(filtered)
      }
      setLoading(false)
    }

    loadSavedNotes()
  }, [supabase])

  const handleRemoveBookmark = async (noteId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('note_id', noteId)

    if (!error) {
      setSavedNotes(savedNotes.filter((note) => note.id !== noteId))
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground">Saved Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Access your bookmarked study materials and syllabus resources.
        </p>
      </div>

      {savedNotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl text-center px-4">
          <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground">No saved notes</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            You haven't bookmarked any notes yet. Explore notes library and click the bookmark icon to save them here.
          </p>
          <Link
            href="/notes/search"
            className="mt-6 inline-flex justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer"
          >
            Find Notes to Save
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedNotes.map((note) => (
            <div
              key={note.id}
              className="group bg-card border border-border rounded-2xl overflow-hidden glow-card flex flex-col h-full relative"
            >
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary mb-3">
                    {note.subjects?.name || note.topic}
                  </span>
                  
                  <button
                    onClick={() => handleRemoveBookmark(note.id)}
                    className="rounded-full p-1.5 transition-colors cursor-pointer text-muted-foreground hover:bg-red-500/10 hover:text-red-500 border border-transparent"
                    title="Remove bookmark"
                  >
                    <BookmarkX className="h-4.5 w-4.5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  <Link href={`/notes/${note.id}`}>{note.title}</Link>
                </h3>
                
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
                  {note.description || 'No description provided.'}
                </p>

                <div className="mt-4 flex items-center space-x-4 border-t border-border/40 pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span>Sem {note.semester}</span>
                  </span>
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
