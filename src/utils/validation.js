/**
 * Validateurs pour les données de match
 */

import { appConfig, findTableById } from './config';

export const MATCH_STATUSES = ['waiting', 'active', 'paused', 'finished'];

export const matchValidators = {
  /**
   * Valide les données d'un nouveau match
   */
  validateNewMatch: (player1, player2, table, maxDuration) => {
    const errors = [];
    const { playerNameMinLength: minLen, playerNameMaxLength: maxLen } = appConfig.validation;
    const { minDuration, maxDuration: maxAllowed } = appConfig.match;

    const validatePlayerName = (name, label) => {
      const trimmed = name?.trim() || '';
      if (!trimmed) {
        errors.push(`Le nom du ${label} est obligatoire`);
      } else if (trimmed.length < minLen) {
        errors.push(`Le nom du ${label} doit contenir au moins ${minLen} caractères`);
      } else if (trimmed.length > maxLen) {
        errors.push(`Le nom du ${label} ne peut pas dépasser ${maxLen} caractères`);
      }
    };

    validatePlayerName(player1, 'joueur 1');
    validatePlayerName(player2, 'joueur 2');

    // Comparaison uniquement si le premier nom est renseigné : sinon deux
    // champs vides déclencheraient à tort l'erreur "même nom".
    if (player1?.trim() && player1.trim().toLowerCase() === player2?.trim().toLowerCase()) {
      errors.push('Les deux joueurs ne peuvent pas avoir le même nom');
    }

    // La table est relue à chaque appel : une table ajoutée depuis le
    // chargement de la page doit être acceptée sans rafraîchir.
    if (!table?.toString().trim()) {
      errors.push('La table est obligatoire');
    } else if (!findTableById(table)) {
      errors.push('Table invalide - veuillez sélectionner une table valide');
    }

    const duration = Number(maxDuration);
    if (!maxDuration || Number.isNaN(duration)) {
      errors.push('La durée du match est obligatoire et doit être un nombre');
    } else if (duration < minDuration) {
      errors.push(`La durée minimale d'un match est de ${minDuration} minutes`);
    } else if (duration > maxAllowed) {
      errors.push(`La durée maximale d'un match est de ${maxAllowed} minutes`);
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Valide le statut d'un match
   */
  validateMatchStatus: (status) => MATCH_STATUSES.includes(status),

  /**
   * Vérifie si une table est disponible
   */
  checkTableAvailability: (table, existingMatches, excludeMatchId = null) => {
    const tableId = Number.parseInt(table, 10);
    const occupiedTable = existingMatches.find(
      (match) =>
        Number.parseInt(match.table, 10) === tableId &&
        match.status !== 'finished' &&
        match.id !== excludeMatchId
    );

    return {
      isAvailable: !occupiedTable,
      occupiedBy: occupiedTable || null,
    };
  },

  /**
   * Nettoie et normalise les entrées utilisateur
   */
  sanitizeInputs: (player1, player2, table) => ({
    player1: player1?.trim().replace(/\s+/g, ' ') || '',
    player2: player2?.trim().replace(/\s+/g, ' ') || '',
    table: table?.toString().trim() || '',
  }),
};

/**
 * Erreur métier transportant un code exploitable par l'UI
 */
export class MatchError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', data = null) {
    super(message);
    this.name = 'MatchError';
    this.code = code;
    this.data = data;
  }
}

export const errorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TABLE_OCCUPIED: 'TABLE_OCCUPIED',
  MATCH_NOT_FOUND: 'MATCH_NOT_FOUND',
  INVALID_STATUS: 'INVALID_STATUS',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
};
