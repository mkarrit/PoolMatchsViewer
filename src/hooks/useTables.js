import { useState, useEffect } from 'react';

/**
 * Hook pour gérer la configuration des tables du club
 */
export function useTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les tables au montage
  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = () => {
    try {
      setError(null);
      const savedTables = localStorage.getItem('clubTables');
      if (savedTables) {
        const parsed = JSON.parse(savedTables);
        if (Array.isArray(parsed)) {
          setTables(parsed);
          return;
        }
      }
      
      // Charger les tables par défaut
      const defaultTables = [

      ];
      setTables(defaultTables);
    } catch (err) {
      setError('Erreur lors du chargement des tables');
      console.error('Erreur loadTables:', err);
    }
  };

  const saveTables = (newTables) => {
    try {
      setError(null);
      setLoading(true);
      
      // Validation des données
      if (!Array.isArray(newTables)) {
        throw new Error('Les tables doivent être un tableau');
      }

      // Validation de chaque table
      for (const table of newTables) {
        if (!table.id || !table.name || !table.code) {
          throw new Error('Chaque table doit avoir un id, nom et code');
        }
        if (typeof table.id !== 'number' || table.id <= 0) {
          throw new Error('L\'ID doit être un nombre positif');
        }
        if (typeof table.name !== 'string' || table.name.trim().length === 0) {
          throw new Error('Le nom ne peut pas être vide');
        }
        if (typeof table.code !== 'string' || table.code.trim().length === 0) {
          throw new Error('Le code ne peut pas être vide');
        }
      }

      // Vérifier les doublons d'ID
      const ids = newTables.map(t => t.id);
      if (new Set(ids).size !== ids.length) {
        throw new Error('Les IDs des tables doivent être uniques');
      }

      // Vérifier les doublons de code
      const codes = newTables.map(t => t.code);
      if (new Set(codes).size !== codes.length) {
        throw new Error('Les codes des tables doivent être uniques');
      }

      localStorage.setItem('clubTables', JSON.stringify(newTables));
      setTables(newTables);
      
      // Déclencher un événement pour recharger les autres composants
      window.dispatchEvent(new CustomEvent('tablesUpdated'));
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addTable = (name, code) => {
    const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    const newTable = { id: newId, name: name.trim(), code: code.trim() };
    return saveTables([...tables, newTable]);
  };

  const updateTable = (id, name, code) => {
    const updatedTables = tables.map(table => 
      table.id === id 
        ? { ...table, name: name.trim(), code: code.trim() }
        : table
    );
    return saveTables(updatedTables);
  };

  const removeTable = (id) => {
    const updatedTables = tables.filter(table => table.id !== id);
    return saveTables(updatedTables);
  };

  const resetToDefault = () => {
    localStorage.removeItem('clubTables');
    loadTables();
    return { success: true };
  };

  return {
    tables,
    loading,
    error,
    addTable,
    updateTable,
    removeTable,
    saveTables,
    resetToDefault,
    reloadTables: loadTables
  };
}
