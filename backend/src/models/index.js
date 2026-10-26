const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 1. Modèle Role
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true, // ADMIN, GESTIONNAIRE, VENDEUR
  },
  description: {
    type: DataTypes.STRING(255),
  },
}, {
  tableName: 'roles',
  timestamps: false,
});

// 2. Modèle Utilisateur
const Utilisateur = sequelize.define('Utilisateur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  mot_de_passe: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'utilisateurs',
  timestamps: true,
});

// 3. Modèle Categorie
const Categorie = sequelize.define('Categorie', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'categories',
  timestamps: true,
});

// 4. Modèle Fournisseur
const Fournisseur = sequelize.define('Fournisseur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
  },
  telephone: {
    type: DataTypes.STRING(30),
  },
  adresse: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'fournisseurs',
  timestamps: true,
});

// 5. Modèle Produit
const Produit = sequelize.define('Produit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reference: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  nom: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  prix_achat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  prix_vente: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  quantite_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0, // Interdiction absolue de stock négatif
    },
  },
  seuil_alerte: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  image_url: {
    type: DataTypes.STRING(255),
  },
}, {
  tableName: 'produits',
  timestamps: true,
});

// 6. Modèle MouvementStock
const MouvementStock = sequelize.define('MouvementStock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('ENTREE', 'SORTIE'),
    allowNull: false,
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  motif: {
    type: DataTypes.STRING(50), // ACHAT, VENTE, PERTE, CASSE, AJUSTEMENT
    allowNull: false,
  },
  date_mouvement: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'mouvements_stock',
  timestamps: false,
});

// 7. Modèle CommandeFournisseur
const CommandeFournisseur = sequelize.define('CommandeFournisseur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  statut: {
    type: DataTypes.ENUM('EN_ATTENTE', 'PARTIELLEMENT_RECUE', 'RECUE', 'ANNULEE'),
    defaultValue: 'EN_ATTENTE',
  },
  total_estime: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  date_commande: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'commandes_fournisseurs',
  timestamps: true,
});

// 8. Modèle LigneCommande
const LigneCommande = sequelize.define('LigneCommande', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quantite_commandee: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  quantite_recue: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'lignes_commandes',
  timestamps: false,
});

// Relations / Associations (Conformes au MCD Merise)
// Role 1 - N Utilisateur
Role.hasMany(Utilisateur, { foreignKey: 'role_id', as: 'utilisateurs' });
Utilisateur.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Categorie 1 - N Produit
Categorie.hasMany(Produit, { foreignKey: 'categorie_id', as: 'produits' });
Produit.belongsTo(Categorie, { foreignKey: 'categorie_id', as: 'categorie' });

// Fournisseur 1 - N Produit (optionnel)
Fournisseur.hasMany(Produit, { foreignKey: 'fournisseur_id', as: 'produits' });
Produit.belongsTo(Fournisseur, { foreignKey: 'fournisseur_id', as: 'fournisseur' });

// Produit 1 - N MouvementStock
Produit.hasMany(MouvementStock, { foreignKey: 'produit_id', as: 'mouvements' });
MouvementStock.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });

// Utilisateur 1 - N MouvementStock
Utilisateur.hasMany(MouvementStock, { foreignKey: 'utilisateur_id', as: 'mouvements' });
MouvementStock.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

// Fournisseur 1 - N CommandeFournisseur
Fournisseur.hasMany(CommandeFournisseur, { foreignKey: 'fournisseur_id', as: 'commandes' });
CommandeFournisseur.belongsTo(Fournisseur, { foreignKey: 'fournisseur_id', as: 'fournisseur' });

// Utilisateur 1 - N CommandeFournisseur
Utilisateur.hasMany(CommandeFournisseur, { foreignKey: 'utilisateur_id', as: 'commandes' });
CommandeFournisseur.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

// CommandeFournisseur 1 - N LigneCommande
CommandeFournisseur.hasMany(LigneCommande, { foreignKey: 'commande_id', as: 'lignes', onDelete: 'CASCADE' });
LigneCommande.belongsTo(CommandeFournisseur, { foreignKey: 'commande_id', as: 'commande' });

// Produit 1 - N LigneCommande
Produit.hasMany(LigneCommande, { foreignKey: 'produit_id', as: 'lignes_commandes' });
LigneCommande.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });

module.exports = {
  sequelize,
  Role,
  Utilisateur,
  Categorie,
  Fournisseur,
  Produit,
  MouvementStock,
  CommandeFournisseur,
  LigneCommande,
};
