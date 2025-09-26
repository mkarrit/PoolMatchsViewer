/**
 * Validateurs pour les données de match
 */

import { tables } from './config';

export const matchValidators = {
  /**
   * Valide les données d'un nouveau match
   */
  validateNewMatch: (player1, player2, table, maxDuration) => {
    const errors = [];

    // Validation des joueurs
    if (!player1?.trim()) {
      errors.push('Le nom du joueur 1 est obligatoire');
    } else if (player1.trim().length < 2) {
      errors.push('Le nom du joueur 1 doit contenir au moins 2 caractères');
    } else if (player1.trim().length > 50) {
      errors.push('Le nom du joueur 1 ne peut pas dépasser 50 caractères');
    }

    if (!player2?.trim()) {
      errors.push('Le nom du joueur 2 est obligatoire');
    } else if (player2.trim().length < 2) {
      errors.push('Le nom du joueur 2 doit contenir au moins 2 caractères');
    } else if (player2.trim().length > 50) {
      errors.push('Le nom du joueur 2 ne peut pas dépasser 50 caractères');
    }

    // Vérifier que les joueurs ne sont pas identiques
    if (player1?.trim().toLowerCase() === player2?.trim().toLowerCase()) {
      errors.push('Les deux joueurs ne peuvent pas avoir le même nom');
    }

    // Validation de la table
    if (!table?.trim()) {
      errors.push('La table est obligatoire');
    } else {
      const tableId = parseInt(table.trim());
      const tableConfig = tables.find(t => t.id === tableId);
      if (!tableConfig) {
        errors.push('Table invalide - veuillez sélectionner une table valide');
      }
    }

    // Validation de la durée
    const duration = Number(maxDuration);
    if (!maxDuration || isNaN(duration)) {
      errors.push('La durée du match est obligatoire et doit être un nombre');
    } else if (duration < 5) {
      errors.push('La durée minimale d\'un match est de 5 minutes');
    } else if (duration > 300) {
      errors.push('La durée maximale d\'un match est de 300 minutes (5h)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Valide le statut d'un match
   */
  validateMatchStatus: (status) => {
    const validStatuses = ['active', 'paused', 'finished'];
    return validStatuses.includes(status);
  },

  /**
   * Vérifie si une table est disponible
   */
  checkTableAvailability: (table, existingMatches, excludeMatchId = null) => {
    const tableId = parseInt(table);
    const occupiedTable = existingMatches.find(match => 
      parseInt(match.table) === tableId && 
      match.status !== 'finished' &&
      match.id !== excludeMatchId
    );
    
    return {
      isAvailable: !occupiedTable,
      occupiedBy: occupiedTable ? occupiedTable : null
    };
  },

  /**
   * Nettoie et normalise les entrées utilisateur
   */
  sanitizeInputs: (player1, player2, table) => {
    return {
      player1: player1?.trim().replace(/\s+/g, ' ') || '',
      player2: player2?.trim().replace(/\s+/g, ' ') || '',
      table: table?.trim() || ''
    };
  }
};

/**
 * Gestionnaire d'erreurs global
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
  NETWORK_ERROR: 'NETWORK_ERROR'
};
