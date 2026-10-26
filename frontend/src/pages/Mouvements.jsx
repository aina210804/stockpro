import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ArrowDownRight, ArrowUpRight, Plus, AlertCircle } from 'lucide-react';

export default function Mouvements({ currentUser }) {
  const [mouvements, setMouvements] = useState([]);
  const [produits, setProduits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  // Formulaire mouvement
  const [form, setForm] = useState({
    produit_id: '',
    type: 'SORTIE',
    quantite: 1,
    motif: 'VENTE',
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Simple requête directe GET pour l'historique
  const loadMouvements = async () => {
    try {
      let q = '';
      if (typeFilter) q = `?type=${typeFilter}`;
      const res = await api.get(`/mouvements${q}`);
      setMouvements(res.data.mouvements || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProduits = async () => {
    try {
      const res = await api.get('/produits?limit=100');
      const list = res.data.produits || [];
      setProduits(list);
      if (list.length > 0) {
        setForm((prev) => ({ ...prev, produit_id: list[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMouvements();
    loadProduits();
  }, [typeFilter]);

  // Simple requête POST pour enregistrer un mouvement (contrôle atomique du stock négatif)
  const handleSaveMouvement = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await api.post('/mouvements', {
        produit_id: parseInt(form.produit_id),
        type: form.type,
        quantite: parseInt(form.quantite),
        motif: form.motif,
      });

      setShowModal(false);
      loadMouvements();
      loadProduits();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Mouvements de Stock</h1>
          <p className="page-subtitle">Traçabilité complète des entrées et sorties en temps réel</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Enregistrer un Mouvement
        </button>
      </div>

      {/* Filtres simples */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          className={`btn ${typeFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTypeFilter('')}
        >
          Tous les mouvements
        </button>
        <button
          className={`btn ${typeFilter === 'ENTREE' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTypeFilter('ENTREE')}
        >
          <ArrowDownRight size={16} /> Entrées (Achats / Réceptions)
        </button>
        <button
          className={`btn ${typeFilter === 'SORTIE' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTypeFilter('SORTIE')}
        >
          <ArrowUpRight size={16} /> Sorties (Ventes / Pertes)
        </button>
      </div>

      <div className="card-table">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Date & Heure</th>
              <th>Sens</th>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Motif</th>
              <th>Opérateur</th>
            </tr>
          </thead>
          <tbody>
            {mouvements.map((m) => {
              const isEntree = m.type === 'ENTREE';
              return (
                <tr key={m.id}>
                  <td style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                    {new Date(m.date_mouvement).toLocaleString('fr-FR')}
                  </td>
                  <td>
                    <span className={`badge-mvt ${isEntree ? 'mvt-ENTREE' : 'mvt-SORTIE'}`}>
                      {isEntree ? '↓ ENTRÉE' : '↑ SORTIE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.produit?.nom}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{m.produit?.reference}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: isEntree ? '#34D399' : '#F87171' }}>
                    {isEntree ? `+${m.quantite}` : `-${m.quantite}`}
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }}>
                      {m.motif}
                    </span>
                  </td>
                  <td style={{ color: '#CBD5E1' }}>{m.utilisateur?.nom}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Enregistrement Mouvement */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Déclarer un Mouvement de Stock</h3>
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveMouvement}>
              <div className="form-group">
                <label className="form-label">Produit concerné</label>
                <select
                  className="input-field"
                  value={form.produit_id}
                  onChange={(e) => setForm({ ...form, produit_id: e.target.value })}
                  required
                >
                  {produits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference} - {p.nom} (Stock actuel: {p.quantite_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Type d'opération</label>
                  <select
                    className="input-field"
                    value={form.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      setForm({
                        ...form,
                        type: t,
                        motif: t === 'ENTREE' ? 'ACHAT' : 'VENTE',
                      });
                    }}
                  >
                    <option value="SORTIE">SORTIE</option>
                    <option value="ENTREE">ENTRÉE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    required
                    value={form.quantite}
                    onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Motif du mouvement</label>
                <select
                  className="input-field"
                  value={form.motif}
                  onChange={(e) => setForm({ ...form, motif: e.target.value })}
                >
                  {form.type === 'SORTIE' ? (
                    <>
                      <option value="VENTE">Vente Client</option>
                      <option value="PERTE">Perte / Vol</option>
                      <option value="CASSE">Casse / Défectueux</option>
                      <option value="AJUSTEMENT">Ajustement d'inventaire</option>
                    </>
                  ) : (
                    <>
                      <option value="ACHAT">Réception Fournisseur</option>
                      <option value="AJUSTEMENT">Ajustement d'inventaire positif</option>
                    </>
                  )}
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
                <button type="submit" className="btn btn-primary">
                  Valider le Mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
