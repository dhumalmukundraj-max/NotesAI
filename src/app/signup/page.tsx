'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [college, setCollege] = useState('')
  const [branch, setBranch] = useState('')
  const [semester, setSemester] = useState('1')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          college: college,
          branch: branch,
          semester: semester,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      // Supabase has email confirmation by default sometimes. 
      // If session exists immediately, redirect to dashboard.
      if (data?.session) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setSuccess(true)
        setLoading(false)
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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground">
          Create student account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/95 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-card py-8 px-4 border border-border shadow-lg shadow-black/[0.02] sm:rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                ✓
              </div>
              <h3 className="text-lg font-bold text-foreground">Registration Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Please check your email inbox to confirm your account and log in.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSignup}>
              {error && (
                <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <div className="mt-1.5">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground shadow-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <div className="mt-1.5">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground shadow-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="jane@college.edu"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="mt-1.5">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground shadow-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                </div>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                  College & Academic Info
                </h4>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="college" className="block text-sm font-medium text-foreground">
                      College / Institute Name
                    </label>
                    <div className="mt-1.5">
                      <input
                        id="college"
                        name="college"
                        type="text"
                        required
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground shadow-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        placeholder="State Engineering College"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-foreground">
                      Branch / Field
                    </label>
                    <div className="mt-1.5">
                      <select
                        id="branch"
                        name="branch"
                        required
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
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

                  <div>
                    <label htmlFor="semester" className="block text-sm font-medium text-foreground">
                      Current Semester
                    </label>
                    <div className="mt-1.5">
                      <select
                        id="semester"
                        name="semester"
                        required
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={sem.toString()}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all disabled:opacity-55 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Register Account'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
