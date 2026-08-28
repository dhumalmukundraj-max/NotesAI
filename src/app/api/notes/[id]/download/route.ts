import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: noteId } = await params

    // Check user auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get note details
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Log the download
    await supabase.from('downloads').insert({
      user_id: user.id,
      note_id: noteId,
    })

    // Increment downloads count in notes table securely via RPC
    await supabase.rpc('increment_downloads', { note_id: noteId })

    // If file is a local demo file, redirect directly
    if (note.file_path.startsWith('/demo/')) {
      return NextResponse.redirect(new URL(note.file_path, request.url))
    }

    // Otherwise, generate a signed URL from Supabase storage (valid for 60 seconds)
    const { data, error: storageError } = await supabase.storage
      .from('notes')
      .createSignedUrl(note.file_path, 60)

    if (storageError || !data?.signedUrl) {
      throw new Error(storageError?.message || 'Failed to generate signed download link')
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
