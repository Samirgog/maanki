# Lingo

Игровой PWA-тренажёр английских слов на React, TypeScript и Vite.

## Запуск

```bash
npm install
npm run dev
```

Production build для GitHub Pages:

```bash
npm run build
```

## Supabase

1. Создай проект на [supabase.com](https://supabase.com).
2. В Authentication → Providers включи Anonymous sign-ins.
3. Выполни SQL из `supabase/migrations/001_lingo.sql` в SQL Editor.
4. Скопируй `.env.example` в `.env` и вставь Project URL и anon key.

После этого приложение автоматически создаёт анонимную сессию и синхронизирует карточки с таблицей `public.cards`. Без переменных окружения оно работает офлайн с сохранением в `localStorage`.
