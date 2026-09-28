import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = url && key ? createClient(url, key) : null
export const isSupabaseConfigured = Boolean(supabase)

export type CloudCard = { id: number; word: string; translation: string; example: string; level: string; interval: number; due: boolean; tag: string; phonetic: string; deckId?: string }
export type CloudDeck = { id: string; title: string; description: string; color: string }

async function session() {
  if (!supabase) return null
  const current = (await supabase.auth.getSession()).data.session
  if (current) return current
  return (await supabase.auth.signInAnonymously()).data.session
}

export async function loadCloudData() {
  const user = await session()
  if (!user || !supabase) return { cards: [] as CloudCard[], decks: [] as CloudDeck[], reviews: 0 }
  const [cardsResult, decksResult, reviewsResult] = await Promise.all([
    supabase.from('cards').select('client_id, deck_id, word, translation, example, level, interval, due, tag, phonetic').eq('user_id', user.user.id).order('client_id'),
    supabase.from('decks').select('id, title, description, color').eq('user_id', user.user.id).order('created_at'),
    supabase.from('review_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.user.id).gte('created_at', new Date().toISOString().slice(0, 10))
  ])
  if (cardsResult.error) throw cardsResult.error
  if (decksResult.error) throw decksResult.error
  if (reviewsResult.error) throw reviewsResult.error
  return {
    cards: (cardsResult.data || []).map(card => ({ id: card.client_id, word: card.word, translation: card.translation, example: card.example, level: card.level, interval: card.interval, due: card.due, tag: card.tag, phonetic: card.phonetic, deckId: card.deck_id || undefined })),
    decks: (decksResult.data || []) as CloudDeck[],
    reviews: reviewsResult.count || 0,
  }
}

export async function saveCloudCards(cards: CloudCard[]) {
  const user = await session()
  if (!user || !supabase || !cards.length) return
  const { error } = await supabase.from('cards').upsert(cards.map(card => ({ user_id: user.user.id, client_id: card.id, word: card.word, translation: card.translation, example: card.example, level: card.level, interval: card.interval, due: card.due, tag: card.tag, phonetic: card.phonetic, deck_id: card.deckId || null })), { onConflict: 'user_id,client_id' })
  if (error) console.warn('Supabase card sync failed:', error.message)
}

export async function saveCloudDeck(deck: Omit<CloudDeck, 'id'>) {
  const user = await session()
  if (!user || !supabase) return null
  const { data, error } = await supabase.from('decks').insert({ user_id: user.user.id, ...deck }).select('id, title, description, color').single()
  if (error) throw error
  return data as CloudDeck
}

export async function logCloudReview(cardId: number, rating: number, interval: number) {
  const user = await session()
  if (!user || !supabase) return
  const { error } = await supabase.from('review_logs').insert({ user_id: user.user.id, client_id: cardId, rating, interval })
  if (error) console.warn('Supabase review sync failed:', error.message)
}
