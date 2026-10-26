import React, { useState, useEffect } from 'react';
import { api } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produits from './pages/Produits';
import Mouvements from './pages/Mouvements';
import Commandes from './pages/Commandes';
import Utilisateurs from './pages/Utilisateurs';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  Truck,
  Users,
  LogOut,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(api.getUser());
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal Vente directe (accessible depuis le catalogue)
  const [venteProduit, setVenteProduit] = useState(null);
  const [venteQuantite, setVenteQuantite] = useState(1);
  const [venteError, setVenteError] = useState('');

  // Vérifier la validité de la session au démarrage
  useEffect(() => {
    if (api.getToken()) {
      api.get('/auth/me')
        .then((res) => {
          setCurrentUser(res.data);
          api.setUser(res.data);
        })
        .catch(() => {
          api.clearToken();
          setCurrentUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    api.clearToken();
    setCurrentUser(null);
  };

  // Traitement direct de la vente avec requête POST /mouvements
  const handleExecVente = async (e) => {
    e.preventDefault();
    setVenteError('');
    try {
      await api.post('/mouvements', {
        produit_id: venteProduit.id,
        type: 'SORTIE',
        quantite: parseInt(venteQuantite),
        motif: 'VENTE',
      });

      alert(`✅ Vente validée : ${venteQuantite} x ${venteProduit.nom} décompté(s) du stock.`);
      setVenteProduit(null);
      setVenteQuantite(1);
    } catch (err) {
      setVenteError(err.message);
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const role = currentUser.role;

  return (
    <div className="app-container">
      {/* Sidebar de Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <PackageCheck size={24} color="#fff" />
          </div>
          <div>
            <div className="brand-name">StockPro</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Gestion Commerciale</div>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Tableau de Bord
          </button>

          <button
            className={`nav-item ${activeTab === 'produits' ? 'active' : ''}`}
            onClick={() => setActiveTab('produits')}
          >
            <Boxes size={18} />
            Catalogue & Stocks
          </button>

          {/* Vendeur n'accède pas à la gestion complète des commandes ni à l'historique global des mouvements s'il est restreint */}
          {(role === 'ADMIN' || role === 'GESTIONNAIRE') && (
            <>
              <button
                className={`nav-item ${activeTab === 'mouvements' ? 'active' : ''}`}
                onClick={() => setActiveTab('mouvements')}
              >
                <ArrowLeftRight size={18} />
                Mouvements de Stock
              </button>

              <button
                className={`nav-item ${activeTab === 'commandes' ? 'active' : ''}`}
                onClick={() => setActiveTab('commandes')}
              >
                <Truck size={18} />
                Commandes Fournisseurs
              </button>
            </>
          )}

          {/* Administrateur seul gère les comptes */}
          {role === 'ADMIN' && (
            <button
              className={`nav-item ${activeTab === 'utilisateurs' ? 'active' : ''}`}
              onClick={() => setActiveTab('utilisateurs')}
            >
              <Users size={18} />
              Utilisateurs & Rôles
            </button>
          )}
        </nav>

        {/* Profil de l'utilisateur connecté */}
        <div className="user-profile">
          <div className="user-info">
            <div className="user-name">{currentUser.nom}</div>
            <span className={`user-role-badge role-${role}`}>{role}</span>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px', color: '#F87171' }}
            title="Déconnexion"
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Zone Centrale d'Affichage */}
      <main className="main-wrapper">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'produits' && (
          <Produits
            currentUser={currentUser}
            onOpenVenteModal={(p) => {
              setVenteProduit(p);
              setVenteQuantite(1);
              setVenteError('');
            }}
          />
        )}
        {activeTab === 'mouvements' && <Mouvements currentUser={currentUser} />}
        {activeTab === 'commandes' && <Commandes currentUser={currentUser} />}
        {activeTab === 'utilisateurs' && <Utilisateurs currentUser={currentUser} />}
      </main>

      {/* Modal Universel de Vente Rapide */}
      {venteProduit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Enregistrer une Vente</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => setVenteProduit(null)}
              >
                ✕
              </button>
            </div>

            {venteError && (
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
                <AlertCircle size={18} /> {venteError}
              </div>
            )}

            <form onSubmit={handleExecVente}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Produit sélectionné :</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {venteProduit.nom}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6366F1' }}>
                  Stock disponible en rayon : <b>{venteProduit.quantite_stock}</b> unités
                </div>
                <div style={{ fontSize: '0.85rem', color: '#10B981', marginTop: '4px' }}>
                  Prix unitaire TTC : {parseFloat(venteProduit.prix_vente).toFixed(2)} €
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantité vendue</label>
                <input
                  type="number"
                  min="1"
                  max={venteProduit.quantite_stock}
                  className="input-field"
                  required
                  value={venteQuantite}
                  onChange={(e) => setVenteQuantite(e.target.value)}
                />
              </div>

              <div style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Montant Total Vente :</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399' }}>
                  {(venteQuantite * parseFloat(venteProduit.prix_vente || 0)).toFixed(2)} €
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setVenteProduit(null)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmer la Vente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
