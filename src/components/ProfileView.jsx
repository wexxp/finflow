import { useState, useRef } from 'react'
import { Camera, Save, X, Shield, Zap } from 'lucide-react'
import { updateProfile } from '../utils/db'
import './ProfileView.css'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 Mo
const AVATAR_SIZE = 256

export default function ProfileView({ userId, userEmail, displayName, avatarUrl, isPremium, isAdmin, refreshProfile }) {
  const [name, setName] = useState(displayName || '')
  const [avatar, setAvatar] = useState(avatarUrl || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setMsg('❌ Photo trop lourde (max 5 Mo)')
      return
    }
    setMsg('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        // Resize en carré 256×256 (crop center) pour limiter la taille en base
        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_SIZE
        canvas.height = AVATAR_SIZE
        const ctx = canvas.getContext('2d')
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
        setAvatar(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset input
  }

  async function handleSave() {
    setSaving(true)
    setMsg('')
    const { error } = await updateProfile(userId, {
      display_name: name.trim() || null,
      avatar_url: avatar || null,
    })
    if (error) {
      setMsg(`❌ ${error.message}`)
    } else {
      setMsg('✓ Profil enregistré')
      if (refreshProfile) await refreshProfile()
    }
    setSaving(false)
  }

  function removeAvatar() {
    setAvatar('')
  }

  const initials = (name || userEmail || '?').trim().slice(0, 2).toUpperCase()

  return (
    <div className="profile-view">
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">Mon profil</h1>
          <p className="page-sub">Personnalise ton nom et ton avatar</p>
        </div>
      </div>

      <div className="profile-card fade-up stagger-1">
        <div className="profile-avatar-section">
          <div className="profile-avatar-preview">
            {avatar ? (
              <img src={avatar} alt="Avatar"/>
            ) : (
              <div className="profile-avatar-placeholder">{initials}</div>
            )}
          </div>
          <div className="profile-avatar-actions">
            <button className="profile-btn-secondary" onClick={() => fileRef.current?.click()}>
              <Camera size={14}/> {avatar ? 'Changer' : 'Ajouter une photo'}
            </button>
            {avatar && (
              <button className="profile-btn-ghost" onClick={removeAvatar}>
                <X size={14}/> Retirer
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }}/>
          </div>
        </div>

        <div className="profile-fields">
          <div className="profile-field">
            <label>Nom d'affichage</label>
            <input
              type="text"
              placeholder="Comment veux-tu être appelé ?"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
            />
          </div>

          <div className="profile-field">
            <label>Email</label>
            <input type="text" value={userEmail || ''} disabled/>
          </div>

          <div className="profile-field">
            <label>Statut</label>
            <div className="profile-badges">
              {isAdmin && (
                <span className="profile-badge admin">
                  <Shield size={12}/> Administrateur
                </span>
              )}
              {isPremium && (
                <span className="profile-badge premium">
                  <Zap size={12}/> Premium
                </span>
              )}
              {!isPremium && !isAdmin && (
                <span className="profile-badge free">Compte gratuit</span>
              )}
            </div>
          </div>
        </div>

        <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
          <Save size={14}/> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>

        {msg && (
          <div className={`profile-msg ${msg.startsWith('❌') ? 'err' : 'ok'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}
