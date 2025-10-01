import React, { useState } from 'react';
import { useTables } from '../hooks/useTables';

export default function TableConfig({ isOpen, onClose, addToast }) {
  const { tables, loading, error, addTable, updateTable, removeTable, resetToDefault } = useTables();
  const [editingTable, setEditingTable] = useState(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCode, setNewTableCode] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleAddTable = () => {
    if (!newTableName.trim() || !newTableCode.trim()) {
      addToast('Le nom et le code sont obligatoires', 'error');
      return;
    }

    const result = addTable(newTableName, newTableCode);
    if (result.success) {
      addToast(`Table "${newTableName}" ajoutée avec succès`, 'success');
      setNewTableName('');
      setNewTableCode('');
      setShowAddForm(false);
    } else {
      addToast(result.error, 'error');
    }
  };

  const handleUpdateTable = (id, name, code) => {
    if (!name.trim() || !code.trim()) {
      addToast('Le nom et le code sont obligatoires', 'error');
      return;
    }

    const result = updateTable(id, name, code);
    if (result.success) {
      addToast('Table mise à jour avec succès', 'success');
      setEditingTable(null);
    } else {
      addToast(result.error, 'error');
    }
  };

  const handleRemoveTable = (id) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la table "${table.name}" ?`)) {
      const result = removeTable(id);
      if (result.success) {
        addToast(`Table "${table.name}" supprimée`, 'success');
      } else {
        addToast(result.error, 'error');
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir restaurer la configuration par défaut ?')) {
      const result = resetToDefault();
      if (result.success) {
        addToast('Configuration restaurée par défaut', 'success');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-surface via-primary to-secondary backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-glass-medium backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-text-primary">⚙️ Configuration des Tables</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-glass-light hover:bg-glass-medium transition-all duration-200 text-text-primary"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Boutons d'action globaux */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-white font-medium transition-all duration-200"
            >
              ➕ Ajouter une table
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-warning hover:bg-warning/80 rounded-lg text-white font-medium transition-all duration-200"
            >
              🔄 Restaurer par défaut
            </button>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="bg-glass-light rounded-lg p-4 mb-6 border border-white/10">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Ajouter une nouvelle table</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nom de la table"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-glass-medium text-text-primary border border-white/20 focus:border-accent focus:outline-none transition-all duration-300"
                />
                <input
                  type="text"
                  placeholder="Code CueScore"
                  value={newTableCode}
                  onChange={(e) => setNewTableCode(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-glass-medium text-text-primary border border-white/20 focus:border-accent focus:outline-none transition-all duration-300"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTable}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-success hover:bg-success/80 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    ✓ Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTableName('');
                      setNewTableCode('');
                    }}
                    className="px-4 py-3 bg-gray-500 hover:bg-gray-600 rounded-lg text-white font-medium transition-all duration-200"
                  >
                    ✗
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-lg p-3 mb-6">
              <div className="flex items-center gap-2 text-error">
                <div className="w-2 h-2 bg-error rounded-full"></div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Liste des tables */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Tables configurées ({tables.length})
            </h3>
            
            {tables.length === 0 ? (
              <div className="bg-glass-light rounded-lg p-8 text-center">
                <div className="text-4xl mb-4 opacity-50">🎱</div>
                <p className="text-text-muted">Aucune table configurée</p>
              </div>
            ) : (
              tables.map((table) => (
                <div key={table.id} className="bg-glass-light rounded-lg p-4 border border-white/10">
                  {editingTable === table.id ? (
                    <EditTableForm 
                      table={table}
                      onSave={handleUpdateTable}
                      onCancel={() => setEditingTable(null)}
                      loading={loading}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="bg-accent text-white px-3 py-1 rounded-md text-sm font-bold">
                          ID: {table.id}
                        </span>
                        <span className="text-text-primary font-semibold">
                          {table.name}
                        </span>
                        <span className="bg-glass-medium px-3 py-1 rounded text-sm text-text-muted font-mono">
                          {table.code}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTable(table.id)}
                          className="px-3 py-1 bg-accent hover:bg-accent/80 rounded text-white text-sm transition-all duration-200"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleRemoveTable(table.id)}
                          className="px-3 py-1 bg-error hover:bg-error/80 rounded text-white text-sm transition-all duration-200"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-glass-light rounded-lg p-4 border border-white/10">
            <h4 className="text-text-primary font-medium mb-2">💡 Instructions</h4>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Chaque table doit avoir un nom unique et un code CueScore valide</li>
              <li>• Les codes CueScore sont fournis par l'administrateur du système</li>
              <li>• Les modifications sont sauvegardées automatiquement</li>
              <li>• La configuration sera appliquée à tous les nouveaux matchs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour éditer une table
function EditTableForm({ table, onSave, onCancel, loading }) {
  const [name, setName] = useState(table.name);
  const [code, setCode] = useState(table.code);

  const handleSave = () => {
    onSave(table.id, name, code);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div>
        <label className="block text-sm text-text-muted mb-2">Nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded bg-glass-medium text-text-primary border border-white/20 focus:border-accent focus:outline-none transition-all duration-300"
        />
      </div>
      <div>
        <label className="block text-sm text-text-muted mb-2">Code CueScore</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 rounded bg-glass-medium text-text-primary border border-white/20 focus:border-accent focus:outline-none transition-all duration-300"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-success hover:bg-success/80 rounded text-white text-sm transition-all duration-200 disabled:opacity-50"
        >
          ✓ Sauver
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded text-white text-sm transition-all duration-200"
        >
          ✗ Annuler
        </button>
      </div>
    </div>
  );
}
