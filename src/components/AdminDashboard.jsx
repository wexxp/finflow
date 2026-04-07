import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          setIsAdmin(true);
          fetchAdminData();
        } else {
          setLoading(false);
        }
      }
    };
    checkAdmin();
  }, []);

  const fetchAdminData = async () => {
    // On récupère les profils ET on calcule le total des ventes par utilisateur
    const { data: profilesData } = await supabase
      .from('profiles')
      .select(`
        email, 
        created_at,
        reventes (vente)
      `);

    const formattedData = profilesData.map(profile => ({
      email: profile.email,
      date: new Date(profile.created_at).toLocaleDateString(),
      totalVentes: profile.reventes?.reduce((sum, item) => sum + (item.vente || 0), 0) || 0
    }));

    setUsers(formattedData);
    setLoading(false);
  };

  if (loading) return <div style={styles.center}>Chargement du panneau de contrôle...</div>;
  if (!isAdmin) return <div style={styles.center}>🚫 Accès strictement réservé à l'administrateur.</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Tableau de Bord Administrateur 👑</h1>
        <p>Suivi global des utilisateurs et des performances.</p>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Utilisateurs</h3>
          <p style={styles.statNumber}>{users.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Volume Total des Ventes</h3>
          <p style={styles.statNumber}>{users.reduce((a, b) => a + b.totalVentes, 0).toFixed(2)} €</p>
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>Email</th>
            <th>Date d'inscription</th>
            <th>Total Ventes (€)</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i} style={styles.tableRow}>
              <td>{u.email}</td>
              <td>{u.date}</td>
              <td style={{ fontWeight: 'bold' }}>{u.totalVentes.toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: { padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' },
  header: { borderBottom: '2px solid #eee', marginBottom: '30px' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { background: '#f8f9fa', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  statNumber: { fontSize: '24px', fontWeight: 'bold', color: '#007bff' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  tableHeader: { backgroundColor: '#343a40', color: 'white', textAlign: 'left' },
  tableRow: { borderBottom: '1px solid #ddd', padding: '10px' },
};

export default AdminDashboard;