import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, Filter, Trash2, Edit, ShoppingCart } from 'lucide-react';

export default function Produits({ currentUser, onOpenVenteModal }) {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formulaire nouveau produit
  const [formData, setFormData] = useState({
    reference: '',
    nom: '',
    description: '',
    prix_achat: '',
    prix_vente: '',
    quantite_stock: 0,
    seuil_alerte: 5,
    categorie_id: '',
  });

  // 1. Simple requête GET pour charger produits et catégories
  const loadProduits = async () => {
    try {
      setLoading(true);
      let query = `?search=${encodeURIComponent(search)}`;
      if (selectedCat) query += `&categorie_id=${selectedCat}`;

      const res = await api.get(`/produits${query}`);
      setProduits(res.data.produits || []);
    } catch (err) {
      alert('Erreur chargement produits : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
      if (res.data?.length > 0) {
        setFormData((prev) => ({ ...prev, categorie_id: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProduits();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCat]);

  // 2. Simple requête POST pour ajouter un produit
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/produits', {
        ...formData,
        prix_achat: parseFloat(formData.prix_achat),
        prix_vente: parseFloat(formData.prix_vente),
        quantite_stock: parseInt(formData.quantite_stock) || 0,
        seuil_alerte: parseInt(formData.seuil_alerte) || 5,
        categorie_id: parseInt(formData.categorie_id),
      });

      setShowAddModal(false);
      setFormData({
        reference: '',
        nom: '',
        description: '',
        prix_achat: '',
        prix_vente: '',
        quantite_stock: 0,
        seuil_alerte: 5,
        categorie_id: categories[0]?.id || '',
      });
      loadProduits();
    } catch (err) {
      alert('Erreur création produit : ' + err.message);
    }
  };

  // 3. Simple requête DELETE pour supprimer (Admin)
  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    try {
      await api.delete(`/produits/${id}`);
      loadProduits();
    } catch (err) {
      alert('Erreur suppression : ' + err.message);
    }
  };

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'GESTIONNAIRE';
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Catalogue des Produits</h1>
          <p className="page-subtitle">Gestion des stocks, seuils d'alerte et prix</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Nouveau Produit
          </button>
        )}
      </div>

      {/* Barre de Recherche et Filtres */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748B' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Rechercher par référence, nom..."
            style={{ width: '100%', paddingLeft: '40px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input-field"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          style={{ minWidth: '200px' }}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Table des Produits */}
      <div className="card-table">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Désignation</th>
              <th>Catégorie</th>
              <th>Prix Achat</th>
              <th>Prix Vente</th>
              <th>Stock</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p) => {
              const isAlert = p.quantite_stock <= p.seuil_alerte;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, color: '#A5B4FC' }}>{p.reference}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.nom}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{p.description || '-'}</div>
                  </td>
                  <td>{p.categorie?.nom || '-'}</td>
                  <td>{parseFloat(p.prix_achat).toFixed(2)} €</td>
                  <td style={{ fontWeight: 600 }}>{parseFloat(p.prix_vente).toFixed(2)} €</td>
                  <td>
                    <span className={`badge-stock ${isAlert ? 'stock-danger' : 'stock-normal'}`}>
                      {p.quantite_stock} unités
                    </span>
                  </td>
                  <td>
                    {isAlert ? (
                      <span style={{ color: '#F87171', fontSize: '0.82rem', fontWeight: 600 }}>⚠️ Seuil ({p.seuil_alerte})</span>
                    ) : (
                      <span style={{ color: '#34D399', fontSize: '0.82rem' }}>Normal</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Vendre / Sortie directe"
                        onClick={() => onOpenVenteModal(p)}
                      >
                        <ShoppingCart size={15} /> Vente
                      </button>
                      {isAdmin && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px' }}
                          title="Supprimer le produit"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {produits.length === 0 && !loading && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
            Aucun produit trouvé.
          </div>
        )}
      </div>

      {/* Modal Ajout Produit */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Nouveau Produit</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Référence (Code Unique)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ex: PRD-CLAV-01"
                  required
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Désignation du produit</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ex: Clavier Sans Fil Bluetooth"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Prix d'Achat (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    required
                    value={formData.prix_achat}
                    onChange={(e) => setFormData({ ...formData, prix_achat: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix de Vente (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    required
                    value={formData.prix_vente}
                    onChange={(e) => setFormData({ ...formData, prix_vente: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Stock Initial</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.quantite_stock}
                    onChange={(e) => setFormData({ ...formData, quantite_stock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Seuil d'Alerte</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.seuil_alerte}
                    onChange={(e) => setFormData({ ...formData, seuil_alerte: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <select
                  className="input-field"
                  value={formData.categorie_id}
                  onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer le Produit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
