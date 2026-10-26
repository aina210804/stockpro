const Joi = require('joi');
const { sequelize, CommandeFournisseur, LigneCommande, Produit, Fournisseur, Utilisateur, MouvementStock } = require('../models');

// Créer une commande fournisseur
exports.createCommande = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { fournisseur_id, lignes } = req.body;

    if (!fournisseur_id || !lignes || !Array.isArray(lignes) || lignes.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Fournisseur et au moins un article requis.' });
    }

    const numero = `CMD-${Date.now()}`;
    let totalEstime = 0;

    for (const ligne of lignes) {
      totalEstime += (ligne.quantite_commandee || 0) * (ligne.prix_unitaire || 0);
    }

    const commande = await CommandeFournisseur.create(
      {
        numero,
        fournisseur_id,
        utilisateur_id: req.user.id,
        total_estime: totalEstime,
        statut: 'EN_ATTENTE',
      },
      { transaction }
    );

    for (const ligne of lignes) {
      await LigneCommande.create(
        {
          commande_id: commande.id,
          produit_id: ligne.produit_id,
          quantite_commandee: ligne.quantite_commandee,
          quantite_recue: 0,
          prix_unitaire: ligne.prix_unitaire,
        },
        { transaction }
      );
    }

    await transaction.commit();

    const created = await CommandeFournisseur.findByPk(commande.id, {
      include: [
        { model: Fournisseur, as: 'fournisseur' },
        { model: LigneCommande, as: 'lignes', include: [{ model: Produit, as: 'produit' }] },
      ],
    });

    return res.status(201).json({ success: true, data: created, message: 'Commande fournisseur créée.' });
  } catch (err) {
    await transaction.rollback();
    console.error('Erreur createCommande:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Liste des commandes fournisseurs
exports.getAllCommandes = async (req, res) => {
  try {
    const commandes = await CommandeFournisseur.findAll({
      include: [
        { model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nom'] },
        { model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom'] },
        {
          model: LigneCommande,
          as: 'lignes',
          include: [{ model: Produit, as: 'produit', attributes: ['id', 'reference', 'nom'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ success: true, data: commandes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Réceptionner une commande (génère automatiquement les entrées de stock)
exports.recevoirCommande = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { receptions } = req.body; // Tableau [{ ligne_id, quantite_recue }]

    const commande = await CommandeFournisseur.findByPk(id, {
      include: [{ model: LigneCommande, as: 'lignes' }],
      transaction,
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }

    if (commande.statut === 'RECUE' || commande.statut === 'ANNULEE') {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Cette commande ne peut plus être réceptionnée.' });
    }

    let toutEstRecu = true;

    for (const rec of receptions) {
      const ligne = commande.lignes.find((l) => l.id === rec.ligne_id);
      if (ligne) {
        const qteAjout = parseInt(rec.quantite_recue) || 0;
        const nouvelleQteRecue = ligne.quantite_recue + qteAjout;

        await ligne.update({ quantite_recue: nouvelleQteRecue }, { transaction });

        if (qteAjout > 0) {
          // 1. Incrémenter le stock du produit
          const produit = await Produit.findByPk(ligne.produit_id, { transaction });
          if (produit) {
            await produit.update(
              { quantite_stock: produit.quantite_stock + qteAjout },
              { transaction }
            );

            // 2. Générer le mouvement d'entrée de stock automatique
            await MouvementStock.create(
              {
                produit_id: produit.id,
                utilisateur_id: req.user.id,
                type: 'ENTREE',
                quantite: qteAjout,
                motif: 'ACHAT',
              },
              { transaction }
            );
          }
        }

        if (nouvelleQteRecue < ligne.quantite_commandee) {
          toutEstRecu = false;
        }
      }
    }

    const nouveauStatut = toutEstRecu ? 'RECUE' : 'PARTIELLEMENT_RECUE';
    await commande.update({ statut: nouveauStatut }, { transaction });

    await transaction.commit();

    const result = await CommandeFournisseur.findByPk(id, {
      include: [
        { model: Fournisseur, as: 'fournisseur' },
        { model: LigneCommande, as: 'lignes', include: [{ model: Produit, as: 'produit' }] },
      ],
    });

    return res.json({
      success: true,
      data: result,
      message: `Commande mise à jour avec succès : statut ${nouveauStatut}`,
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Erreur recevoirCommande:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
