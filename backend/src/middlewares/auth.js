const jwt = require('jsonwebtoken');
const { Utilisateur, Role } = require('../models');

// Middleware pour vérifier le JWT dans le header Authorization
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Accès non autorisé : Token manquant ou invalide.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stockpro_default_secret');
    const utilisateur = await Utilisateur.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!utilisateur || !utilisateur.actif) {
      return res.status(401).json({
        success: false,
        error: 'Compte utilisateur inexistant ou désactivé.',
      });
    }

    req.user = utilisateur;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token expiré ou invalide.',
    });
  }
};

// Middleware RBAC pour restreindre par rôle(s)
const authorizeRoles = (...rolesAutorises) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé : Aucun rôle associé.',
      });
    }

    if (!rolesAutorises.includes(req.user.role.nom)) {
      return res.status(403).json({
        success: false,
        error: `Accès interdit : cette action nécessite l'un des rôles suivants : [${rolesAutorises.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles,
};
