const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize } = require('./models');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'StockPro API',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// Branchement des routes API
app.use('/api/v1', apiRoutes);

// Gestion 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint non trouvé' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

// Démarrage du serveur et synchronisation BDD
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('📦 Connexion à la base de données établie avec succès.');

    app.listen(PORT, () => {
      console.log(`🚀 Serveur StockPro démarré sur http://localhost:${PORT}`);
      console.log(`📡 API REST disponible sur http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
  }
}

startServer();
