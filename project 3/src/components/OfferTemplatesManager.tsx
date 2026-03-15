import { useState, useEffect } from 'react';
import {
  getAllOfferTemplates,
  createOfferTemplate,
  updateOfferTemplate,
  deleteOfferTemplate,
  assignTemplateToUser,
  type OfferTemplate
} from '../lib/offers';
import { Pencil, Plus, Trash2, X, Copy, CheckCircle } from 'lucide-react';
import { Labels, render, getCompactMode, renderAcronym } from '../labels';
import { useCompactMode } from '../hooks/useCompactMode';

interface Combination {
  label: string;
  counts: Record<string, number>;
}

export default function OfferTemplatesManager({ onClose }: { onClose: () => void }) {
  const { isCompact } = useCompactMode();
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<OfferTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [assigningTemplate, setAssigningTemplate] = useState<OfferTemplate | null>(null);
  const [assignUserId, setAssignUserId] = useState('00000000-0000-0000-0000-000000000001');
  const [assignSuccess, setAssignSuccess] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const data = await getAllOfferTemplates();
    setTemplates(data);
    setLoading(false);
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm(Labels.ConfirmDeleteTemplate.full)) return;

    const success = await deleteOfferTemplate(id);
    if (success) {
      await loadTemplates();
    } else {
      alert(Labels.ErrorDeletingTemplate.full);
    }
  }

  function startCreatingCash() {
    setIsCreating(true);
    setEditingTemplate({
      id: '',
      name: '',
      type: 'cash',
      amount: 0,
      config: {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  function startCreatingReceivables() {
    setIsCreating(true);
    setEditingTemplate({
      id: '',
      name: '',
      type: 'receivables',
      amount: 0,
      config: {
        combinations: [],
        schedules: ['daily', 'weekly', 'monthly'],
        enabled_count: 1,
        schedule_enabled_count: 1
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  async function handleAssignTemplate(template: OfferTemplate) {
    if (!assignUserId.trim()) {
      alert(Labels.EnterUserID.full);
      return;
    }

    const offer = await assignTemplateToUser(template.id, assignUserId);
    if (offer) {
      setAssignSuccess(true);
      setTimeout(() => {
        setAssignSuccess(false);
        setAssigningTemplate(null);
        setAssignUserId('00000000-0000-0000-0000-000000000001');
      }, 1500);
    } else {
      alert(Labels.ErrorAssigningTemplate.full);
    }
  }

  const cashTemplates = templates.filter(t => t.type === 'cash' && t.is_active);
  const receivablesTemplates = templates.filter(t => t.type === 'receivables' && t.is_active);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="text-center">{render(Labels.LoadingTemplates)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="bg-white border-b rounded-t-2xl p-6 flex items-center justify-between flex-shrink-0">
          <h1 className="text-3xl font-extrabold">{render(Labels.OfferTemplates)}</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label={Labels.Close.full}
            title={Labels.Close.full}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{render(Labels.CashTemplates)}</h2>
            <button
              onClick={startCreatingCash}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              title={Labels.AddCashTemplate.full}
            >
              <Plus className="w-5 h-5" />
              {render(Labels.AddCashTemplate)}
            </button>
          </div>

          <div className="grid gap-4 mb-8">
            {cashTemplates.map((template) => (
              <div
                key={template.id}
                className="border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">{template.name}</div>
                    <div className="text-sm text-neutral-600" title={Labels.CashTemplates.full}>
                      {renderAcronym(Labels.CashTemplates)}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setAssigningTemplate(template)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                      title={Labels.AssignToUser.full} aria-label={Labels.AssignToUser.full}
                    >
                      <Copy className="w-5 h-5 text-green-600" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setEditingTemplate(template);
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title={Labels.Edit.full} aria-label={Labels.Edit.full}
                    >
                      <Pencil className="w-5 h-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title={Labels.Delete.full} aria-label={Labels.Delete.full}
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {cashTemplates.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                {render(Labels.NoCashTemplates)}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-6 pt-6 border-t">
            <h2 className="text-xl font-bold">{render(Labels.ReceivablesTemplates)}</h2>
            <button
              onClick={startCreatingReceivables}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              title={Labels.AddReceivablesTemplate.full}
            >
              <Plus className="w-5 h-5" />
              {render(Labels.AddReceivablesTemplate)}
            </button>
          </div>

          <div className="grid gap-4">
            {receivablesTemplates.map((template) => (
              <div
                key={template.id}
                className="border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">{template.name}</div>
                    <div className="text-sm text-neutral-600 mb-2" title={Labels.ReceivablesTemplates.full}>
                      {renderAcronym(Labels.ReceivablesTemplates)}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-semibold text-neutral-600">{render(Labels.Combinations)}:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(template.config.combinations || []).map((combo, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full text-sm font-medium"
                            >
                              {combo.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-semibold text-neutral-600">{render(Labels.Schedules)}:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(template.config.schedules || []).map((schedule, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                              {schedule.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-sm text-neutral-600">
                        <span className="font-semibold">{render(Labels.EnabledCombinations)}</span> {template.config.enabled_count || 1} ·
                        <span className="font-semibold ml-2">{render(Labels.EnabledSchedules)}</span> {template.config.schedule_enabled_count || 1}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setAssigningTemplate(template)}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                      title={Labels.AssignToUser.full} aria-label={Labels.AssignToUser.full}
                    >
                      <Copy className="w-5 h-5 text-green-600" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setEditingTemplate(template);
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title={Labels.Edit.full} aria-label={Labels.Edit.full}
                    >
                      <Pencil className="w-5 h-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title={Labels.Delete.full} aria-label={Labels.Delete.full}
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {receivablesTemplates.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                {render(Labels.NoReceivablesTemplates)}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          isCreating={isCreating}
          onClose={() => {
            setEditingTemplate(null);
            setIsCreating(false);
          }}
          onSave={async () => {
            await loadTemplates();
            setEditingTemplate(null);
            setIsCreating(false);
          }}
        />
      )}

      {assigningTemplate && (
        <AssignTemplateModal
          template={assigningTemplate}
          userId={assignUserId}
          onUserIdChange={setAssignUserId}
          onClose={() => {
            setAssigningTemplate(null);
            setAssignSuccess(false);
          }}
          onAssign={() => handleAssignTemplate(assigningTemplate)}
          success={assignSuccess}
        />
      )}
    </div>
  );
}

function EditTemplateModal({
  template,
  isCreating,
  onClose,
  onSave,
}: {
  template: OfferTemplate;
  isCreating: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(template.name);
  const [amount, setAmount] = useState(template.amount);
  const [combinations, setCombinations] = useState<Combination[]>(
    template.config.combinations || []
  );
  const [enabledCount, setEnabledCount] = useState(template.config.enabled_count || 1);
  const [scheduleEnabledCount, setScheduleEnabledCount] = useState(
    template.config.schedule_enabled_count || 1
  );
  const [saving, setSaving] = useState(false);

  const [newComboLabel, setNewComboLabel] = useState('');
  const [newComboCounts, setNewComboCounts] = useState<Record<string, number>>({});

  const cardTypes = ['red', 'white', 'sky', 'blue', 'black', 'silver', 'gold'];

  function addCombination() {
    if (!newComboLabel.trim()) {
      alert(Labels.PleaseEnterLabel.full);
      return;
    }

    const hasCards = Object.values(newComboCounts).some(v => v > 0);
    if (!hasCards) {
      alert(Labels.PleaseAddCard.full);
      return;
    }

    setCombinations([
      ...combinations,
      { label: newComboLabel, counts: { ...newComboCounts } }
    ]);
    setNewComboLabel('');
    setNewComboCounts({});
  }

  function removeCombination(index: number) {
    setCombinations(combinations.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      alert(Labels.PleaseEnterTemplateName.full);
      return;
    }

    if (amount <= 0) {
      alert(Labels.PleaseEnterValidAmount.full);
      return;
    }

    if (template.type === 'receivables' && combinations.length === 0) {
      alert(Labels.PleaseAddCombination.full);
      return;
    }

    setSaving(true);

    const config = template.type === 'cash'
      ? {}
      : {
          combinations,
          schedules: ['daily', 'weekly', 'monthly'],
          enabled_count: enabledCount,
          schedule_enabled_count: scheduleEnabledCount
        };

    try {
      if (isCreating) {
        const created = await createOfferTemplate(name, template.type, amount, config);
        if (!created) throw new Error('Failed to create template');
      } else {
        const success = await updateOfferTemplate(template.id, { name, amount, config });
        if (!success) throw new Error('Failed to update template');
      }

      onSave();
    } catch (error: any) {
      alert(Labels.ErrorSavingTemplate.full + error.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col my-8">
        <div className="bg-white border-b rounded-t-2xl p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold">
              {isCreating ? render(Labels.CreateNewTemplate) : render(Labels.EditTemplate)}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label={Labels.Close.full}
              title={Labels.Close.full}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-bold mb-2">{render(Labels.TemplateNameLabel)}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 100 EGP Cash Offer"
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">{render(Labels.AmountEGP)}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              min="0"
              step="1"
            />
          </div>

          {template.type === 'receivables' && (
            <>
              <div>
                <label className="block text-sm font-bold mb-2">Combinations</label>

                <div className="space-y-3 mb-4">
                  {combinations.map((combo, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                    >
                      <div>
                        <div className="font-bold">{combo.label}</div>
                        <div className="text-sm text-neutral-600">
                          {Object.entries(combo.counts)
                            .filter(([_, count]) => count > 0)
                            .map(([card, count]) => `${count} ${card}`)
                            .join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCombination(idx)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Label (e.g., 2W + 1R)"
                    value={newComboLabel}
                    onChange={(e) => setNewComboLabel(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />

                  <div className="grid grid-cols-7 gap-2">
                    {cardTypes.map((card) => (
                      <div key={card}>
                        <label className="block text-xs font-semibold mb-1 uppercase">
                          {card}
                        </label>
                        <input
                          type="number"
                          value={newComboCounts[card] || 0}
                          onChange={(e) =>
                            setNewComboCounts({
                              ...newComboCounts,
                              [card]: Number(e.target.value)
                            })
                          }
                          className="w-full px-2 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addCombination}
                    className="w-full py-2 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-colors"
                    title={Labels.AddCombination.full}
                  >
                    {render(Labels.AddCombination)}
                  </button>
                </div>
              </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    {render(Labels.EnabledCombinations)}
                  </label>
                  <input
                    type="number"
                    value={enabledCount}
                    onChange={(e) => setEnabledCount(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    min="1"
                    max={combinations.length || 1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    {render(Labels.EnabledSchedules)}
                  </label>
                  <input
                    type="number"
                    value={scheduleEnabledCount}
                    onChange={(e) => setScheduleEnabledCount(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    min="1"
                    max="3"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white border-t rounded-b-2xl p-6 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold hover:bg-neutral-100 transition-colors"
            disabled={saving}
            title={Labels.CancelButton.full}
          >
            {render(Labels.CancelButton)}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? render(Labels.SavingButton) : isCreating ? render(Labels.CreateNewTemplate) : render(Labels.SaveChangesButton)}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignTemplateModal({
  template,
  userId,
  onUserIdChange,
  onClose,
  onAssign,
  success
}: {
  template: OfferTemplate;
  userId: string;
  onUserIdChange: (id: string) => void;
  onClose: () => void;
  onAssign: () => void;
  success: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-white border-b rounded-t-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold" aria-label={Labels.AssignTemplateToUser.full}>
              {renderAcronym(Labels.AssignTemplateToUser)}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label={Labels.Close.full}
              title={Labels.Close.full}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
              <div className="flex flex-col items-center justify-center py-8" role="status" aria-live="polite">
              <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
              <div className="text-xl font-bold text-green-600" aria-label={Labels.SuccessfullyAssigned.full}>
                {renderAcronym(Labels.SuccessfullyAssigned)}
              </div>
              <div className="text-neutral-600 text-center mt-2" aria-label={Labels.SuccessfullyAssigned.full}>
                {Labels.SuccessfullyAssigned.full}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-neutral-50 rounded-xl p-4">
                <div className="font-bold">{template.name}</div>
                <div className="text-sm text-neutral-600 mt-1">
                  Type: {template.type.toUpperCase()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" aria-label={Labels.UserIDLabel.full}>
                  {renderAcronym(Labels.UserIDLabel)}
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => onUserIdChange(e.target.value)}
                  placeholder={Labels.EnterUserID.full}
                  aria-label={Labels.EnterUserID.full}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-2 rounded-xl font-bold hover:bg-neutral-100 transition-colors"
                  aria-label={Labels.CancelButton.full}
                  title={Labels.CancelButton.full}
                >
                  {renderAcronym(Labels.CancelButton)}
                </button>
                <button
                  onClick={onAssign}
                  className="flex-1 px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                  aria-label={Labels.AssignButton.full}
                  title={Labels.AssignButton.full}
                >
                  {renderAcronym(Labels.AssignButton)}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
