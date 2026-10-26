# Spécification de l'API REST – StockPro (v1)

Base URL : `http://localhost:5000/api/v1`

Format des réponses standard :
```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}
```
En cas d'erreur :
```json
{
  "success": false,
  "error": "Message d'erreur explicite"
}
```

---

## 1. Module Authentification (`/auth`)

| Méthode | Route | Rôles Autorisés | Description | Corps de la requête |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Connexion de l'utilisateur | `{ "email": "...", "mot_de_passe": "..." }` |
| `POST` | `/auth/register` | Admin | Création d'un compte utilisateur | `{ "nom": "...", "email": "...", "mot_de_passe": "...", "role_id": 1 }` |
| `GET` | `/auth/me` | Authentifié | Profil de l'utilisateur connecté | *Header Authorization: Bearer <token>* |
| `POST` | `/auth/logout` | Authentifié | Déconnexion | - |

---

## 2. Module Utilisateurs (`/utilisateurs`)

| Méthode | Route | Rôles Autorisés | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/utilisateurs` | Admin | Liste de tous les utilisateurs |
| `PUT` | `/utilisateurs/:id` | Admin | Modifier informations ou rôle |
| `PATCH` | `/utilisateurs/:id/status`| Admin | Activer / Désactiver un compte |
| `DELETE` | `/utilisateurs/:id` | Admin | Suppression d'un compte |

---

## 3. Module Catalogue (`/produits`, `/categories`, `/fournisseurs`)

### Produits
| Méthode | Route | Rôles Autorisés | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/produits` | Tous | Liste avec recherche, pagination (`?page=1&limit=10&search=...&categorie_id=...`) |
| `GET` | `/produits/:id` | Tous | Détail d'un produit |
| `POST` | `/produits` | Admin, Gestionnaire | Création produit (validation référence unique) |
| `PUT` | `/produits/:id` | Admin, Gestionnaire | Mise à jour des informations |
| `DELETE` | `/produits/:id` | Admin | Suppression d'un produit |

### Catégories & Fournisseurs
| Méthode | Route | Rôles Autorisés | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Tous | Liste des catégories |
| `POST` | `/categories` | Admin, Gestionnaire | Créer catégorie |
| `PUT` | `/categories/:id` | Admin, Gestionnaire | Modifier catégorie |
| `DELETE` | `/categories/:id` | Admin | Supprimer catégorie |
| `GET` | `/fournisseurs` | Admin, Gestionnaire | Liste des fournisseurs |
| `POST` | `/fournisseurs` | Admin, Gestionnaire | Créer fournisseur |
| `PUT` | `/fournisseurs/:id`| Admin, Gestionnaire | Modifier fournisseur |
| `DELETE` | `/fournisseurs/:id`| Admin | Supprimer fournisseur |

---

## 4. Module Mouvements de Stock (`/mouvements`)

| Méthode | Route | Rôles Autorisés | Description | Corps de requête |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/mouvements` | Admin, Gestionnaire | Historique des mouvements avec filtres (date, type, motif, produit) | - |
| `POST` | `/mouvements` | Admin, Gestionnaire, Vendeur (seulement motif VENTE pour vendeur) | Déclaration d'un mouvement avec mise à jour atomique du stock | `{ "produit_id": 1, "type": "SORTIE", "quantite": 3, "motif": "VENTE" }` |

*Règle : Si `type == SORTIE` et `quantite > quantite_stock`, renvoie code `400` avec message d'interdiction de stock négatif.*

---

## 5. Module Commandes Fournisseurs (`/commandes`)

| Méthode | Route | Rôles Autorisés | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/commandes` | Admin, Gestionnaire | Liste des commandes fournisseurs |
| `GET` | `/commandes/:id` | Admin, Gestionnaire | Détail d'une commande et ses lignes |
| `POST` | `/commandes` | Admin, Gestionnaire | Créer une commande avec liste de produits |
| `PATCH` | `/commandes/:id/reception` | Admin, Gestionnaire | Réception partielle ou totale d'une commande (incrémente automatiquement le stock et génère les mouvements d'entrée) |
| `PATCH` | `/commandes/:id/statut` | Admin, Gestionnaire | Modifier le statut (ex: Annuler) |

---

## 6. Module Tableau de Bord (`/dashboard`)

| Méthode | Route | Rôles Autorisés | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/kpis` | Tous | Métriques globales : Valeur totale stock, Total références, Nombre d'alertes |
| `GET` | `/dashboard/alertes` | Tous | Liste des produits dont `quantite_stock <= seuil_alerte` |
| `GET` | `/dashboard/top-ventes`| Tous | Top 5 des produits les plus vendus |
| `GET` | `/dashboard/graphique` | Tous | Données agrégées des mouvements sur les 30 derniers jours |
