const Joi = require('joi');
const { sequelize, MouvementStock, Produit, Utilisateur } = require('../models');

const mouvementSchema = Joi.object({
  produit_id: Joi.number().integer().required(),
  type: Joi.string().valid('ENTREE', 'SORTIE').required(),
  quantite: Joi.number().integer().min(1).required(),
  motif: Joi.string().valid('ACHAT', 'VENTE', 'PERTE', 'CASSE', 'AJUSTEMENT').required(),
});

// Enregistrer un mouvement de stock avec Transaction Atomique
exports.createMouvement = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { error, value } = mouvementSchema.validate(req.body);
    if (error) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { produit_id, type, quantite, motif } = value;

    // Règle de sécurité pour les vendeurs : ils ne peuvent effectuer QUE des sorties de vente
    if (req.user.role.nom === 'VENDEUR') {
      if (type !== 'SORTIE' || motif !== 'VENTE') {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Le rôle Vendeur est uniquement autorisé à enregistrer des sorties pour Vente.',
        });
      }
    }

    // Récupération verrouillée du produit
    const produit = await Produit.findByPk(produit_id, { transaction });
    if (!produit) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Produit introuvable.' });
    }

    let nouveauStock = produit.quantite_stock;

    if (type === 'SORTIE') {
      // RÈGLE CRITIQUE : INTERDICTION ABSOLUE DE RENDRE LE STOCK NÉGATIF
      if (produit.quantite_stock < quantite) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Stock insuffisant : disponible (${produit.quantite_stock}), quantité demandée (${quantite}).`,
        });
      }
      nouveauStock = produit.quantite_stock - quantite;
    } else if (type === 'ENTREE') {
      nouveauStock = produit.quantite_stock + quantite;
    }

    // Mise à jour du produit
    await produit.update({ quantite_stock: nouveauStock }, { transaction });

    // Création de l'historique du mouvement
    const mouvement = await MouvementStock.create(
      {
        produit_id,
        utilisateur_id: req.user.id,
        type,
        quantite,
        motif,
      },
      { transaction }
    );

    // Validation de la transaction
    await transaction.commit();

    // Renvoyer les informations complètes
    const resultat = await MouvementStock.findByPk(mouvement.id, {
      include: [
        { model: Produit, as: 'produit', attributes: ['id', 'reference', 'nom', 'quantite_stock'] },
        { model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'email'] },
      ],
    });

    return res.status(201).json({
      success: true,
      data: resultat,
      message: 'Mouvement de stock enregistré avec succès.',
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Erreur createMouvement:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement du mouvement.' });
  }
};

// Historique complet des mouvements avec filtres et pagination
exports.getAllMouvements = async (req, res) => {
  try {
    const { type, motif, produit_id, page = 1, limit = 15 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (motif) where.motif = motif;
    if (produit_id) where.produit_id = parseInt(produit_id);

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await MouvementStock.findAndCountAll({
      where,
      include: [
        { model: Produit, as: 'produit', attributes: ['id', 'reference', 'nom', 'quantite_stock'] },
        { model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['date_mouvement', 'DESC']],
    });

    return res.json({
      success: true,
      data: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        mouvements: rows,
      },
    });
  } catch (err) {
    console.error('Erreur getAllMouvements:', err);
    return res.status(500).json({ success: false, error: 'Erreur récupération mouvements.' });
  }
};
