const { Categorie, Fournisseur, Utilisateur, Role } = require('../models');

// --- CATÉGORIES ---
exports.getCategories = async (req, res) => {
  try {
    const list = await Categorie.findAll({ order: [['nom', 'ASC']] });
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createCategorie = async (req, res) => {
  try {
    const { nom, description } = req.body;
    if (!nom) return res.status(400).json({ success: false, error: 'Le nom de la catégorie est obligatoire.' });
    const cat = await Categorie.create({ nom, description });
    return res.status(201).json({ success: true, data: cat });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// --- FOURNISSEURS ---
exports.getFournisseurs = async (req, res) => {
  try {
    const list = await Fournisseur.findAll({ order: [['nom', 'ASC']] });
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createFournisseur = async (req, res) => {
  try {
    const { nom, email, telephone, adresse } = req.body;
    if (!nom) return res.status(400).json({ success: false, error: 'Le nom du fournisseur est obligatoire.' });
    const f = await Fournisseur.create({ nom, email, telephone, adresse });
    return res.status(201).json({ success: true, data: f });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// --- UTILISATEURS (ADMIN ONLY) ---
exports.getUtilisateurs = async (req, res) => {
  try {
    const users = await Utilisateur.findAll({
      attributes: { exclude: ['mot_de_passe'] },
      include: [{ model: Role, as: 'role' }],
      order: [['id', 'ASC']],
    });
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    return res.json({ success: true, data: roles });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
