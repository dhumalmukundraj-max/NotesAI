import Link from 'next/link'
import { BookOpen, Sparkles, Upload, Bookmark, Shield, GraduationCap, ArrowRight, Search, FileText } from 'lucide-react'

export default function LandingPage() {
  const featuredNotes = [
    { title: 'Database Normalization', subject: 'DBMS', topic: 'Normal Forms', branch: 'CSE', sem: '4' },
    { title: 'Python OOP Concepts', subject: 'Python', topic: 'Classes & Inheritance', branch: 'CSE', sem: '3' },
    { title: 'OS CPU Scheduling', subject: 'Operating Systems', topic: 'Algorithms', branch: 'CSE', sem: '4' },
  ]

  const popularSubjects = [
    'Python Programming',
    'Database Management Systems',
    'Data Structures & Algorithms',
    'Operating Systems',
    'Computer Networks',
    'Web Development',
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden font-sans">
      {/* Background radial glowing effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-[1000px] rounded-full bg-gradient-to-b from-primary/10 to-transparent blur-3xl opacity-70" />
      <div className="absolute top-1/3 left-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="absolute top-1/2 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-3xl" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Generation AI Student Platform</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl leading-[1.1] sm:leading-[1.1]">
          Your Notes. Your Knowledge. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            Your AI Study Partner.
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
          Discover, save, share, and understand study materials with an AI-powered learning platform built for college and engineering students.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/notes/search"
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer"
          >
            <span>Explore Notes Library</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/ai"
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-card border border-border px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary transition-all cursor-pointer"
          >
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>

        {/* Floating Mock Search Bar */}
        <div className="mx-auto max-w-2xl pt-6">
          <div className="relative rounded-2xl border border-border bg-card/50 p-2 shadow-xl backdrop-blur-sm flex items-center">
            <Search className="h-5 w-5 text-muted-foreground ml-3" />
            <input
              type="text"
              disabled
              placeholder="Search notes, subjects, DBMS normalization..."
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-foreground"
            />
            <Link
              href="/notes/search"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer"
            >
              Search
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Panel */}
      <section className="border-y border-border/60 bg-card/30 backdrop-blur-sm py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', name: 'Notes Shared' },
            { value: '10k+', name: 'Downloads' },
            { value: '25k+', name: 'AI Study Chats' },
            { value: '50+', name: 'Engineering Subjects' },
          ].map((stat) => (
            <div key={stat.name} className="space-y-1">
              <span className="block text-3xl font-extrabold text-foreground">{stat.value}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Notes */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-foreground">Featured Student Uploads</h2>
          <p className="text-sm text-muted-foreground">
            Study guides created by top engineering students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredNotes.map((note) => (
            <Link
              key={note.title}
              href="/notes/search"
              className="bg-card border border-border p-6 rounded-2xl shadow-sm glow-card flex flex-col justify-between h-48 cursor-pointer"
            >
              <div>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mb-3">
                  {note.subject}
                </span>
                <h3 className="font-bold text-lg text-foreground line-clamp-1">{note.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">Topic: {note.topic}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/40">
                <span className="flex items-center space-x-1">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>Sem {note.sem}</span>
                </span>
                <span>Branch: {note.branch}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-border/60 space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-foreground">Study Smart, Not Hard</h2>
          <p className="text-sm text-muted-foreground">
            A comprehensive suite of tools built specifically for college students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Discover & Search',
              desc: 'Find exam revision notes, syllabus summaries, and matrix formulas fast with custom branch/semester filters.',
              icon: BookOpen,
            },
            {
              title: 'Upload & Store',
              desc: 'Contribute notes to your peers and store your lecture guides securely inside Supabase storage containers.',
              icon: Upload,
            },
            {
              title: 'AI Companion',
              desc: 'Leverage specialized study presets: simplify code syntax, generate MCQs, or review oral viva exam prep.',
              icon: Sparkles,
            },
          ].map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="bg-card border border-border p-6 rounded-2xl flex flex-col space-y-4"
              >
                <div className="rounded-xl bg-primary/10 p-3 text-primary w-fit">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Popular subjects */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-border/60 space-y-8">
        <h2 className="text-2xl font-bold text-center text-foreground">Popular Engineering Subjects</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {popularSubjects.map((sub) => (
            <Link
              key={sub}
              href="/notes/search"
              className="rounded-full bg-secondary/80 hover:bg-secondary px-5 py-2 text-sm font-semibold text-foreground border border-border/40 hover:border-primary/20 transition-all cursor-pointer"
            >
              {sub}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Footer Panel */}
      <section className="bg-gradient-to-r from-primary/15 to-indigo-500/10 border-y border-border/60 py-16 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-foreground">Ready to Ace Your Semester?</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Create an account to start sharing notes, saving bookmarks, and chatting with your AI Study Assistant.
        </p>
        <div>
          <Link
            href="/signup"
            className="inline-flex justify-center items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow cursor-pointer"
          >
            <span>Get Started for Free</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-bold text-foreground">StudyNotes AI</span>
        </div>
        <span>&copy; {new Date().getFullYear()} StudyNotes AI. All rights reserved. Designed for college students.</span>
      </footer>
    </div>
  )
}
