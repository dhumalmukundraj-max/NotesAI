'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  BookOpen,
  Upload,
  Bookmark,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
  Play,
} from 'lucide-react'

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    savedCount: 0,
    uploadedCount: 0,
    aiMessagesCount: 0,
    downloadsCount: 0,
  })
  
  const [recentSaved, setRecentSaved] = useState<any[]>([])
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)

  const supabase = createClient()

  const loadDashboardData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(prof)

    const [
      { count: saved },
      { count: uploaded },
      { count: dls }
    ] = await Promise.all([
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('notes').select('*', { count: 'exact', head: true }).eq('uploaded_by', user.id),
      supabase.from('downloads').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const { data: userChats } = await supabase.from('ai_chats').select('id').eq('user_id', user.id)
    const chatIds = userChats?.map((c) => c.id) || []
    let msgCount = 0
    if (chatIds.length > 0) {
      const { count } = await supabase
        .from('ai_messages')
        .select('*', { count: 'exact', head: true })
        .in('chat_id', chatIds)
      msgCount = count || 0
    }

    setStats({
      savedCount: saved || 0,
      uploadedCount: uploaded || 0,
      aiMessagesCount: msgCount,
      downloadsCount: dls || 0,
    })

    const { data: savedNotes } = await supabase
      .from('bookmarks')
      .select(`
        notes (
          id,
          title,
          topic,
          semester,
          subjects ( name )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    if (savedNotes) {
      setRecentSaved(savedNotes.map((s: any) => s.notes).filter((n) => n !== null))
    }

    const { data: chats } = await supabase
      .from('ai_chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(3)
    if (chats) {
      setRecentChats(chats)
    }

    if (prof) {
      let recQuery = supabase
        .from('notes')
        .select(`
          id,
          title,
          topic,
          semester,
          views,
          downloads,
          subjects ( name )
        `)
        .eq('status', 'approved')
        .neq('uploaded_by', user.id)

      if (prof.branch) {
        recQuery = recQuery.eq('branch', prof.branch)
      }
      if (prof.semester) {
        recQuery = recQuery.eq('semester', prof.semester)
      }

      const { data: recs } = await recQuery.limit(4)
      
      if (!recs || recs.length === 0) {
        const { data: popularNotes } = await supabase
          .from('notes')
          .select(`
            id,
            title,
            topic,
            semester,
            views,
            downloads,
            subjects ( name )
          `)
          .eq('status', 'approved')
          .neq('uploaded_by', user.id)
          .order('views', { ascending: false })
          .limit(4)
        setRecommendations(popularNotes || [])
      } else {
        setRecommendations(recs)
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [supabase])

  const runSeedData = async () => {
    setSeeding(true)
    setSeedError(null)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setSeedError(data.error)
      } else {
        await loadDashboardData()
      }
    } catch {
      setSeedError('Connection failed. Make sure you set up Supabase tables.')
    } finally {
      setSeeding(false)
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans space-y-8 flex-1">
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-primary/10 to-indigo-500/5 border border-primary/10 rounded-2xl p-6 sm:p-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Welcome back, {profile?.full_name || 'Student'}!
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile?.college ? `${profile.college} | ` : ''}
            {profile?.branch ? `${profile.branch} | ` : ''}
            {profile?.semester ? `Semester ${profile.semester}` : ''}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Link
            href="/upload"
            className="inline-flex justify-center items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow shadow-primary/10 cursor-pointer"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            <span>Upload Notes</span>
          </Link>
        </div>
      </div>

      {stats.uploadedCount === 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-foreground">No notes in the database yet</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Populate your dashboard instantly with a set of pre-configured engineering notes (DBMS Normalization, SQL Joins, Python OOP, Operating Systems Scheduling) to test and demo the platform.
              </p>
              {seedError && (
                <div className="text-xs text-red-500 mt-2 flex items-center space-x-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{seedError}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={runSeedData}
            disabled={seeding}
            className="flex-shrink-0 inline-flex items-center space-x-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer shadow-md disabled:opacity-55"
          >
            {seeding ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Seeding...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Seed Demo Notes</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { name: 'Saved Notes', value: stats.savedCount, icon: Bookmark, color: 'text-blue-500 bg-blue-500/10' },
          { name: 'My Uploads', value: stats.uploadedCount, icon: Upload, color: 'text-indigo-500 bg-indigo-500/10' },
          { name: 'AI Questions', value: stats.aiMessagesCount, icon: MessageSquare, color: 'text-purple-500 bg-purple-500/10' },
          { name: 'My Downloads', value: stats.downloadsCount, icon: BookOpen, color: 'text-emerald-500 bg-emerald-500/10' },
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
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Quick Actions</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Find Notes', href: '/notes/search', desc: 'Search and filter notes', icon: BookOpen, color: 'border-blue-500/10 hover:border-blue-500' },
                { name: 'Upload Note', href: '/upload', desc: 'Share your materials', icon: Upload, color: 'border-indigo-500/10 hover:border-indigo-500' },
                { name: 'Ask AI Study', href: '/ai', desc: 'Open AI Assistant', icon: Sparkles, color: 'border-purple-500/10 hover:border-purple-500' },
                { name: 'Saved Notes', href: '/saved', desc: 'Check bookmarked resources', icon: Bookmark, color: 'border-emerald-500/10 hover:border-emerald-500' },
              ].map((act) => {
                const Icon = act.icon
                return (
                  <Link
                    key={act.name}
                    href={act.href}
                    className={`bg-card p-5 border rounded-2xl glow-card flex flex-col justify-between ${act.color} cursor-pointer`}
                  >
                    <div className="rounded-xl bg-secondary p-2.5 w-fit text-primary mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{act.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{act.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Recommended for You</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-colors"
                >
                  <div>
                    <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary mb-3">
                      {rec.subjects?.name || rec.topic}
                    </span>
                    <h3 className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                      <Link href={`/notes/${rec.id}`}>{rec.title}</Link>
                    </h3>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/40 mt-4">
                    <span>Sem {rec.semester}</span>
                    <span>{rec.views} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 h-fit">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="font-bold text-foreground">Recently Saved</h2>
              <Link href="/saved" className="text-xs font-semibold text-primary flex items-center space-x-0.5">
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentSaved.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No bookmarks saved recently.</p>
            ) : (
              <div className="space-y-3">
                {recentSaved.map((note) => (
                  <div key={note.id} className="text-sm">
                    <Link href={`/notes/${note.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                      {note.title}
                    </Link>
                    <span className="text-xs text-muted-foreground block">{note.subjects?.name || note.topic}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 h-fit">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="font-bold text-foreground">Recent AI Chats</h2>
              <Link href="/ai" className="text-xs font-semibold text-primary flex items-center space-x-0.5">
                <span>Go to AI</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentChats.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No recent conversations.</p>
            ) : (
              <div className="space-y-3">
                {recentChats.map((chat) => (
                  <div key={chat.id} className="text-sm">
                    <Link href={`/ai?chatId=${chat.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                      {chat.title}
                    </Link>
                    <span className="text-xs text-muted-foreground block">
                      Updated {new Date(chat.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
