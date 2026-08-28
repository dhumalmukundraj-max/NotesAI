'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  FileText,
  Bookmark,
  BookmarkCheck,
  Download,
  Eye,
  Star,
  Flag,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'

export default function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const noteId = resolvedParams.id

  const [note, setNote] = useState<any>(null)
  const [fileUrl, setFileUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  const [userRating, setUserRating] = useState<number>(0)
  const [avgRating, setAvgRating] = useState<number>(0)
  const [totalRatings, setTotalRatings] = useState<number>(0)
  const [ratingHover, setRatingHover] = useState<number>(0)

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Inappropriate Content')
  const [reportDesc, setReportDesc] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadNoteDetails() {
      const { data: noteData, error } = await supabase
        .from('notes')
        .select(`
          *,
          subjects ( name ),
          profiles ( full_name )
        `)
        .eq('id', noteId)
        .single()

      if (error || !noteData) {
        setNote(null)
        setLoading(false)
        return
      }

      setNote(noteData)

      await supabase.rpc('increment_views', { note_id: noteId })

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: bk } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('note_id', noteId)
          .maybeSingle()
        setIsBookmarked(!!bk)

        const { data: rt } = await supabase
          .from('ratings')
          .select('rating')
          .eq('user_id', user.id)
          .eq('note_id', noteId)
          .maybeSingle()
        if (rt) {
          setUserRating(rt.rating)
        }
      }

      const { data: allRatings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('note_id', noteId)
      if (allRatings && allRatings.length > 0) {
        const sum = allRatings.reduce((acc, r) => acc + r.rating, 0)
        setAvgRating(parseFloat((sum / allRatings.length).toFixed(1)))
        setTotalRatings(allRatings.length)
      }

      if (noteData.file_path.startsWith('/demo/')) {
        setFileUrl(noteData.file_path)
      } else {
        const { data: signedData } = await supabase.storage
          .from('notes')
          .createSignedUrl(noteData.file_path, 3600)
        if (signedData?.signedUrl) {
          setFileUrl(signedData.signedUrl)
        }
      }
      setLoading(false)
    }

    loadNoteDetails()
  }, [supabase, noteId])

  const handleBookmarkToggle = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (isBookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('note_id', noteId)
      setIsBookmarked(false)
    } else {
      await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, note_id: noteId })
      setIsBookmarked(true)
    }
  }

  const handleRate = async (rating: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserRating(rating)

    await supabase.from('ratings').upsert({
      user_id: user.id,
      note_id: noteId,
      rating: rating,
    })

    const { data: allRatings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('note_id', noteId)
    if (allRatings && allRatings.length > 0) {
      const sum = allRatings.reduce((acc, r) => acc + r.rating, 0)
      setAvgRating(parseFloat((sum / allRatings.length).toFixed(1)))
      setTotalRatings(allRatings.length)
    }
  }

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setReporting(true)
    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      note_id: noteId,
      reason: reportReason,
      description: reportDesc,
    })

    setReporting(false)
    if (!error) {
      setReportSuccess(true)
      setReportDesc('')
      setTimeout(() => {
        setShowReportModal(false)
        setReportSuccess(false)
      }, 1500)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-foreground">Note Not Found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          The study material you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/notes/search"
          className="mt-6 inline-flex items-center space-x-1.5 text-sm font-semibold text-primary hover:text-primary/95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Explore</span>
        </Link>
      </div>
    )
  }

  const isPdf = note.file_type === 'application/pdf'
  const isImage = note.file_type.startsWith('image/')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans flex-1 flex flex-col">
      <div className="mb-6">
        <Link
          href="/notes/search"
          className="inline-flex items-center space-x-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Explore</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left/Middle Column: PDF / File Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="bg-secondary/40 px-6 py-4 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Document Preview
              </span>
              <span className="text-xs text-muted-foreground">
                {(note.file_size / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="flex-1 bg-secondary/10 flex items-center justify-center relative">
              {isPdf && fileUrl ? (
                <iframe
                  src={`${fileUrl}#toolbar=0`}
                  className="w-full h-full border-none"
                  title={note.title}
                />
              ) : isImage && fileUrl ? (
                <img
                  src={fileUrl}
                  alt={note.title}
                  className="max-h-full max-w-full object-contain p-4"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground/60" />
                  <h4 className="font-bold text-foreground">Preview Not Available</h4>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    This file format does not support inline browser viewing. Please download the file to inspect its content.
                  </p>
                  <a
                    href={`/api/notes/${note.id}/download`}
                    className="inline-flex items-center space-x-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Note Details and Actions */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary mb-3">
                {note.subjects?.name || note.topic}
              </span>
              <h1 className="text-2xl font-extrabold text-foreground leading-tight">
                {note.title}
              </h1>
              <p className="text-xs text-muted-foreground mt-2">
                Uploaded by <span className="font-semibold text-foreground">{note.profiles?.full_name || 'Anonymous'}</span> on{' '}
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              {note.description || 'No description provided.'}
            </p>

            <div className="grid grid-cols-2 gap-4 border-y border-border py-4 my-4">
              <div className="text-center">
                <span className="block text-xl font-bold text-foreground">{note.views}</span>
                <span className="text-xs text-muted-foreground flex items-center justify-center space-x-1 mt-0.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Views</span>
                </span>
              </div>
              <div className="text-center">
                <span className="block text-xl font-bold text-foreground">{note.downloads}</span>
                <span className="text-xs text-muted-foreground flex items-center justify-center space-x-1 mt-0.5">
                  <Download className="h-3.5 w-3.5" />
                  <span>Downloads</span>
                </span>
              </div>
            </div>

            <Link
              href={`/ai?noteId=${note.id}`}
              className="flex w-full justify-center items-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Ask AI about this Note</span>
            </Link>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleBookmarkToggle}
                className={`flex justify-center items-center rounded-xl border border-border px-3 py-2.5 text-xs font-semibold hover:bg-secondary/40 transition-colors cursor-pointer ${
                  isBookmarked ? 'bg-primary/10 text-primary border-primary/20' : 'text-foreground'
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="mr-1.5 h-4 w-4" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-1.5 h-4 w-4" />
                    <span>Save Note</span>
                  </>
                )}
              </button>

              <a
                href={`/api/notes/${note.id}/download`}
                className="flex justify-center items-center rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary/40 transition-colors"
              >
                <Download className="mr-1.5 h-4 w-4" />
                <span>Download</span>
              </a>
            </div>

            <div className="border-t border-border/60 pt-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Rate this material</h3>
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    className="p-1 cursor-pointer transition-colors text-muted-foreground hover:text-yellow-400"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        (ratingHover || userRating) >= star
                          ? 'fill-yellow-400 text-yellow-400 animate-pulse'
                          : ''
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Average Rating: <span className="font-bold text-foreground">{avgRating || 'Unrated'}</span> ({totalRatings} votes)
              </p>
            </div>

            <div className="border-t border-border/60 pt-4 flex justify-between items-center">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center space-x-1.5 text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>Report Inappropriate Content</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Report Study Material</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please specify the reason why you are reporting this document.
            </p>

            <form onSubmit={handleReport} className="mt-4 space-y-4">
              {reportSuccess ? (
                <div className="text-center py-4 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20">
                  Thank you! Your report has been submitted.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Reason
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10"
                    >
                      <option value="Inappropriate Content">Inappropriate Content</option>
                      <option value="Copyright infringement">Copyright infringement</option>
                      <option value="Poor file quality / Corrupt">Poor file quality / Corrupt</option>
                      <option value="Wrong Category/Subject">Wrong Category/Subject</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Detailed Description
                    </label>
                    <textarea
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      rows={3}
                      required
                      placeholder="Please elaborate on the issue..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/10"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reporting}
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 cursor-pointer"
                    >
                      {reporting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
