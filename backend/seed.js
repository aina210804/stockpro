const bcrypt = require('bcryptjs');
const {
  sequelize,
  Role,
  Utilisateur,
  Categorie,
  Fournisseur,
  Produit,
  MouvementStock,
} = require('./src/models');

async function seedDatabase() {
  try {
    console.log('🔄 Synchronisation de la base de données (force: true)...');
    await sequelize.sync({ force: true });
    console.log('✅ Tables créées avec succès.');

    // 1. Rôles
    console.log('🌱 Insertion des rôles...');
    const roles = await Role.bulkCreate([
      { nom: 'ADMIN', description: 'Accès complet au système et gestion des utilisateurs' },
      { nom: 'GESTIONNAIRE', description: 'Gestion du catalogue, commandes fournisseurs et stocks' },
      { nom: 'VENDEUR', description: 'Consultation du catalogue et enregistrement des ventes' },
    ]);

    const adminRole = roles.find((r) => r.nom === 'ADMIN');
    const gestRole = roles.find((r) => r.nom === 'GESTIONNAIRE');
    const vendRole = roles.find((r) => r.nom === 'VENDEUR');

    // 2. Utilisateurs de test
    console.log('🌱 Insertion des utilisateurs par défaut (mot de passe: password123)...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const adminUser = await Utilisateur.create({
      nom: 'Jean Dupont (Admin)',
      email: 'admin@stockpro.com',
      mot_de_passe: passwordHash,
      role_id: adminRole.id,
      actif: true,
    });

    const gestUser = await Utilisateur.create({
      nom: 'Marie Curie (Gestionnaire)',
      email: 'gestionnaire@stockpro.com',
      mot_de_passe: passwordHash,
      role_id: gestRole.id,
      actif: true,
    });

    const vendUser = await Utilisateur.create({
      nom: 'Paul Vendeur (Vendeur)',
      email: 'vendeur@stockpro.com',
      mot_de_passe: passwordHash,
      role_id: vendRole.id,
      actif: true,
    });

    // 3. Catégories
    console.log('🌱 Insertion des catégories...');
    const categories = await Categorie.bulkCreate([
      { nom: 'Informatique & Périphériques', description: 'Ordinateurs, claviers, souris, écrans' },
      { nom: 'Composants PC', description: 'Processeurs, RAM, disques SSD, cartes graphiques' },
      { nom: 'Réseaux & Câblage', description: 'Routeurs, switchs, câbles RJ45' },
      { nom: 'Consommables & Bureautique', description: 'Cartouches d\'encre, papier, accessoires' },
    ]);

    // 4. Fournisseurs
    console.log('🌱 Insertion des fournisseurs...');
    const fournisseurs = await Fournisseur.bulkCreate([
      {
        nom: 'TechDistri France',
        email: 'contact@techdistri.fr',
        telephone: '+33 1 40 20 30 40',
        adresse: '12 Avenue des Technologies, Paris',
      },
      {
        nom: 'Global Hardware Supply',
        email: 'orders@globalhardware.com',
        telephone: '+33 4 72 00 11 22',
        adresse: '8 Rue des Entrepôts, Lyon',
      },
      {
        nom: 'MicroConnect Solutions',
        email: 'sav@microconnect.fr',
        telephone: '+33 5 56 12 34 56',
        adresse: '45 Boulevard Industriel, Bordeaux',
      },
    ]);

    // 5. Produits
    console.log('🌱 Insertion des produits...');
    const produits = await Produit.bulkCreate([
      {
        reference: 'PRD-SSD-1TB',
        nom: 'Disque SSD NVMe 1To Samsung 980',
        description: 'Vitesse de lecture jusqu\'à 3500 Mo/s, interface PCIe 3.0',
        prix_achat: 65.00,
        prix_vente: 99.90,
        quantite_stock: 24,
        seuil_alerte: 5,
        categorie_id: categories[1].id,
        fournisseur_id: fournisseurs[1].id,
      },
      {
        reference: 'PRD-RAM-16GB',
        nom: 'Kit RAM DDR4 16Go (2x8Go) Corsair Vengeance',
        description: '3200 MHz CL16, dissipateur thermique en aluminium noir',
        prix_achat: 40.00,
        prix_vente: 64.99,
        quantite_stock: 4, // SOUS LE SEUIL D'ALERTE POUR TESTER LE DASHBOARD
        seuil_alerte: 8,
        categorie_id: categories[1].id,
        fournisseur_id: fournisseurs[1].id,
      },
      {
        reference: 'PRD-ECRAN-27',
        nom: 'Écran 27" Full HD 165Hz IPS Dell',
        description: 'Temps de réponse 1ms, DisplayPort et HDMI, compatible G-Sync',
        prix_achat: 140.00,
        prix_vente: 219.00,
        quantite_stock: 12,
        seuil_alerte: 3,
        categorie_id: categories[0].id,
        fournisseur_id: fournisseurs[0].id,
      },
      {
        reference: 'PRD-CLAV-MEC',
        nom: 'Clavier Mécanique RGB Switch Red Logitech',
        description: 'Châssis aluminium, frappe réactive et silencieuse',
        prix_achat: 55.00,
        prix_vente: 89.90,
        quantite_stock: 15,
        seuil_alerte: 5,
        categorie_id: categories[0].id,
        fournisseur_id: fournisseurs[0].id,
      },
      {
        reference: 'PRD-SOURIS-WL',
        nom: 'Souris Sans Fil Ergonomique Rechargeable',
        description: 'Capteur haute précision 4000 DPI, batterie longue durée',
        prix_achat: 18.00,
        prix_vente: 34.90,
        quantite_stock: 2, // SOUS LE SEUIL D'ALERTE
        seuil_alerte: 6,
        categorie_id: categories[0].id,
        fournisseur_id: fournisseurs[2].id,
      },
      {
        reference: 'PRD-ROUTER-WIFI6',
        nom: 'Routeur Wi-Fi 6 AX3000 Gigabit TP-Link',
        description: 'Débit combiné jusqu\'à 3 Gbps, 4 antennes extérieures',
        prix_achat: 50.00,
        prix_vente: 79.99,
        quantite_stock: 8,
        seuil_alerte: 4,
        categorie_id: categories[2].id,
        fournisseur_id: fournisseurs[2].id,
      },
    ]);

    // 6. Mouvements initiaux
    console.log('🌱 Insertion de l\'historique des mouvements...');
    for (const p of produits) {
      await MouvementStock.create({
        produit_id: p.id,
        utilisateur_id: adminUser.id,
        type: 'ENTREE',
        quantite: p.quantite_stock,
        motif: 'ACHAT',
      });
    }

    console.log('🎉 Initialisation et Seeding terminés avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed :', error);
    process.exit(1);
  }
}

seedDatabase();
