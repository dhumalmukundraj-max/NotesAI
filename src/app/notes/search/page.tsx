'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Search, Filter, BookOpen, GraduationCap, Eye, Download, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'

export default function NotesSearchPage() {
  const [notes, setNotes] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [bookmarks, setBookmarks] = useState<string[]>([])
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedFileType, setSelectedFileType] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: subData } = await supabase.from('subjects').select('*')
      if (subData) setSubjects(subData)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: bkData } = await supabase
          .from('bookmarks')
          .select('note_id')
          .eq('user_id', user.id)
        if (bkData) {
          setBookmarks(bkData.map((b) => b.note_id))
        }
      }
      setLoading(false)
    }
    loadData()
  }, [supabase])

  useEffect(() => {
    async function fetchNotes() {
      setLoading(true)
      let query = supabase
        .from('notes')
        .select(`
          *,
          subjects ( name ),
          profiles ( full_name )
        `)
        .eq('status', 'approved')

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,topic.ilike.%${searchQuery}%`)
      }

      if (selectedBranch) {
        query = query.eq('branch', selectedBranch)
      }
      if (selectedSemester) {
        query = query.eq('semester', selectedSemester)
      }
      if (selectedSubject) {
        query = query.eq('subject_id', selectedSubject)
      }
      if (selectedFileType) {
        if (selectedFileType === 'pdf') {
          query = query.eq('file_type', 'application/pdf')
        } else if (selectedFileType === 'image') {
          query = query.ilike('file_type', 'image/%')
        } else {
          query = query.not('file_type', 'eq', 'application/pdf').not('file_type', 'ilike', 'image/%')
        }
      }

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'views') {
        query = query.order('views', { ascending: false })
      } else if (sortBy === 'downloads') {
        query = query.order('downloads', { ascending: false })
      }

      const { data } = await query
      if (data) {
        setNotes(data)
      }
      setLoading(false)
    }

    const timer = setTimeout(() => {
      fetchNotes()
    }, 300)

    return () => clearTimeout(timer)
  }, [supabase, searchQuery, selectedBranch, selectedSemester, selectedSubject, selectedFileType, sortBy])

  const handleBookmarkToggle = async (noteId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isBookmarked = bookmarks.includes(noteId)

    if (isBookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('note_id', noteId)

      if (!error) {
        setBookmarks(bookmarks.filter((id) => id !== noteId))
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, note_id: noteId })

      if (!error) {
        setBookmarks([...bookmarks, noteId])
      }
    }
  }

  const engineeringBranches = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Other / Science / Arts'
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans flex-1 flex flex-col">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Explore Study Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search notes, syllabus topics, and reference materials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
        {/* Filters Sidebar */}
        <div className="bg-card border border-border rounded-2xl p-6 h-fit space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center space-x-2 border-b border-border pb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Filter Results</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Branch / Stream
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10"
            >
              <option value="">All Branches</option>
              {engineeringBranches.map((br) => (
                <option key={br} value={br}>
                  {br}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem.toString()}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10"
            >
              <option value="">All Subjects</option>
              {subjects
                .filter((sub) => !selectedBranch || sub.branch === selectedBranch)
                .map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              File Type
            </label>
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10"
            >
              <option value="">Any File Type</option>
              <option value="pdf">PDF Document</option>
              <option value="image">Image Note</option>
              <option value="other">Other (DOCX, PPTX)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-border/60">
            <button
              onClick={() => {
                setSelectedBranch('')
                setSelectedSemester('')
                setSelectedSubject('')
                setSelectedFileType('')
                setSearchQuery('')
                setSortBy('newest')
              }}
              className="w-full rounded-xl bg-secondary py-2.5 text-center text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Search Results Area */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between bg-card border border-border p-4 rounded-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notes, subjects, topics, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10"
              >
                <option value="newest">Newest First</option>
                <option value="views">Most Viewed</option>
                <option value="downloads">Most Downloaded</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border border-border rounded-2xl h-56 animate-pulse flex flex-col p-6 space-y-4 relative overflow-hidden">
                  <div className="h-6 w-1/3 bg-secondary rounded-lg" />
                  <div className="h-7 w-3/4 bg-secondary rounded-lg" />
                  <div className="h-16 w-full bg-secondary rounded-lg" />
                  <div className="h-4 w-1/2 bg-secondary rounded-lg pt-4" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl text-center px-4">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold text-foreground">No notes found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                We couldn't find any study notes matching your criteria. Try adjusting your search query or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notes.map((note) => {
                const isBookmarked = bookmarks.includes(note.id)
                return (
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
                          onClick={() => handleBookmarkToggle(note.id)}
                          className={`rounded-full p-1.5 transition-colors cursor-pointer border ${
                            isBookmarked
                              ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/25'
                              : 'text-muted-foreground hover:bg-secondary border-transparent hover:text-foreground'
                          }`}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="h-4.5 w-4.5" />
                          ) : (
                            <Bookmark className="h-4.5 w-4.5" />
                          )}
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
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
