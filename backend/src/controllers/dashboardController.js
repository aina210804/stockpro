const { Op } = require('sequelize');
const { Produit, MouvementStock, Categorie, Fournisseur } = require('../models');

// Tableau de bord : KPIs, alertes, top ventes, graphique sur 30 jours
exports.getStats = async (req, res) => {
  try {
    // 1. Valeur totale du stock & Nombre total de références
    const produits = await Produit.findAll({
      include: [{ model: Categorie, as: 'categorie' }],
    });

    let valeurTotaleStock = 0;
    let valeurVentePotentielle = 0;
    const produitsEnAlerte = [];

    produits.forEach((p) => {
      const qte = p.quantite_stock || 0;
      valeurTotaleStock += qte * parseFloat(p.prix_achat);
      valeurVentePotentielle += qte * parseFloat(p.prix_vente);

      if (qte <= p.seuil_alerte) {
        produitsEnAlerte.push(p);
      }
    });

    // 2. Top 5 des produits les plus vendus
    const mouvementsSortie = await MouvementStock.findAll({
      where: {
        type: 'SORTIE',
        motif: 'VENTE',
      },
      include: [{ model: Produit, as: 'produit' }],
    });

    const ventesParProduit = {};
    mouvementsSortie.forEach((m) => {
      if (m.produit) {
        if (!ventesParProduit[m.produit.id]) {
          ventesParProduit[m.produit.id] = {
            id: m.produit.id,
            nom: m.produit.nom,
            reference: m.produit.reference,
            quantite_totale: 0,
          };
        }
        ventesParProduit[m.produit.id].quantite_totale += m.quantite;
      }
    });

    const topVentes = Object.values(ventesParProduit)
      .sort((a, b) => b.quantite_totale - a.quantite_totale)
      .slice(0, 5);

    // 3. Mouvements sur les 30 derniers jours
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - 30);

    const mouvements30Jours = await MouvementStock.findAll({
      where: {
        date_mouvement: {
          [Op.gte]: dateLimite,
        },
      },
      order: [['date_mouvement', 'ASC']],
    });

    // Regrouper par date
    const mouvementsParDate = {};
    mouvements30Jours.forEach((m) => {
      const d = new Date(m.date_mouvement).toISOString().split('T')[0];
      if (!mouvementsParDate[d]) {
        mouvementsParDate[d] = { date: d, entrees: 0, sorties: 0 };
      }
      if (m.type === 'ENTREE') {
        mouvementsParDate[d].entrees += m.quantite;
      } else {
        mouvementsParDate[d].sorties += m.quantite;
      }
    });

    return res.json({
      success: true,
      data: {
        kpis: {
          valeurTotaleStock: parseFloat(valeurTotaleStock.toFixed(2)),
          valeurVentePotentielle: parseFloat(valeurVentePotentielle.toFixed(2)),
          totalReferences: produits.length,
          nombreAlertes: produitsEnAlerte.length,
        },
        alertes: produitsEnAlerte,
        topVentes,
        historiqueGraphique: Object.values(mouvementsParDate),
      },
    });
  } catch (err) {
    console.error('Erreur getStats dashboard:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors du calcul des statistiques.' });
  }
};
