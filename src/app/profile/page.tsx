'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, School, BookOpen, GraduationCap, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    id: '',
    full_name: '',
    email: '',
    college: '',
    branch: '',
    semester: '1',
    bio: '',
    avatar_url: '',
  })
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        setMsg({ type: 'error', text: 'Error loading profile: ' + error.message })
      } else if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || '',
          email: data.email || '',
          college: data.college || '',
          branch: data.branch || '',
          semester: data.semester || '1',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        college: profile.college,
        branch: profile.branch,
        semester: profile.semester,
        bio: profile.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      setMsg({ type: 'error', text: 'Failed to update profile: ' + error.message })
    } else {
      setMsg({ type: 'success', text: 'Profile updated successfully!' })
      router.refresh()
    }
    setSaving(false)
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 font-sans">
      <div className="md:flex md:items-center md:justify-between md:space-x-5 mb-8">
        <div className="flex items-start space-x-5">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border border-primary/20">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="pt-1.5">
            <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
            <p className="text-sm font-medium text-muted-foreground">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border shadow-lg shadow-black/[0.01] sm:rounded-2xl overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-bold leading-6 text-foreground mb-6">Profile Settings</h2>

          <form onSubmit={handleUpdate} className="space-y-6">
            {msg && (
              <div
                className={`rounded-lg p-4 text-sm border flex items-center space-x-2 ${
                  msg.type === 'success'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}
              >
                {msg.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="full-name" className="block text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="mt-1.5">
                  <input
                    type="text"
                    name="full-name"
                    id="full-name"
                    required
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="mt-1.5">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    disabled
                    value={profile.email}
                    className="block w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-muted-foreground text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="college" className="block text-sm font-medium text-foreground">
                  College / Institute
                </label>
                <div className="mt-1.5">
                  <input
                    type="text"
                    name="college"
                    id="college"
                    required
                    value={profile.college}
                    onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                    className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="branch" className="block text-sm font-medium text-foreground">
                  Branch
                </label>
                <div className="mt-1.5">
                  <select
                    id="branch"
                    name="branch"
                    required
                    value={profile.branch}
                    onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                    className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  >
                    <option value="">Select your branch</option>
                    {engineeringBranches.map((br) => (
                      <option key={br} value={br}>
                        {br}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="semester" className="block text-sm font-medium text-foreground">
                  Semester
                </label>
                <div className="mt-1.5">
                  <select
                    id="semester"
                    name="semester"
                    required
                    value={profile.semester}
                    onChange={(e) => setProfile({ ...profile, semester: e.target.value })}
                    className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem.toString()}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="bio" className="block text-sm font-medium text-foreground">
                  Bio (Optional)
                </label>
                <div className="mt-1.5">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    placeholder="Tell us about yourself, your academic interests, etc."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/60">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
