import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Users, UserPlus, Shield } from 'lucide-react';

export default function Utilisateurs({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([
    { id: 1, nom: 'ADMIN', description: 'Accès complet au système' },
    { id: 2, nom: 'GESTIONNAIRE', description: 'Gestion du catalogue et stocks' },
    { id: 3, nom: 'VENDEUR', description: 'Consultation et ventes' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    role_id: 2,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple requête GET pour charger les utilisateurs et les rôles
  const loadData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        api.get('/utilisateurs'),
        api.get('/roles'),
      ]);
      setUsers(uRes.data || []);
      if (rRes.data && rRes.data.length > 0) {
        setRoles(rRes.data);
        setForm((prev) => ({ ...prev, role_id: prev.role_id || rRes.data[0].id }));
      }
    } catch (err) {
      console.error('Erreur chargement données utilisateurs:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Simple requête POST pour créer un utilisateur
  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.role_id) {
      setErrorMsg('Veuillez sélectionner un rôle.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/register', {
        nom: form.nom.trim(),
        email: form.email.trim(),
        mot_de_passe: form.mot_de_passe,
        role_id: parseInt(form.role_id),
      });

      setShowModal(false);
      setForm({
        nom: '',
        email: '',
        mot_de_passe: '',
        role_id: roles[0]?.id || 1,
      });
      loadData();
      alert('✅ Compte utilisateur créé avec succès !');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Gestion des Utilisateurs & Rôles</h1>
          <p className="page-subtitle">Administration des comptes d'accès (RBAC)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={18} /> Nouvel Utilisateur
        </button>
      </div>

      <div className="card-table">
        <table className="table-custom">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom de l'agent</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ color: '#64748B' }}>#{u.id}</td>
                <td style={{ fontWeight: 600 }}>{u.nom}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`user-role-badge role-${u.role?.nom}`}>
                    {u.role?.nom}
                  </span>
                </td>
                <td>
                  <span style={{ color: u.actif ? '#34D399' : '#F87171', fontWeight: 600 }}>
                    {u.actif ? '● Actif' : '○ Désactivé'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Création Utilisateur */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Créer un Compte</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                marginBottom: '16px',
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Nom Complet</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="ex: Sophie Martin"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email de connexion</label>
                <input
                  type="email"
                  className="input-field"
                  required
                  placeholder="sophie@stockpro.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe temporaire</label>
                <input
                  type="password"
                  className="input-field"
                  required
                  placeholder="Au moins 6 caractères"
                  value={form.mot_de_passe}
                  onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rôle Attribué</label>
                <select
                  className="input-field"
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nom} - {r.description}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Création en cours...' : 'Créer le Compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
