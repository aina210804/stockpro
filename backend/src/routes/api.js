const express = require('express');
const router = express.Router();

const { authenticateJWT, authorizeRoles } = require('../middlewares/auth');
const authCtrl = require('../controllers/authController');
const produitCtrl = require('../controllers/produitController');
const mouvementCtrl = require('../controllers/mouvementController');
const commandeCtrl = require('../controllers/commandeController');
const dashboardCtrl = require('../controllers/dashboardController');
const adminCtrl = require('../controllers/adminController');

// --- AUTHENTIFICATION ---
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', authenticateJWT, authorizeRoles('ADMIN'), authCtrl.register);
router.get('/auth/me', authenticateJWT, authCtrl.me);

// --- PRODUITS ---
router.get('/produits', authenticateJWT, produitCtrl.getAll);
router.get('/produits/:id', authenticateJWT, produitCtrl.getById);
router.post('/produits', authenticateJWT, authorizeRoles('ADMIN', 'GESTIONNAIRE'), produitCtrl.create);
router.put('/produits/:id', authenticateJWT, authorizeRoles('ADMIN', 'GESTIONNAIRE'), produitCtrl.update);
router.delete('/produits/:id', authenticateJWT, authorizeRoles('ADMIN'), produitCtrl.delete);

// --- MOUVEMENTS DE STOCK ---
router.get('/mouvements', authenticateJWT, authorizeRoles('ADMIN', 'GESTIONNAIRE'), mouvementCtrl.getAllMouvements);
router.post('/mouvements', authenticateJWT, mouvementCtrl.createMouvement); // Le contrôleur vérifie si Vendeur fait bien uniquement une VENTE

// --- COMMANDES FOURNISSEURS ---
router.get('/commandes', authenticateJWT, authorizeRoles('ADMIN', 'GESTIONNAIRE'), commandeCtrl.getAllCommandes);
router.post('/commandes', authenticateJWT, authorizeRoles('ADMIN', 'GESTIONNAIRE'), commandeCtrl.createCommande);
router.patch('/commandes/:id/reception', authenticateJWT, authorizeRoles('ADMIN', 'GESTIONNAIRE'), commandeCtrl.recevoirCommande);

// --- DASHBOARD & STATISTIQUES ---
router.get('/dashboard/stats', authenticateJWT, dashboardCtrl.getStats);

// --- CATÉGORIES & FOURNISSEURS ---
router.get('/categories', authenticateJWT, adminCtrl.getCategories);
router.post('/categories', authenticateJWT, authorizeRoles('ADMIN', 'GESTIONNAIRE'), adminCtrl.createCategorie);
router.get('/fournisseurs', authenticateJWT, adminCtrl.getFournisseurs);
router.post('/fournisseurs', authenticateJWT, authorizeRoles('ADMIN', 'GESTIONNAIRE'), adminCtrl.createFournisseur);

// --- UTILISATEURS & ROLES (ADMIN ONLY) ---
router.get('/utilisateurs', authenticateJWT, authorizeRoles('ADMIN'), adminCtrl.getUtilisateurs);
router.get('/roles', authenticateJWT, authorizeRoles('ADMIN'), adminCtrl.getRoles);

module.exports = router;
