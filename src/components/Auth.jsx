import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { useT } from '../utils/i18n.jsx'
import './Auth.css'

function validatePassword(pwd) {
  const errors = []
  if (pwd.length < 8) errors.push('8 caractères minimum')
  if (!/[A-Z]/.test(pwd)) errors.push('1 majuscule')
  if (!/[0-9]/.test(pwd)) errors.push('1 chiffre')
  return errors
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Détection robuste du quirk Supabase "email déjà utilisé".
 * Supabase ne renvoie PAS d'erreur dans ce cas (anti-énumération) mais
 * laisse plusieurs indices :
 *   - identities est vide (cas standard, confirmé par la doc)
 *   - identities est null/undefined (variantes selon version Supabase)
 *   - confirmation_sent_at est null (aucun email n'a été émis)
 *   - session est null ET email_confirmed_at est null (compte non créé)
 * On combine plusieurs signaux pour être tolérant.
 */
function isExistingUserResponse(data) {
  const user = data?.user
  if (!user) return false

  // Signal principal : tableau identities vide ou absent
  const identities = user.identities
  const noIdentities =
    identities == null ||
    (Array.isArray(identities) && identities.length === 0)

  // Signal secondaire : aucun email de confirmation envoyé
  // (un nouveau user a normalement un confirmation_sent_at non-null)
  const noConfirmationEmail = !user.confirmation_sent_at && !user.email_confirmed_at

  return noIdentities || noConfirmationEmail
}

// Traduit les messages d'erreur Supabase en français user-friendly
function translateAuthError(error, mode) {
  const msg = (error?.message || '').toLowerCase()

  if (msg.includes('already registered') || msg.includes('user already exists')) {
    return 'Cette adresse email est déjà utilisée. Connectez-vous à la place.'
  }
  if (msg.includes('invalid login credentials') || (msg.includes('invalid') && msg.includes('credentials'))) {
    return 'Email ou mot de passe incorrect.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Email non confirmé — vérifiez votre boîte mail (et les spams).'
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Trop de tentatives — patientez quelques minutes avant de réessayer.'
  }
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('short'))) {
    return 'Mot de passe trop faible — il doit faire au moins 8 caractères avec une majuscule et un chiffre.'
  }
  if (msg.includes('email') && msg.includes('invalid')) {
    return 'Format d\'email invalide.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Erreur réseau — vérifiez votre connexion internet.'
  }
  // Fallback : on montre le message brut pour ne plus rien cacher
  return (mode === 'register' ? 'Création du compte impossible : ' : 'Connexion impossible : ') + (error?.message || 'erreur inconnue.')
}

export default function Auth({ defaultMode = 'login' }) {
  const t = useT()
  const [mode, setMode] = useState(defaultMode)
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
    setError(''); setSuccess('')

    // ── Validation client avant l'appel Supabase ──
    const trimmedEmail = email.trim()
    if (!trimmedEmail) { setError('Veuillez saisir votre email.'); return }
    if (!isValidEmail(trimmedEmail)) { setError('Format d\'email invalide.'); return }
    if (!password) { setError('Veuillez saisir votre mot de passe.'); return }
    if (mode === 'register' && pwdErrors.length > 0) {
      setError('Mot de passe invalide — voir les critères ci-dessous.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })
        if (error) setError(translateAuthError(error, 'login'))
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) {
          setError(translateAuthError(error, 'register'))
        } else if (isExistingUserResponse(data)) {
          // Quirk Supabase anti-énumération : aucun email n'a été envoyé,
          // l'utilisateur existe déjà. On le signale clairement.
          setError('Un compte existe déjà avec cet email. Aucun email de confirmation n\'a été envoyé. Connectez-vous ou récupérez votre mot de passe.')
        } else {
          setSuccess('Compte créé ! Vérifiez vos emails (et les spams) pour confirmer votre compte.')
        }
      }
    } catch (e) {
      setError('Erreur réseau — vérifiez votre connexion internet et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot() {
    setError('')
    const trimmed = forgotEmail.trim()
    if (!trimmed) { setError('Veuillez saisir votre email.'); return }
    if (!isValidEmail(trimmed)) { setError('Format d\'email invalide.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo: window.location.origin })
      if (error) setError(translateAuthError(error, 'login'))
      else setForgotSent(true)
    } catch (e) {
      setError('Erreur réseau — vérifiez votre connexion internet.')
    } finally {
      setLoading(false)
    }
  }

  if (showForgot) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-brand"><span className="auth-icon">◈</span><span className="auth-name">ICEdep</span></div>
          <p className="auth-sub">{t('auth.forgot_title')}</p>
          {forgotSent ? (
            <p className="auth-success">{t('auth.forgot_sent')}</p>
          ) : (
            <>
              <div className="auth-fields">
                <div className="auth-field">
                  <label>{t('auth.forgot_email')}</label>
                  <input type="email" placeholder={t('auth.email_placeholder')} value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleForgot()}/>
                </div>
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn" onClick={handleForgot} disabled={loading}>{loading ? t('auth.loading') : t('auth.forgot_send')}</button>
            </>
          )}
          <p className="auth-switch"><button onClick={()=>{setShowForgot(false);setError('');setForgotSent(false)}}>{t('auth.back_login')}</button></p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand"><span className="auth-icon">◈</span><span className="auth-name">ICEdep</span></div>
        <p className="auth-sub">{mode === 'login' ? t('auth.login_title') : t('auth.register_title')}</p>
        <div className="auth-fields">
          <div className="auth-field">
            <label>{t('auth.email')}</label>
            <input type="email" placeholder={t('auth.email_placeholder')} value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
          </div>
          <div className="auth-field">
            <label>{t('auth.password')}</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
            {mode === 'register' && password.length > 0 && (
              <div className="pwd-hints">
                {[{ok:password.length>=8,label:t('auth.pwd_min')},{ok:/[A-Z]/.test(password),label:t('auth.pwd_upper')},{ok:/[0-9]/.test(password),label:t('auth.pwd_digit')}].map(h=>(
                  <div key={h.label} className={`pwd-hint ${h.ok?'ok':'ko'}`}>{h.ok?'✓':'✗'} {h.label}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        {error && <p className="auth-error">{error}</p>}
        {/* Raccourci visible pour basculer en connexion si email déjà utilisé */}
        {error && error.toLowerCase().includes('compte existe') && mode === 'register' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              style={{
                flex: 1,
                height: 38,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Se connecter →
            </button>
            <button
              type="button"
              onClick={() => { setForgotEmail(email); setShowForgot(true); setError('') }}
              style={{
                flex: 1,
                height: 38,
                background: 'transparent',
                color: 'var(--text2)',
                border: '1px solid var(--line2)',
                borderRadius: 'var(--radius)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Mot de passe oublié
            </button>
          </div>
        )}
        {success && <p className="auth-success">{success}</p>}
        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? t('auth.loading') : mode === 'login' ? t('auth.login_btn') : t('auth.register_btn')}
        </button>
        {mode === 'login' && (
          <p style={{textAlign:'center',marginBottom:'0.75rem'}}>
            <button onClick={()=>setShowForgot(true)} style={{background:'transparent',color:'var(--text3)',fontSize:13,textDecoration:'underline',cursor:'pointer',border:'none',fontFamily:'var(--font-body)'}}>{t('auth.forgot_pwd')}</button>
          </p>
        )}
        <p className="auth-switch">
          {mode === 'login' ? t('auth.no_account') : t('auth.have_account')}
          <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setSuccess('')}}>
            {mode === 'login' ? t('auth.create_account') : t('auth.login_btn')}
          </button>
        </p>
      </div>
    </div>
  )
}
