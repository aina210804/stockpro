import React, { useState } from 'react';
import { api } from '../api';
import { LogIn, PackageCheck } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@stockpro.com');
  const [motDePasse, setMotDePasse] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Requête directe de connexion
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email,
        mot_de_passe: motDePasse,
      });

      api.setToken(res.data.token);
      api.setUser(res.data.utilisateur);
      onLoginSuccess(res.data.utilisateur);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = async (em) => {
    setEmail(em);
    setMotDePasse('password123');
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: em,
        mot_de_passe: 'password123',
      });
      api.setToken(res.data.token);
      api.setUser(res.data.utilisateur);
      onLoginSuccess(res.data.utilisateur);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1E1B4B 0%, #0B0F19 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(17, 24, 39, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
            marginBottom: '16px'
          }}>
            <PackageCheck size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>StockPro</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '6px' }}>
            Application Web de Gestion de Stock
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Email Professionnel</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Mot de Passe</label>
            <input
              type="password"
              className="input-field"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }}
          >
            <LogIn size={18} />
            {loading ? 'Connexion en cours...' : 'Se Connecter'}
          </button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.78rem', color: '#64748B', textAlign: 'center', marginBottom: '10px' }}>
            Accès rapide de démonstration (cliquez pour tester) :
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
              onClick={() => handleQuickSelect('admin@stockpro.com')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
              onClick={() => handleQuickSelect('gestionnaire@stockpro.com')}
            >
              Gestionnaire
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
              onClick={() => handleQuickSelect('vendeur@stockpro.com')}
            >
              Vendeur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
