import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { DollarSign, Package, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simple requête directe vers /dashboard/stats
  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      alert('Erreur chargement dashboard : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !data) {
    return <div style={{ color: '#94A3B8', padding: '40px' }}>Chargement du tableau de bord...</div>;
  }

  const { kpis, alertes, topVentes, historiqueGraphique } = data || {};

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Tableau de Bord</h1>
          <p className="page-subtitle">Aperçu en temps réel des stocks, KPIs financiers et alertes</p>
        </div>
        <button className="btn btn-secondary" onClick={loadStats}>
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {/* 4 KPIs Principaux */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-title">Valeur Stock (Coût Achat)</div>
            <div className="kpi-val">{kpis?.valeurTotaleStock?.toLocaleString('fr-FR')} €</div>
          </div>
          <div className="kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-title">Valeur Vente Estimée</div>
            <div className="kpi-val" style={{ color: '#34D399' }}>
              {kpis?.valeurVentePotentielle?.toLocaleString('fr-FR')} €
            </div>
          </div>
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-title">Références Produits</div>
            <div className="kpi-val">{kpis?.totalReferences}</div>
          </div>
          <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
            <Package size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-title">Alertes Rupture</div>
            <div className="kpi-val" style={{ color: kpis?.nombreAlertes > 0 ? '#F87171' : '#34D399' }}>
              {kpis?.nombreAlertes}
            </div>
          </div>
          <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Deux colonnes : Alertes de stock & Top Ventes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Module Alertes */}
        <div className="card-table" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#F59E0B" /> Produits sous le seuil d'alerte ({alertes?.length})
            </h3>
          </div>
          {alertes && alertes.length > 0 ? (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Nom Produit</th>
                  <th>Stock Actuel</th>
                  <th>Seuil</th>
                </tr>
              </thead>
              <tbody>
                {alertes.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.reference}</td>
                    <td>{p.nom}</td>
                    <td>
                      <span className="badge-stock stock-danger">{p.quantite_stock}</span>
                    </td>
                    <td style={{ color: '#94A3B8' }}>{p.seuil_alerte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#10B981' }}>
              ✅ Tous les stocks sont au-dessus de leur seuil d'alerte.
            </div>
          )}
        </div>

        {/* Top 5 Ventes */}
        <div className="card-table" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#10B981" /> Top 5 des Ventes
            </h3>
          </div>
          {topVentes && topVentes.length > 0 ? (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Produit</th>
                  <th>Ventes Totales</th>
                </tr>
              </thead>
              <tbody>
                {topVentes.map((t, idx) => (
                  <tr key={t.id}>
                    <td>
                      <span style={{
                        background: idx === 0 ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                        color: idx === 0 ? '#000' : '#fff',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.nom}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{t.reference}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#34D399' }}>{t.quantite_totale} unités</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
              Aucune vente enregistrée pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* Graphique des Mouvements des 30 derniers jours */}
      <div className="card-table">
        <div className="card-header">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Activité des Mouvements (30 derniers jours)</h3>
        </div>
        <div style={{ padding: '24px' }}>
          {historiqueGraphique && historiqueGraphique.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px', paddingTop: '20px' }}>
              {historiqueGraphique.map((m, idx) => {
                const total = m.entrees + m.sorties;
                const heightPercent = Math.min(100, Math.max(15, total * 3));
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{total}</div>
                    <div style={{
                      width: '100%',
                      maxWidth: '32px',
                      height: `${heightPercent}%`,
                      background: 'linear-gradient(180deg, #6366F1, #312E81)',
                      borderRadius: '6px 6px 0 0',
                    }} />
                    <div style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {m.date.split('-').slice(1).join('/')}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#94A3B8', textAlign: 'center' }}>Aucun mouvement récent.</div>
          )}
        </div>
      </div>
    </div>
  );
}
