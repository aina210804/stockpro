# Application Web « StockPro » – Gestion de Stock Full Stack

> Projet de Licence 3 Informatique – Développement Web Full Stack  
> Application centralisée de gestion de stock, achats, ventes, alertes et valorisation financière.

---

## 🌟 Points Forts & Respect du Cahier des Charges

- **Architecture découplée :** Back-end Node.js / Express REST API distinct du Front-end React.
- **Simplicité & Efficacité (Règle des 80% requêtes directes) :** Client API natif `src/api.js` utilisant des requêtes claires (`api.get()`, `api.post()`, `api.delete()`).
- **Base de données relationnelle :** Modèle complet (MCD/MLD) avec 8 entités (`roles`, `utilisateurs`, `categories`, `fournisseurs`, `produits`, `mouvements_stock`, `commandes_fournisseurs`, `lignes_commandes`).
- **Sécurité & Contrôle des accès (RBAC) :**
  - Mots de passe chiffrés avec **bcrypt**.
  - Jetons d'authentification **JWT**.
  - Rôles stricts : **Administrateur**, **Gestionnaire de Stock**, **Vendeur**.
- **Contrôle strict des stocks :** Transactions atomiques garantissant l'interdiction absolue de stock négatif.
- **Tableau de Bord interactif :**
  - KPIs financiers (Valeur totale stock au coût d'achat, Valeur de vente estimée).
  - Détection automatique et temps réel des produits sous le seuil d'alerte.
  - Top 5 des produits les plus vendus.
  - Histogramme des mouvements sur 30 jours.

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- Node.js (version 18 ou supérieure)
- npm

### 2. Démarrer le Back-end (API REST)
```bash
cd backend
npm install
npm run seed     # Réinitialise et remplit la base avec des données complètes
npm start        # Lance l'API sur http://localhost:5000
```

### 3. Démarrer le Front-end (React + Vite)
Dans un nouveau terminal :
```bash
cd frontend
npm install
npm run dev      # Lance l'application sur http://localhost:5173
```

---

## 👤 Comptes de Démonstration (Accès Rapide)

| Profil | Email | Mot de Passe | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin@stockpro.com` | `password123` | Accès total, gestion des utilisateurs, suppression produits |
| **Gestionnaire** | `gestionnaire@stockpro.com` | `password123` | Catalogue complet, bons de commandes, réceptions de stock, alertes |
| **Vendeur** | `vendeur@stockpro.com` | `password123` | Consultation catalogue, enregistrement direct des ventes |

---

## 📚 Documentation & Conception

Les documents de cadrage académique sont disponibles dans le dossier `docs/` :
- [CONCEPTION.md](file:///d:/Aina's%20folder/fenarana/gestiondestock/docs/CONCEPTION.md) : Dictionnaire de données, MCD Merise, MLD relationnel normalisé, justifications de cardinalités et diagramme des cas d'utilisation UML.
- [API_SPEC.md](file:///d:/Aina's%20folder/fenarana/gestiondestock/docs/API_SPEC.md) : Spécification des endpoints REST v1.
