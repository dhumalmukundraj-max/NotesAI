import OpenAI from 'openai'

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
const isGemini = !!process.env.GEMINI_API_KEY

export const openai = apiKey
  ? new OpenAI({
      apiKey: apiKey,
      baseURL: isGemini ? 'https://generativelanguage.googleapis.com/v1beta/openai/' : undefined,
    })
  : null

export const aiModel = isGemini ? 'gemini-1.5-flash' : 'gpt-4o-mini'
