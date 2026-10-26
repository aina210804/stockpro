import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, CheckCircle, Clock } from 'lucide-react';

export default function Commandes({ currentUser }) {
  const [commandes, setCommandes] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Formulaire nouvelle commande
  const [fournisseurId, setFournisseurId] = useState('');
  const [lignes, setLignes] = useState([
    { produit_id: '', quantite_commandee: 5, prix_unitaire: 50 },
  ]);

  // 1. Simple requête GET pour lister les commandes
  const loadCommandes = async () => {
    try {
      const res = await api.get('/commandes');
      setCommandes(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    try {
      const [fRes, pRes] = await Promise.all([
        api.get('/fournisseurs'),
        api.get('/produits?limit=100'),
      ]);
      setFournisseurs(fRes.data || []);
      const pList = pRes.data.produits || [];
      setProduits(pList);
      if (fRes.data?.length > 0) setFournisseurId(fRes.data[0].id);
      if (pList.length > 0) {
        setLignes([{ produit_id: pList[0].id, quantite_commandee: 5, prix_unitaire: parseFloat(pList[0].prix_achat) }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCommandes();
    loadData();
  }, []);

  // 2. Simple requête POST pour créer la commande
  const handleCreateCommande = async (e) => {
    e.preventDefault();
    try {
      await api.post('/commandes', {
        fournisseur_id: parseInt(fournisseurId),
        lignes: lignes.map((l) => ({
          produit_id: parseInt(l.produit_id),
          quantite_commandee: parseInt(l.quantite_commandee),
          prix_unitaire: parseFloat(l.prix_unitaire),
        })),
      });

      setShowModal(false);
      loadCommandes();
    } catch (err) {
      alert('Erreur création commande : ' + err.message);
    }
  };

  // 3. Simple requête PATCH pour réceptionner la commande (génère entrées de stock)
  const handleRecevoir = async (cmd) => {
    if (!window.confirm(`Réceptionner la commande ${cmd.numero} et mettre à jour les stocks ?`)) return;

    try {
      const receptions = cmd.lignes.map((l) => ({
        ligne_id: l.id,
        quantite_recue: l.quantite_commandee - l.quantite_recue,
      }));

      await api.patch(`/commandes/${cmd.id}/reception`, { receptions });
      alert('Commande réceptionnée ! Le stock physique a été incrémenté.');
      loadCommandes();
    } catch (err) {
      alert('Erreur réception : ' + err.message);
    }
  };

  const addLigne = () => {
    setLignes([...lignes, { produit_id: produits[0]?.id || '', quantite_commandee: 1, prix_unitaire: 10 }]);
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Commandes Fournisseurs</h1>
          <p className="page-subtitle">Gestion des bons de commande et réceptions avec injection automatique en stock</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Passer une Commande
        </button>
      </div>

      <div className="card-table">
        <table className="table-custom">
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Fournisseur</th>
              <th>Statut</th>
              <th>Articles & Quantités</th>
              <th>Total Estimé</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((c) => {
              const isRecue = c.statut === 'RECUE';
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: '#A5B4FC' }}>{c.numero}</td>
                  <td style={{ fontWeight: 600 }}>{c.fournisseur?.nom}</td>
                  <td>
                    <span className={`badge-stock ${isRecue ? 'stock-normal' : 'stock-warning'}`}>
                      {c.statut}
                    </span>
                  </td>
                  <td>
                    {c.lignes?.map((l) => (
                      <div key={l.id} style={{ fontSize: '0.85rem' }}>
                        • {l.produit?.nom} : <b>{l.quantite_recue} / {l.quantite_commandee}</b> reçus
                      </div>
                    ))}
                  </td>
                  <td style={{ fontWeight: 700 }}>{parseFloat(c.total_estime).toFixed(2)} €</td>
                  <td style={{ textAlign: 'right' }}>
                    {!isRecue ? (
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                        onClick={() => handleRecevoir(c)}
                      >
                        <CheckCircle size={15} /> Réceptionner
                      </button>
                    ) : (
                      <span style={{ color: '#34D399', fontSize: '0.85rem' }}>✓ Intégrée au stock</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {commandes.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
            Aucune commande fournisseur pour le moment.
          </div>
        )}
      </div>

      {/* Modal Création Commande */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Créer une Commande Fournisseur</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCommande}>
              <div className="form-group">
                <label className="form-label">Fournisseur</label>
                <select
                  className="input-field"
                  value={fournisseurId}
                  onChange={(e) => setFournisseurId(e.target.value)}
                  required
                  style={{ width: '100%' }}
                >
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '20px', marginBottom: '10px', fontWeight: 600, fontSize: '0.9rem' }}>
                Articles de la commande :
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lignes.map((ligne, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <select
                      className="input-field"
                      style={{ flex: 3, minWidth: 0 }}
                      value={ligne.produit_id}
                      onChange={(e) => {
                        const newL = [...lignes];
                        newL[idx].produit_id = e.target.value;
                        const prod = produits.find((p) => p.id === parseInt(e.target.value));
                        if (prod) newL[idx].prix_unitaire = parseFloat(prod.prix_achat);
                        setLignes(newL);
                      }}
                    >
                      {produits.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom}
                        </option>
                      ))}
                    </select>

                    <div style={{ flex: 1, minWidth: '70px' }}>
                      <input
                        type="number"
                        min="1"
                        className="input-field"
                        style={{ width: '100%' }}
                        placeholder="Qté"
                        value={ligne.quantite_commandee}
                        onChange={(e) => {
                          const newL = [...lignes];
                          newL[idx].quantite_commandee = e.target.value;
                          setLignes(newL);
                        }}
                      />
                    </div>

                    <div style={{ flex: 1.2, minWidth: '90px' }}>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        style={{ width: '100%' }}
                        placeholder="Prix (€)"
                        value={ligne.prix_unitaire}
                        onChange={(e) => {
                          const newL = [...lignes];
                          newL[idx].prix_unitaire = e.target.value;
                          setLignes(newL);
                        }}
                      />
                    </div>

                    {lignes.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '8px 10px' }}
                        title="Supprimer la ligne"
                        onClick={() => {
                          setLignes(lignes.filter((_, i) => i !== idx));
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '12px' }}
                onClick={addLigne}
              >
                + Ajouter une ligne
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Émettre le bon de commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
