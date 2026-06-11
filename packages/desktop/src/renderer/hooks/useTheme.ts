import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useTheme(): {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (t: Theme) => void
} {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) ?? 'system',
  )

  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  useEffect(() => {
    document.body.classList.toggle('dark', resolved === 'dark')
    localStorage.setItem('theme', theme)
  }, [resolved, theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return { theme, resolved, setTheme }
}
