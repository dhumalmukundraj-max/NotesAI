'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<any[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [topic, setTopic] = useState('')
  const [branch, setBranch] = useState('')
  const [semester, setSemester] = useState('1')
  const [tagsInput, setTagsInput] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadSubjects() {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true })

      if (data) {
        setSubjects(data)
      }
      setLoadingSubjects(false)
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js'
    script.async = true
    document.body.appendChild(script)

    loadSubjects()

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.')
      setFile(null)
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Unsupported file type. Only PDF, DOCX, PPTX, and Images are supported.')
      setFile(null)
      return
    }

    setError(null)
    setFile(selectedFile)
  }

  const extractTextFromPdf = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const fileReader = new FileReader()
        fileReader.onload = async function () {
          const typedarray = new Uint8Array(this.result as ArrayBuffer)
          const anyWindow = window as any
          const pdfjsLib = anyWindow['pdfjs-dist/build/pdf'] || anyWindow['pdfjsLib']
          if (!pdfjsLib) {
            resolve('')
            return
          }
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'

          try {
            const loadingTask = pdfjsLib.getDocument({ data: typedarray })
            const pdf = await loadingTask.promise
            let extractedText = ''
            const numPages = Math.min(pdf.numPages, 8)
            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i)
              const textContent = await page.getTextContent()
              const strings = textContent.items.map((item: any) => item.str)
              extractedText += strings.join(' ') + '\n'
            }
            resolve(extractedText)
          } catch {
            resolve('')
          }
        }
        fileReader.readAsArrayBuffer(file)
      } catch {
        resolve('')
      }
    })
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file.')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(10)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      setUploadProgress(20)
      let extractedText = ''
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPdf(file)
      } else if (file.type.startsWith('image/') || file.type.includes('text') || file.name.endsWith('.txt')) {
        if (file.name.endsWith('.txt')) {
          extractedText = await file.text()
        }
      }

      setUploadProgress(40)
      const noteId = crypto.randomUUID()
      const fileExt = file.name.split('.').pop()
      const storagePath = `notes/${user.id}/${noteId}/${noteId}.${fileExt}`

      const { error: storageError } = await supabase.storage
        .from('notes')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (storageError) throw storageError
      setUploadProgress(70)

      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)

      const { error: dbError } = await supabase.from('notes').insert({
        id: noteId,
        title,
        description,
        subject_id: subjectId || null,
        topic,
        branch,
        semester,
        tags,
        file_path: storagePath,
        file_type: file.type,
        file_size: file.size,
        content_text: extractedText || null,
        uploaded_by: user.id,
        status: 'approved',
      })

      if (dbError) throw dbError

      setUploadProgress(100)
      setSuccess(true)
      setTitle('')
      setDescription('')
      setSubjectId('')
      setTopic('')
      setBranch('')
      setSemester('1')
      setTagsInput('')
      setFile(null)

      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.')
    } finally {
      setUploading(false)
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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground">Upload Study Note</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share your academic notes with other students. The material will be processed by AI for study assistance.
        </p>
      </div>

      <div className="bg-card border border-border shadow-lg shadow-black/[0.01] sm:rounded-2xl overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                ✓
              </div>
              <h2 className="text-xl font-bold text-foreground">Note Uploaded Successfully!</h2>
              <p className="text-sm text-muted-foreground">
                Your study note has been parsed and is now live. Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="title" className="block text-sm font-medium text-foreground">
                    Note Title
                  </label>
                  <div className="mt-1.5">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="e.g. Database Normalization and functional dependencies"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-foreground">
                    Description
                  </label>
                  <div className="mt-1.5">
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="Write a brief summary of what this note covers..."
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground">
                    Subject
                  </label>
                  <div className="mt-1.5">
                    {loadingSubjects ? (
                      <div className="h-10 w-full bg-secondary/50 rounded-xl animate-pulse" />
                    ) : (
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="topic" className="block text-sm font-medium text-foreground">
                    Topic
                  </label>
                  <div className="mt-1.5">
                    <input
                      type="text"
                      name="topic"
                      id="topic"
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="e.g. Normal Forms (1NF, 2NF, 3NF)"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
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
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    >
                      <option value="">Select Branch</option>
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
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
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
                  <label htmlFor="tags" className="block text-sm font-medium text-foreground">
                    Tags (comma separated)
                  </label>
                  <div className="mt-1.5">
                    <input
                      type="text"
                      name="tags"
                      id="tags"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="e.g. normal-forms, dbms, database, functional-dependency"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Upload File (PDF, Images, Word, Powerpoint up to 10MB)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-xl bg-background hover:bg-secondary/10 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="flex text-sm text-muted-foreground justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary/95 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : 'PDF, DOCX, PPTX, PNG, JPG up to 10MB'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border/60">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading Note...
                    </>
                  ) : (
                    'Upload Note Material'
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
