import React, { useState } from "react";
import { Save, X } from "lucide-react";

export default function SavePlanModal({ defaultName, onSave, onClose }) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave(name.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao salvar plano.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-paper border border-divider p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink flex items-center gap-2">
            <Save className="w-4 h-4 text-accent-700" />
            Salvar Plano
          </h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="field-label">
            Nome do plano
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
            className="field-input"
          />
        </div>

        {error && (
          <div className="mb-4 callout-accent text-xs text-ink">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="btn-quiet flex-1 py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="btn-primary flex-1 py-2 text-sm"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
