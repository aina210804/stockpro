const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { Utilisateur, Role } = require('../models');

// Schémas de validation Joi
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  mot_de_passe: Joi.string().required(),
});

const registerSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  mot_de_passe: Joi.string().min(6).required(),
  role_id: Joi.number().integer().required(),
});

// Connexion
exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { email, mot_de_passe } = value;
    const user = await Utilisateur.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides.' });
    }

    if (!user.actif) {
      return res.status(403).json({ success: false, error: 'Ce compte a été désactivé.' });
    }

    const match = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides.' });
    }

    // Génération du Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.nom },
      process.env.JWT_SECRET || 'stockpro_default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.json({
      success: true,
      data: {
        token,
        utilisateur: {
          id: user.id,
          nom: user.nom,
          email: user.email,
          role: user.role.nom,
        },
      },
      message: 'Connexion réussie',
    });
  } catch (err) {
    console.error('Erreur login:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur lors de la connexion.' });
  }
};

// Inscription (Réservé à l'Admin ou initialisation)
exports.register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { nom, email, mot_de_passe, role_id } = value;

    const existing = await Utilisateur.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Cette adresse email est déjà utilisée.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const nouvelUtilisateur = await Utilisateur.create({
      nom,
      email,
      mot_de_passe: hash,
      role_id,
      actif: true,
    });

    const userWithRole = await Utilisateur.findByPk(nouvelUtilisateur.id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['mot_de_passe'] },
    });

    return res.status(201).json({
      success: true,
      data: userWithRole,
      message: 'Utilisateur créé avec succès.',
    });
  } catch (err) {
    console.error('Erreur register:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la création du compte.' });
  }
};

// Obtenir profil connecté
exports.me = async (req, res) => {
  return res.json({
    success: true,
    data: {
      id: req.user.id,
      nom: req.user.nom,
      email: req.user.email,
      role: req.user.role.nom,
      actif: req.user.actif,
    },
  });
};
