import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null
export const isSupabaseConfigured = Boolean(supabase)

export async function loadCloudCards() {
  if (!supabase) return []
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session || (await supabase.auth.signInAnonymously()).data.session
  if (!session) return []
  const { data, error } = await supabase.from('cards').select('client_id, word, translation, example, level, interval, due, tag, phonetic').eq('user_id', session.user.id).order('client_id')
  if (error) throw error
  return (data || []).map(card => ({ id: card.client_id, word: card.word, translation: card.translation, example: card.example, level: card.level, interval: card.interval, due: card.due, tag: card.tag, phonetic: card.phonetic }))
}

export async function saveCloudCards(cards: Array<{ id: number; word: string; translation: string; example: string; level: string; interval: number; due: boolean; tag: string; phonetic: string }>) {
  if (!supabase) return
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session || (await supabase.auth.signInAnonymously()).data.session
  if (!session) return
  const { error } = await supabase.from('cards').upsert(cards.map(card => ({ user_id: session.user.id, client_id: card.id, ...card })), { onConflict: 'user_id,client_id' })
  if (error) console.warn('Supabase sync failed:', error.message)
}
