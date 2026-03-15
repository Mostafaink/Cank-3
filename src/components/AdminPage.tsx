import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { resetOfferToAvailable } from '../lib/offers';
import { Pencil, Plus, Trash2, X, RotateCcw, FileText } from 'lucide-react';
import OfferTemplatesManager from './OfferTemplatesManager';
import { Labels, render, renderAcronym, getCompactMode, setCompactMode } from '../labels';

interface Offer {
  id: string;
  user_id: string;
  type: string;
  status: 'available' | 'accepted';
  amount: number;
  config: {
    combinations?: Array<{
      label: string;
      counts: Record<string, number>;
    }>;
    schedules?: string[];
    enabled_count?: number;
    schedule_enabled_count?: number;
  };
  created_at: string;
  accepted_at: string | null;
}

interface Combination {
  label: string;
  counts: Record<string, number>;
}

export default function AdminPage({ onClose }: { onClose: () => void }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [cashOffers, setCashOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'accepted'>('all');
  const [showTemplates, setShowTemplates] = useState(false);

  const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  useEffect(() => {
    if (!supabaseConfigured) {
      // Avoid attempting to query if env vars are missing and show helpful error
      setLoading(false);
      console.error('Supabase env vars missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      return;
    }

    loadOffers();
  }, [statusFilter, supabaseConfigured]);

  async function loadOffers() {
    setLoading(true);

    let receivablesQuery = supabase
      .from('offers')
      .select('*')
      .eq('type', 'receivables')
      .order('status', { ascending: true })
      .order('amount', { ascending: true });

    let cashQuery = supabase
      .from('offers')
      .select('*')
      .eq('type', 'cash')
      .order('status', { ascending: true })
      .order('amount', { ascending: true });

    if (statusFilter !== 'all') {
      receivablesQuery = receivablesQuery.eq('status', statusFilter);
      cashQuery = cashQuery.eq('status', statusFilter);
    }

    const { data: receivablesData, error: receivablesError } = await receivablesQuery;
    const { data: cashData, error: cashError } = await cashQuery;

    if (receivablesError) {
      console.error('Error loading receivables offers:', receivablesError);
    } else {
      setOffers(receivablesData as Offer[]);
    }

    if (cashError) {
      console.error('Error loading cash offers:', cashError);
    } else {
      setCashOffers(cashData as Offer[]);
    }

    setLoading(false);
  }

  async function deleteOffer(id: string) {
    if (!confirm(Labels.ConfirmDeleteOffer.full)) return;

    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) {
      alert(Labels.ErrorDeletingOffer.full + error.message);
    } else {
      await loadOffers();
    }
  }

  async function handleResetOffer(id: string) {
    if (!confirm(Labels.ConfirmResetOffer.full)) return;

    const success = await resetOfferToAvailable(id);
    if (success) {
      await loadOffers();
    } else {
      alert(Labels.ErrorSavingOffer.full);
    }
  }

  function startCreatingReceivables() {
    setIsCreating(true);
    setEditingOffer({
      id: '',
      user_id: '00000000-0000-0000-0000-000000000001',
      type: 'receivables',
      status: 'available',
      amount: 0,
      config: {
        combinations: [],
        schedules: ['daily', 'weekly', 'monthly'],
        enabled_count: 1,
        schedule_enabled_count: 1
      },
      created_at: new Date().toISOString(),
      accepted_at: null
    });
  }

  function startCreatingCash() {
    setIsCreating(true);
    setEditingOffer({
      id: '',
      user_id: '00000000-0000-0000-0000-000000000001',
      type: 'cash',
      status: 'available',
      amount: 0,
      config: {},
      created_at: new Date().toISOString(),
      accepted_at: null
    });
  }

  if (showTemplates) {
    return (
      <OfferTemplatesManager
        onClose={() => {
          setShowTemplates(false);
          loadOffers();
        }}
      />
    );
  }

  if (!supabaseConfigured) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-lg text-center">
          <div className="text-red-600 font-bold mb-2">Supabase not configured</div>
          <div className="text-sm text-neutral-700">Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> and restart the dev server.</div>
          <div className="mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-blue-600 text-white">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="text-center">{render(Labels.Loading)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="bg-white border-b rounded-t-2xl p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold">{render(Labels.AdminManageOffers)}</h1>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm"
                title={Labels.ManageTemplates.full}
              >
                <FileText className="w-4 h-4" />
                {render(Labels.ManageTemplates)}
              </button>

              <button
                onClick={() => window.open(window.location.pathname + '?preview=templates', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-xl font-bold hover:bg-neutral-900 transition-colors text-sm"
                title={Labels.OpenTemplatesPreviewNewTab.full}
              >
                {render(Labels.PreviewTemplates)}
              </button>
            </div>
          </div>
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
          <div className="mb-6 flex items-center gap-4">
            <label className="text-sm font-bold">{render(Labels.FilterByStatus)}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'accepted')}
              className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">{render(Labels.AllOffers)}</option>
              <option value="available">{render(Labels.AvailableOnly)}</option>
              <option value="accepted">{render(Labels.AcceptedOnly)}</option>
            </select>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{render(Labels.CashOffers)}</h2>
            <button
              onClick={startCreatingCash}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              title={Labels.AddCashOffer.full}
            >
              <Plus className="w-5 h-5" />
              {render(Labels.AddCashOffer)}
            </button>
          </div>

          <div className="grid gap-4 mb-8">
            {cashOffers.map((offer) => (
              <div
                key={offer.id}
                className="border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-neutral-600" title={Labels.CashOffers.full}>
                        {renderAcronym(Labels.CashOffers)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        offer.status === 'available'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {offer.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {offer.status === 'accepted' && (
                      <button
                        onClick={() => handleResetOffer(offer.id)}
                        className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Reset to Available"
                      >
                        <RotateCcw className="w-5 h-5 text-orange-600" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setEditingOffer(offer);
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-5 h-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {cashOffers.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                {render(Labels.NoCashOffers)}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-6 pt-6 border-t">
            <h2 className="text-xl font-bold">{render(Labels.ReceivablesOffers)}</h2>
            <button
              onClick={startCreatingReceivables}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              title={Labels.AddReceivablesOffer.full}
            >
              <Plus className="w-5 h-5" />
              {render(Labels.AddReceivablesOffer)}
            </button>
          </div>

          <div className="grid gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-neutral-600" title={Labels.ReceivablesOffers.full}>
                        {renderAcronym(Labels.ReceivablesOffers)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        offer.status === 'available'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {offer.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-semibold text-neutral-600">{render(Labels.Combinations)}:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(offer.config.combinations || []).map((combo, idx) => (
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
                          {(offer.config.schedules || []).map((schedule, idx) => (
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
                        <span className="font-semibold">{render(Labels.EnabledCombinations)}</span> {offer.config.enabled_count || 1} ·
                        <span className="font-semibold ml-2">{render(Labels.EnabledSchedules)}</span> {offer.config.schedule_enabled_count || 1}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {offer.status === 'accepted' && (
                      <button
                        onClick={() => handleResetOffer(offer.id)}
                        className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Reset to Available"
                      >
                        <RotateCcw className="w-5 h-5 text-orange-600" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setEditingOffer(offer);
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-5 h-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {offers.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                No offers yet. Click "Add Receivables Offer" to create one.
              </div>
            )}
          </div>
        </div>
      </div>

      {editingOffer && (
        <EditOfferModal
          offer={editingOffer}
          isCreating={isCreating}
          onClose={() => {
            setEditingOffer(null);
            setIsCreating(false);
          }}
          onSave={async () => {
            await loadOffers();
            setEditingOffer(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

function EditOfferModal({
  offer,
  isCreating,
  onClose,
  onSave,
}: {
  offer: Offer;
  isCreating: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const [amount, setAmount] = useState(offer.amount);
  const [combinations, setCombinations] = useState<Combination[]>(
    offer.config.combinations || []
  );
  const [enabledCount, setEnabledCount] = useState(offer.config.enabled_count || 1);
  const [scheduleEnabledCount, setScheduleEnabledCount] = useState(
    offer.config.schedule_enabled_count || 1
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
    if (amount <= 0) {
      alert(Labels.PleaseEnterValidAmount.full);
      return;
    }

    if (offer.type === 'receivables' && combinations.length === 0) {
      alert(Labels.PleaseAddCombination.full);
      return;
    }

    setSaving(true);

    const config = offer.type === 'cash'
      ? {}
      : {
          combinations,
          schedules: ['daily', 'weekly', 'monthly'],
          enabled_count: enabledCount,
          schedule_enabled_count: scheduleEnabledCount
        };

    try {
      if (isCreating) {
        const { error } = await supabase.from('offers').insert({
          user_id: '00000000-0000-0000-0000-000000000001',
          type: offer.type,
          status: 'available',
          amount,
          config
        });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('offers')
          .update({ amount, config })
          .eq('id', offer.id);

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      // Log full error for debugging and show a clearer message to the user
      console.error('Error saving offer:', error);
      const errMsg = error?.message || JSON.stringify(error) || 'Unknown error';
      alert(Labels.ErrorSavingOffer.full + "\n" + errMsg + "\n\nCheck Supabase RLS/policies or your anon key if the operation is denied.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col my-8">
        <div className="bg-white border-b rounded-t-2xl p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold">
              {isCreating ? render(Labels.CreateNewOffer) : render(Labels.EditOffer)}
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

          {offer.type === 'receivables' && (
            <>
              <div>
                <label className="block text-sm font-bold mb-2">{render(Labels.Combinations)}</label>

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
                    Enabled Combinations
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
                    Enabled Schedules
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
            {saving ? render(Labels.SavingButton) : isCreating ? render(Labels.CreateOfferButton) : render(Labels.SaveChangesButton)}
          </button>
        </div>
      </div>
    </div>
  );
}
