import { redirect } from 'next/navigation'

export default async function AIChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/ai?chatId=${id}`)
}
