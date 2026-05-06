import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { TRANSLATIONS } from './translations'

const I18nContext = createContext({
  lang: 'fr',
  setLang: () => {},
  t: (k) => k,
})

const STORAGE_KEY = 'icedep_lang'
const SUPPORTED = ['fr', 'en']

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (SUPPORTED.includes(stored)) return stored
      // Fallback : langue navigateur si supportée
      const nav = (navigator.language || '').slice(0, 2).toLowerCase()
      if (SUPPORTED.includes(nav)) return nav
    } catch {}
    return 'fr'
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const setLang = (next) => {
    if (SUPPORTED.includes(next)) setLangState(next)
  }

  // t(key) : retourne la traduction. Si manquante, fallback FR puis clé brute.
  const t = useCallback((key, fallback) => {
    const dict = TRANSLATIONS[lang] || {}
    if (dict[key] !== undefined) return dict[key]
    const fr = TRANSLATIONS.fr?.[key]
    if (fr !== undefined) return fr
    return fallback !== undefined ? fallback : key
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
export const useT = () => useContext(I18nContext).t
