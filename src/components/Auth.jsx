import { useState } from 'react'
import { supabase } from '../utils/supabase'
import './Auth.css'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setSuccess('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Email ou mot de passe incorrect.')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError('Erreur lors de la création du compte.')
      else setSuccess('Compte créé ! Vérifie tes emails pour confirmer ton compte.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-icon">◈</span>
          <span className="auth-name">ICEdep</span>
        </div>
        <p className="auth-sub">
          {mode === 'login' ? 'Connecte-toi à ton espace' : 'Crée ton compte gratuitement'}
        </p>

        <div className="auth-fields">
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email" placeholder="ton@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="auth-field">
            <label>Mot de passe</label>
            <input
              type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>

        <p className="auth-switch">
          {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}>
            {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  )
}
