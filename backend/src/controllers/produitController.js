const { Op } = require('sequelize');
const Joi = require('joi');
const { Produit, Categorie, Fournisseur } = require('../models');

const produitSchema = Joi.object({
  reference: Joi.string().required(),
  nom: Joi.string().required(),
  description: Joi.string().allow('', null),
  prix_achat: Joi.number().min(0).required(),
  prix_vente: Joi.number().min(0).required(),
  quantite_stock: Joi.number().integer().min(0).default(0),
  seuil_alerte: Joi.number().integer().min(0).default(5),
  image_url: Joi.string().allow('', null),
  categorie_id: Joi.number().integer().required(),
  fournisseur_id: Joi.number().integer().allow(null),
});

// Liste des produits avec recherche et filtres
exports.getAll = async (req, res) => {
  try {
    const { search, categorie_id, alerte, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
      where[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { reference: { [Op.like]: `%${search}%` } },
      ];
    }

    if (categorie_id) {
      where.categorie_id = parseInt(categorie_id);
    }

    const { count, rows } = await Produit.findAndCountAll({
      where,
      include: [
        { model: Categorie, as: 'categorie', attributes: ['id', 'nom'] },
        { model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nom'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['id', 'DESC']],
    });

    let filteredRows = rows;
    if (alerte === 'true') {
      filteredRows = rows.filter((p) => p.quantite_stock <= p.seuil_alerte);
    }

    return res.json({
      success: true,
      data: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        produits: filteredRows,
      },
    });
  } catch (err) {
    console.error('Erreur getAll produits:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des produits.' });
  }
};

// Obtenir un produit par son ID
exports.getById = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id, {
      include: [
        { model: Categorie, as: 'categorie' },
        { model: Fournisseur, as: 'fournisseur' },
      ],
    });

    if (!produit) {
      return res.status(404).json({ success: false, error: 'Produit introuvable.' });
    }

    return res.json({ success: true, data: produit });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Création d'un produit
exports.create = async (req, res) => {
  try {
    const { error, value } = produitSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const exist = await Produit.findOne({ where: { reference: value.reference } });
    if (exist) {
      return res.status(400).json({ success: false, error: 'Cette référence produit existe déjà.' });
    }

    const produit = await Produit.create(value);
    const created = await Produit.findByPk(produit.id, {
      include: [
        { model: Categorie, as: 'categorie' },
        { model: Fournisseur, as: 'fournisseur' },
      ],
    });

    return res.status(201).json({ success: true, data: created, message: 'Produit créé avec succès.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Mise à jour d'un produit
exports.update = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id);
    if (!produit) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé.' });
    }

    await produit.update(req.body);
    const updated = await Produit.findByPk(produit.id, {
      include: [
        { model: Categorie, as: 'categorie' },
        { model: Fournisseur, as: 'fournisseur' },
      ],
    });

    return res.json({ success: true, data: updated, message: 'Produit mis à jour avec succès.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Suppression d'un produit
exports.delete = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id);
    if (!produit) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé.' });
    }

    await produit.destroy();
    return res.json({ success: true, message: 'Produit supprimé avec succès.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
