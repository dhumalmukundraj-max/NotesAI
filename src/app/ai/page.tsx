'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  Plus,
  Trash2,
  Send,
  Loader2,
  BookOpen,
  MessageSquare,
  FileText,
  Copy,
  CheckCircle,
  RefreshCw,
  Info,
} from 'lucide-react'

function AIStudyAssistant() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryChatId = searchParams.get('chatId')
  const queryNoteId = searchParams.get('noteId')

  const [chats, setChats] = useState<any[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  
  // Note context states
  const [activeNote, setActiveNote] = useState<any>(null)
  
  // Form input and mode states
  const [input, setInput] = useState('')
  const [selectedMode, setSelectedMode] = useState('explain')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  // Mode configurations
  const modes = [
    { id: 'explain', label: 'Explain Simply', desc: 'Analogy-rich concepts' },
    { id: 'summarize', label: 'Summarize', desc: 'Key takeaways' },
    { id: 'exam', label: 'Exam Answer', desc: 'Structured revision answer' },
    { id: 'mcq', label: 'MCQs Generator', desc: '5 sample questions' },
    { id: 'viva', label: 'Viva Prep', desc: '10 oral exam Q&As' },
    { id: 'simplify', label: 'Simplify Topic', desc: 'Basic terminology' },
  ]

  // Prompt templates
  const presets = [
    { label: 'What is DBMS normalization?', prompt: 'Explain normalization in DBMS and why we use it.' },
    { label: 'Explain recursion in C', prompt: 'Explain recursion in C programming with a simple stack trace example.' },
    { label: 'OS scheduling algorithms', prompt: 'List and briefly compare major CPU scheduling algorithms in Operating Systems.' },
    { label: 'Explain OSI layers', prompt: 'Briefly explain the 7 layers of the OSI model and their main functions.' },
  ]

  // 1. Fetch chats list and active note details
  useEffect(() => {
    async function initAssistant() {
      // Load chats
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: chatData } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      
      if (chatData) {
        setChats(chatData)
      }

      // Check query note context
      if (queryNoteId) {
        const { data: note } = await supabase
          .from('notes')
          .select('id, title, topic, content_text')
          .eq('id', queryNoteId)
          .single()
        if (note) {
          setActiveNote(note)
        }
      } else {
        setActiveNote(null)
      }

      setHistoryLoading(false)
    }

    initAssistant()
  }, [supabase, queryNoteId, router])

  // 2. Load active chat messages when activeChatId changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeChatId) {
        setMessages([])
        return
      }

      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data)
      }
    }

    loadMessages()
  }, [supabase, activeChatId])

  // 3. React to queryChatId from URL parameters
  useEffect(() => {
    if (queryChatId) {
      setActiveChatId(queryChatId)
    }
  }, [queryChatId])

  // 4. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const startNewChat = () => {
    setActiveChatId(null)
    setMessages([])
    // Clear URL parameters
    router.push('/ai')
  }

  const handleSendMessage = async (promptText: string) => {
    if (!promptText || promptText.trim() === '') return
    setLoading(true)
    setInput('')

    // Append user message locally for immediate UI update
    const userMsg = { role: 'user', content: promptText }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChatId,
          message: promptText,
          noteId: activeNote?.id || null,
          mode: selectedMode,
        }),
      })

      const data = await res.json()
      if (data.error) {
        throw new Error(data.error)
      }

      // If a new chat was created, refresh chats list and update URL/active state
      if (!activeChatId && data.chatId) {
        setActiveChatId(data.chatId)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: chatData } = await supabase
            .from('ai_chats')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
          if (chatData) setChats(chatData)
        }
        router.push(`/ai?chatId=${data.chatId}`)
      }

      // Append assistant reply locally
      const assistantMsg = { role: 'assistant', content: data.content }
      setMessages((prev) => [...prev, assistantMsg])

    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${err.message || 'Failed to generate response.'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all conversations?')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('ai_chats')
      .delete()
      .eq('user_id', user.id)

    if (!error) {
      setChats([])
      startNewChat()
    }
  }

  const handleCopy = (text: string, msgIndex: number) => {
    navigator.clipboard.writeText(text)
    setCopiedId(msgIndex.toString())
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRegenerate = async () => {
    // Find last user message
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user')
    
    if (lastUserMessage) {
      // Remove last assistant message
      if (messages[messages.length - 1]?.role === 'assistant') {
        setMessages((prev) => prev.slice(0, -1))
      }
      handleSendMessage(lastUserMessage.content)
    }
  }

  const selectPresetPrompt = (promptText: string) => {
    handleSendMessage(promptText)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background font-sans overflow-hidden">
      {/* Sidebar - Chats lists */}
      <div className="hidden md:flex w-72 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border space-y-3">
          <button
            onClick={startNewChat}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow shadow-primary/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Study Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            History
          </h3>
          {historyLoading ? (
            <div className="space-y-2 p-3">
              <div className="h-8 bg-secondary rounded-lg animate-pulse" />
              <div className="h-8 bg-secondary rounded-lg animate-pulse" />
              <div className="h-8 bg-secondary rounded-lg animate-pulse" />
            </div>
          ) : chats.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">
              No study chats yet.
            </p>
          ) : (
            chats.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveChatId(c.id)
                  router.push(`/ai?chatId=${c.id}`)
                }}
                className={`flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer ${
                  activeChatId === c.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1">{c.title}</span>
              </button>
            ))
          )}
        </div>

        {chats.length > 0 && (
          <div className="p-4 border-t border-border bg-secondary/20">
            <button
              onClick={clearHistory}
              className="flex w-full items-center justify-center space-x-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Chat Mode settings bar */}
        <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm">Study Assistant</h2>
              <p className="text-xs text-muted-foreground">Mode: {modes.find((m) => m.id === selectedMode)?.label}</p>
            </div>
          </div>
          
          {/* Preset Modes Dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              {modes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Window Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeNote && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center space-x-3 text-sm text-foreground">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <span className="font-semibold text-primary">Active Note Context:</span> Querying primarily from{' '}
                <span className="font-bold">{activeNote.title}</span>.
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            /* Init screen layout */
            <div className="max-w-2xl mx-auto text-center py-10 space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground">AI Study Partner</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Ask definitions, explain complex code, generate practice MCQs, or review notes.
                </p>
              </div>

              {/* Modes Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {modes.slice(0, 3).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`rounded-2xl border p-4 text-left glow-card cursor-pointer bg-card ${
                      selectedMode === m.id ? 'border-primary ring-1 ring-primary' : 'border-border'
                    }`}
                  >
                    <h3 className="font-bold text-sm text-foreground">{m.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-normal">{m.desc}</p>
                  </button>
                ))}
              </div>

              {/* Preset prompts templates list */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left pl-1">
                  Try asking:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => selectPresetPrompt(p.prompt)}
                      className="rounded-xl border border-border bg-card p-3 text-left text-xs font-medium text-foreground hover:bg-secondary/40 hover:border-primary/40 transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Chat Bubbles List */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((m, idx) => {
                const isUser = m.role === 'user'
                return (
                  <div
                    key={idx}
                    className={`flex items-start space-x-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="rounded-xl bg-primary/10 text-primary p-2 flex-shrink-0 mt-0.5 border border-primary/20">
                        <Sparkles className="h-4.5 w-4.5" />
                      </div>
                    )}

                    <div className="space-y-1 max-w-[85%]">
                      <div
                        className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-card border border-border text-foreground rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.content}</p>
                      </div>

                      {/* Msg actions footer (Copy & Regenerate) */}
                      {!isUser && (
                        <div className="flex items-center space-x-3 pl-2 text-xs text-muted-foreground">
                          <button
                            onClick={() => handleCopy(m.content, idx)}
                            className="flex items-center space-x-1 hover:text-foreground transition-colors cursor-pointer"
                          >
                            {copiedId === idx.toString() ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-green-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          
                          {idx === messages.length - 1 && (
                            <button
                              onClick={handleRegenerate}
                              className="flex items-center space-x-1 hover:text-foreground transition-colors cursor-pointer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Regenerate</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div className="flex items-start space-x-3.5 justify-start">
                  <div className="rounded-xl bg-primary/10 text-primary p-2 flex-shrink-0 border border-primary/20">
                    <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input box form container */}
        <div className="border-t border-border bg-card p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(input)
            }}
            className="max-w-3xl mx-auto flex items-center space-x-2.5 bg-background border border-border rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary transition-all"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(input)
                }
              }}
              placeholder={activeNote ? `Ask AI about "${activeNote.title}"...` : "Ask a concept or request mode action..."}
              className="flex-1 max-h-24 bg-transparent text-sm text-foreground placeholder-muted-foreground border-none outline-none resize-none"
              rows={1}
            />

            <button
              type="submit"
              disabled={loading || !input || input.trim() === ''}
              className="rounded-xl bg-primary text-primary-foreground p-2.5 hover:bg-primary/95 shadow shadow-primary/10 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AIStudyPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AIStudyAssistant />
    </Suspense>
  )
}
