import { useState } from 'react'
import { supabase } from '../utils/supabase'
import './Auth.css'

function validatePassword(pwd) {
  const errors = []
  if (pwd.length < 8) errors.push('8 caractères minimum')
  if (!/[A-Z]/.test(pwd)) errors.push('1 majuscule')
  if (!/[0-9]/.test(pwd)) errors.push('1 chiffre')
  return errors
}

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const pwdErrors = mode === 'register' ? validatePassword(password) : []

  async function handleSubmit() {
    setError('')
    setSuccess('')
    if (mode === 'register' && pwdErrors.length > 0) {
      setError('Mot de passe invalide — voir les critères ci-dessous')
      return
    }
    setLoading(true)
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

  async function handleForgot() {
    if (!forgotEmail.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin,
    })
    setLoading(false)
    if (error) setError('Erreur lors de l\'envoi.')
    else setForgotSent(true)
  }

  if (showForgot) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-icon">◈</span>
            <span className="auth-name">ICEdep</span>
          </div>
          <p className="auth-sub">Réinitialiser ton mot de passe</p>
          {forgotSent ? (
            <p className="auth-success">Email envoyé ! Vérifie ta boîte mail et clique sur le lien.</p>
          ) : (
            <>
              <div className="auth-fields">
                <div className="auth-field">
                  <label>Ton email</label>
                  <input type="email" placeholder="ton@email.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleForgot()}/>
                </div>
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn" onClick={handleForgot} disabled={loading}>
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </>
          )}
          <p className="auth-switch">
            <button onClick={()=>{setShowForgot(false);setError('');setForgotSent(false)}}>← Retour à la connexion</button>
          </p>
        </div>
      </div>
    )
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
            <input type="email" placeholder="ton@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
          </div>
          <div className="auth-field">
            <label>Mot de passe</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
            {mode === 'register' && password.length > 0 && (
              <div className="pwd-hints">
                {[
                  { ok: password.length >= 8, label: '8 caractères minimum' },
                  { ok: /[A-Z]/.test(password), label: '1 majuscule' },
                  { ok: /[0-9]/.test(password), label: '1 chiffre' },
                ].map(h => (
                  <div key={h.label} className={`pwd-hint ${h.ok ? 'ok' : 'ko'}`}>
                    {h.ok ? '✓' : '✗'} {h.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>

        {mode === 'login' && (
          <p style={{textAlign:'center',marginBottom:'0.75rem'}}>
            <button onClick={()=>setShowForgot(true)} style={{background:'transparent',color:'var(--text3)',fontSize:13,textDecoration:'underline',cursor:'pointer'}}>
              Mot de passe oublié ?
            </button>
          </p>
        )}

        <p className="auth-switch">
          {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
          <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setSuccess('')}}>
            {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  )
}
