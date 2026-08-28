import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai, aiModel } from '@/lib/ai/openai'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user profile exists to prevent foreign key violations (self-healing)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Student',
        email: user.email || '',
        role: 'student',
      })
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'AI Study Assistant is temporarily unavailable. Please set GEMINI_API_KEY or OPENAI_API_KEY in .env.local.' },
        { status: 503 }
      )
    }

    const { chatId, message, noteId, mode } = await request.json()

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Prompt cannot be empty.' }, { status: 400 })
    }

    // 2. Load note context if noteId provided
    let noteContext = ''
    let noteTitle = ''
    if (noteId) {
      const { data: note } = await supabase
        .from('notes')
        .select('title, content_text')
        .eq('id', noteId)
        .single()
      
      if (note) {
        noteTitle = note.title
        noteContext = note.content_text || ''
      }
    }

    // 3. Resolve or create chat session
    let activeChatId = chatId
    if (!activeChatId) {
      // Create new chat
      const chatTitle = noteTitle ? `Study: ${noteTitle}` : message.substring(0, 40) + (message.length > 40 ? '...' : '')
      const { data: newChat, error: chatError } = await supabase
        .from('ai_chats')
        .insert({
          user_id: user.id,
          title: chatTitle,
        })
        .select()
        .single()

      if (chatError || !newChat) {
        throw new Error(chatError?.message || 'Failed to create chat session.')
      }
      activeChatId = newChat.id
    } else {
      // Validate chat ownership
      const { data: chat } = await supabase
        .from('ai_chats')
        .select('id')
        .eq('id', activeChatId)
        .eq('user_id', user.id)
        .single()

      if (!chat) {
        return NextResponse.json({ error: 'Conversation session not found.' }, { status: 404 })
      }
    }

    // 4. Load chat history
    const { data: history } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('chat_id', activeChatId)
      .order('created_at', { ascending: true })

    // 5. Build system prompt
    let systemInstruction = 'You are a helpful AI study assistant designed for engineering and college students. Answer their questions clearly, professionally, and accurately.'
    
    if (mode === 'explain') {
      systemInstruction = 'You are an AI study assistant. Explain the concept simply using clear analogies, definitions, and examples.'
    } else if (mode === 'summarize') {
      systemInstruction = 'You are an AI study assistant. Create a highly concise, bulleted summary of the topic highlighting key takeaways, definitions, and equations.'
    } else if (mode === 'exam') {
      systemInstruction = 'You are an AI study assistant. Generate an exam-oriented answer. Use proper academic headings, point-by-point explanations, and definitions.'
    } else if (mode === 'mcq') {
      systemInstruction = 'You are an AI study assistant. Generate 5 multiple-choice questions (MCQs) with options A, B, C, D, and print the correct answers at the very end.'
    } else if (mode === 'viva') {
      systemInstruction = 'You are an AI study assistant. Generate 10 viva voce / oral exam questions on this topic with brief, precise answers.'
    } else if (mode === 'quiz') {
      systemInstruction = 'You are an AI study assistant. Quiz the student interactively. Ask exactly one question and wait for the student to reply before asking the next.'
    } else if (mode === 'simplify') {
      systemInstruction = 'You are an AI study assistant. Explain the concept in extremely simple language suitable for a first-year college student, using basic analogies.'
    }

    if (noteContext) {
      systemInstruction += `\n\nCRITICAL CONTEXT: The student is studying the note titled "${noteTitle}". You MUST answer their questions based primarily on the following extracted document text:\n---START TEXT---\n${noteContext}\n---END TEXT---`
    }

    // 6. Build messages payload for OpenAI
    const openAiMessages = [
      { role: 'system', content: systemInstruction },
      ...(history || []).map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user', content: message },
    ] as any

    // 7. Request OpenAI chat completion with fallback
    let assistantReply = ''
    try {
      const response = await openai.chat.completions.create({
        model: aiModel,
        messages: openAiMessages,
        temperature: 0.7,
        max_tokens: 1500,
      })
      assistantReply = response.choices[0].message.content || 'I could not generate a response.'
    } catch (openAiError: any) {
      const isQuotaError =
        openAiError.status === 429 ||
        openAiError.message?.toLowerCase().includes('quota') ||
        openAiError.message?.toLowerCase().includes('billing') ||
        openAiError.message?.toLowerCase().includes('credit')
      
      if (isQuotaError) {
        assistantReply = generateMockResponse(message, mode, noteTitle)
      } else {
        throw openAiError
      }
    }

    // 8. Save messages in database
    await supabase.from('ai_messages').insert([
      { chat_id: activeChatId, role: 'user', content: message },
      { chat_id: activeChatId, role: 'assistant', content: assistantReply },
    ])

    // Update chat updated_at timestamp
    await supabase
      .from('ai_chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeChatId)

    return NextResponse.json({
      chatId: activeChatId,
      role: 'assistant',
      content: assistantReply,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// Simulated mock helper when OpenAI quota limit ends
function generateMockResponse(prompt: string, mode: string, noteTitle?: string): string {
  const disclaimer = `🤖 **[StudyNotes AI - Offline Mock Assistant]**\n*Note: Your OpenAI API quota has been exceeded or is not configured. This is a local mock response simulating the selected study mode.*`
  
  let content = ''
  const subjectName = noteTitle || 'Study Topic'
  
  if (mode === 'mcq') {
    content = `Here are 5 practice Multiple-Choice Questions (MCQs) on the topic:

1. Which of the following is a primary goal of normalization in database design?
   A) Increasing database retrieval speed
   B) Eliminating redundant data
   C) Adding more columns
   D) Creating more indexes

2. In Python, which dunder method is called when initializing a new object?
   A) __str__
   B) __new__
   C) __init__
   D) __del__

3. Which layer of the OSI model is responsible for route determination and packet addressing?
   A) Data Link Layer
   B) Transport Layer
   C) Physical Layer
   D) Network Layer

4. Which CPU scheduling algorithm allocates CPU time using cyclical time quanta?
   A) FCFS
   B) Shortest Job First
   C) Round Robin
   D) Priority Scheduling

5. What CSS property is used to specify a grid container?
   A) display: flex
   B) display: grid
   C) display: block
   D) display: table

**Answers:**
1-B, 2-C, 3-D, 4-C, 5-B`
  } else if (mode === 'viva') {
    content = `Here are 10 common Viva/Oral Exam questions on this topic:

1. **Q: What is a functional dependency?**
   *A: A relationship between attributes in a database table where the value of one attribute determines the value of another.*
   
2. **Q: Explain inheritance in OOP.**
   *A: It allows a class (subclass) to inherit attributes and methods from another class (superclass), promoting code reuse.*
   
3. **Q: What is the convoy effect in CPU scheduling?**
   *A: When short processes wait behind a long, CPU-bound process in FCFS scheduling.*
   
4. **Q: What is the main difference between TCP and UDP?**
   *A: TCP is connection-oriented and reliable, while UDP is connectionless and faster but unreliable.*
   
5. **Q: What does CSS Flexbox stand for?**
   *A: Flexible Box Layout, used for one-dimensional layouts.*`
  } else if (mode === 'summarize') {
    content = `### Summary Sheet: ${subjectName}

- **Core Definition**: The topic covers primary principles of engineering syllabus topics including structural components and system interfaces.
- **Key Concepts**:
  - *Concept 1*: Contiguous elements optimize access speeds.
  - *Rule of thumb*: Eliminating partial dependencies yields 2NF.
- **Formulas/Structures**:
  - Time quantum allocations optimize Round Robin cycles.
  - OSI Layer 3 manages IP packet routing.
- **Conclusion**: Crucial for university exams and viva voce questions.`
  } else {
    content = `Here is a detailed study explanation for your question: **"${prompt}"**

1. **Overview**: This topic represents a core pillar in the syllabus. It regulates how data elements are indexed, managed, and computed.
2. **Detailed Breakdown**:
   - If querying notes like database schemas, normalization forms (1NF, 2NF, 3NF) ensure data integrity.
   - For programming questions, Object-Oriented principles (Inheritance, Polymorphism) form the foundation of software design.
3. **Analogy/Example**: Think of this concept like organizing a library. Instead of placing books randomly, we categorise them by subject (analogous to normalization) so that finding any book takes the shortest time possible.`
  }
  
  return `${disclaimer}\n\n${content}`
}
