import { useCallback, useEffect, useState } from 'react';
import { getTables, TABLES_STORAGE_KEY, TABLES_UPDATED_EVENT } from '../utils/config';

/**
 * Hook pour gérer la configuration des tables du club.
 *
 * Toutes les instances du hook se resynchronisent sur l'événement
 * `tablesUpdated` (même onglet) et sur `storage` (autres onglets) : la liste
 * affichée ne peut pas diverger d'un composant à l'autre.
 */
export function useTables() {
  const [tables, setTables] = useState(getTables);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reloadTables = useCallback(() => {
    setError(null);
    setTables(getTables());
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === TABLES_STORAGE_KEY) reloadTables();
    };

    window.addEventListener(TABLES_UPDATED_EVENT, reloadTables);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(TABLES_UPDATED_EVENT, reloadTables);
      window.removeEventListener('storage', handleStorage);
    };
  }, [reloadTables]);

  const saveTables = useCallback((newTables) => {
    setLoading(true);
    try {
      setError(null);

      if (!Array.isArray(newTables)) {
        throw new Error('Les tables doivent être un tableau');
      }

      for (const table of newTables) {
        if (!Number.isInteger(table?.id) || table.id <= 0) {
          throw new Error("L'ID doit être un nombre entier positif");
        }
        if (typeof table.name !== 'string' || table.name.trim() === '') {
          throw new Error('Le nom ne peut pas être vide');
        }
        if (typeof table.code !== 'string' || table.code.trim() === '') {
          throw new Error('Le code CueScore ne peut pas être vide');
        }
        // CueScore n'accepte que des codes alphanumériques : les rejeter ici
        // évite d'attendre un appel API pour découvrir la faute de frappe.
        if (!/^[A-Za-z0-9]+$/.test(table.code.trim())) {
          throw new Error(`Code CueScore invalide : "${table.code}" (lettres et chiffres uniquement)`);
        }
      }

      const ids = newTables.map((t) => t.id);
      if (new Set(ids).size !== ids.length) {
        throw new Error('Les IDs des tables doivent être uniques');
      }

      const names = newTables.map((t) => t.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) {
        throw new Error('Les noms des tables doivent être uniques');
      }

      const codes = newTables.map((t) => t.code.trim().toLowerCase());
      if (new Set(codes).size !== codes.length) {
        throw new Error('Les codes des tables doivent être uniques');
      }

      localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(newTables));
      setTables(newTables);

      // Prévient les autres consommateurs du hook dans le même onglet.
      window.dispatchEvent(new CustomEvent(TABLES_UPDATED_EVENT));

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const addTable = useCallback(
    (name, code) => {
      const nextId = tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1;
      return saveTables([...tables, { id: nextId, name: name.trim(), code: code.trim() }]);
    },
    [tables, saveTables]
  );

  const updateTable = useCallback(
    (id, name, code) =>
      saveTables(
        tables.map((table) =>
          table.id === id ? { ...table, name: name.trim(), code: code.trim() } : table
        )
      ),
    [tables, saveTables]
  );

  const removeTable = useCallback(
    (id) => saveTables(tables.filter((table) => table.id !== id)),
    [tables, saveTables]
  );

  const clearTables = useCallback(() => {
    try {
      localStorage.removeItem(TABLES_STORAGE_KEY);
      setTables([]);
      window.dispatchEvent(new CustomEvent(TABLES_UPDATED_EVENT));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    tables,
    loading,
    error,
    addTable,
    updateTable,
    removeTable,
    saveTables,
    clearTables,
    reloadTables,
  };
}
