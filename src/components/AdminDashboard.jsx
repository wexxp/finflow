import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Shield, Users, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard({ setActiveTab }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin(userId, currentStatus) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Statut mis à jour !' });
      fetchUsers();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
    }
  }

  return (
    <div className="admin-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'var(--text1)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Shield size={32} color="#ffcc00" />
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Panel Administration</h1>
        </div>
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg3)', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', color: 'var(--text1)', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} /> Retour
        </button>
      </header>

      {message && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem', 
          backgroundColor: message.type === 'success' ? '#10b98122' : '#ef444422',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{ background: 'var(--bg2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--bg3)' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--bg3)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Gestion des utilisateurs</h2>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg3)', color: 'var(--text2)', fontSize: '0.9rem' }}>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Admin</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--bg3)' }}>
                  <td style={{ padding: '1rem' }}>{user.email || 'N/A'}</td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text2)' }}>{user.id.slice(0, 8)}...</td>
                  <td style={{ padding: '1rem' }}>
                    {user.is_admin ? 
                      <CheckCircle size={18} color="#10b981" /> : 
                      <XCircle size={18} color="#ef4444" />
                    }
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '6px', 
                        border: '1px solid var(--bg3)', 
                        background: 'transparent', 
                        color: 'var(--text1)', 
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {user.is_admin ? 'Retirer Admin' : 'Nommer Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}