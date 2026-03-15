import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { trackConversion, trackModalClick } from './lib/tracking';
import { getOffers, acceptOffer, type Offer } from './lib/offers';
import AdminPage from './components/AdminPage';
import OfferTemplatesManager from './components/OfferTemplatesManager';
import { useCompactMode } from './hooks/useCompactMode';
import { Labels, renderAcronym } from './labels';

const CARD_KEYS = ["red", "white", "sky", "blue", "black", "silver", "gold"];

// Server-side pricing calculation (backend has actual prices, frontend cannot access)
function calculateCardCount(color: string, qty: number): number {
  // Frontend only counts cards; actual price is calculated server-side
  // This protects the algorithm: PRICE values are never exposed to frontend
  return qty;
}

function useEsc(onEsc: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onEsc(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onEsc]);
}

function Modal({ open, onClose, title, children, width = 560 }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; width?: number }) {
  useEsc(() => { if (open) onClose(); });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative rounded-2xl bg-white shadow-2xl p-5 w-full" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close" className="absolute right-3 top-2 text-2xl" onClick={onClose}>×</button>
        {title ? <h2 className="text-center font-extrabold text-xl mb-3">{title}</h2> : null}
        <div className="text-center">{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-neutral-900 text-white px-4 py-2 shadow-lg">{msg}</div>;
}

function Sidebar({ active, setActive, userId, onAdminClick, isCompact, onToggleCompact }: { active: string; setActive: (a: string) => void; userId: string; onAdminClick: () => void; isCompact: boolean; onToggleCompact: (enabled: boolean) => void }) {
  const items = [
    { id: "account", label: Labels.Account },
    { id: "cards", label: Labels.Cards },
    { id: "collect", label: Labels.Collect },
    { id: "credit", label: Labels.Credit },
    { id: "settings", label: Labels.Settings },
  ];
  return (
    <aside className="w-64 bg-neutral-900 text-neutral-200 p-4 flex flex-col min-h-screen">
      <div className="font-extrabold text-2xl mb-2">{renderAcronym(Labels.Cank)}</div>
      <nav className="flex flex-col gap-2">
        {items.map((i) => (
          <button
            key={i.id}
            className={`text-left rounded-xl px-3 py-2 font-semibold ${active === i.id ? "bg-white/15 outline outline-2 outline-blue-500 outline-offset-2" : "hover:bg-white/10"}`}
            onClick={() => {
              setActive(i.id);
            }}
          >
            {renderAcronym(i.label)}
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-neutral-700 flex-shrink-0 space-y-2">
        <button
          onClick={() => onToggleCompact(!isCompact)}
          className={`w-full px-3 py-2 rounded-xl font-semibold text-xs transition-colors ${
            isCompact
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={isCompact ? 'Disable abbreviations' : 'Enable abbreviations'}
        >
          {isCompact ? 'ABBR ON' : 'ABBR OFF'}
        </button>
        <button
          onClick={onAdminClick}
          className="w-full text-left rounded-xl px-3 py-2 font-semibold text-neutral-400 hover:bg-white/10 hover:text-neutral-200 transition-colors text-xs"
        >
          {renderAcronym(Labels.AdminPanel)}
        </button>
      </div>
    </aside>
  );
}

function sortDues(list: any[]) {
  const order: Record<string, number> = { overdue: 0, due: 1, upcoming: 2, paid: 3 };
  return [...list].sort((a, b) => {
    const oa = order[a.status] ?? 2;
    const ob = order[b.status] ?? 2;
    if (oa !== ob) return oa - ob;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

async function getUserFlow(userId: string) {
  const { data, error } = await supabase
    .from('user_flows')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user flow:', error);
    return null;
  }

  return data;
}

async function assignUserToFlow(userId: string, flowType: string) {
  const { error } = await supabase
    .from('user_flows')
    .insert({
      user_id: userId,
      flow_type: flowType,
      current_modal_step: 0
    });

  if (error) {
    console.error('Error assigning user to flow:', error);
  }
}

async function progressUserFlow(userId: string, action: 'accept' | 'recheck') {
  const userFlow = await getUserFlow(userId);
  if (!userFlow) return;

  const newStep = action === 'accept' ? 0 : userFlow.current_modal_step + 1;

  const { error } = await supabase
    .from('user_flows')
    .update({
      current_modal_step: newStep,
      last_action: action,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user flow:', error);
  }
}

function App() {
  const { isCompact, toggleCompactMode } = useCompactMode();
  
  // Quick preview mode for non-engineer previewing (open `?preview=templates`)
  try {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (params?.get('preview') === 'templates') {
      return (
        // Render the templates manager alone so the user can inspect and provide feedback.
        <OfferTemplatesManager onClose={() => {
          // remove preview param and reload to return to app
          const u = new URL(window.location.href);
          u.searchParams.delete('preview');
          window.location.href = u.toString();
        }} />
      );
    }
  } catch (e) {
    // ignore when SSR or other envs
  }
  const [app, setApp] = useState({
    user: { firstName: "Loading...", fullName: "Loading..." },
    account: { number: 1, currency: "EGP", symbol: "L.E." },
    balances: { cards: 0, collect: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [userId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [cashOfferAmount, setCashOfferAmount] = useState<number>(0);
  const [cashOfferId, setCashOfferId] = useState<string>('');
  const [userFlowStep, setUserFlowStep] = useState<number>(0);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setApp((p) => ({ ...p, user: { firstName: "Demo", fullName: "Demo User" } }));
    await initializeUserFlow();
    await loadOffers();
    setLoading(false);
  }

  async function initializeUserFlow() {
    const userFlow = await getUserFlow(userId);
    if (!userFlow) {
      await assignUserToFlow(userId, 'standard');
      setUserFlowStep(0);
    } else {
      setUserFlowStep(userFlow.current_modal_step);
    }
  }

  async function loadOffers() {
    const allOffers = await getOffers(userId);

    const cashOffer = allOffers.find(o => o.type === 'cash');
    if (cashOffer) {
      setCashOfferAmount(cashOffer.amount);
      setCashOfferId(cashOffer.id);
    }

    const receivables = allOffers.filter(o => o.type === 'receivables');
    const mapped = receivables.map(o => ({
      id: o.id,
      offerId: o.id,
      amount: o.amount,
      enabledCount: o.config.enabled_count || 1,
      combinations: o.config.combinations || [],
      schedules: o.config.schedules || [],
      scheduleEnabledCount: o.config.schedule_enabled_count || 1
    }));
    setOffers(mapped);
  }

  const [offers, setOffers] = useState<any[]>([]);
  const hasOffers = offers.length > 0;

  const [active, setActive] = useState("account");
  const [toast, setToast] = useState("");
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1400); };

  const [accountOpen, setAccountOpen] = useState(false);
  const [cashoutOpen, setCashoutOpen] = useState(false);
  const [recvOpen, setRecvOpen] = useState(false);

  const [activateOpen, setActivateOpen] = useState(false);
  const [recheckOpen, setRecheckOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectMoreOpen, setSelectMoreOpen] = useState(false);
  const [selectTimeOpen, setSelectTimeOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAdminOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const openCreditModal = (which: string) => {
    setActivateOpen(false);
    setRecheckOpen(false);
    setCashOpen(false);
    setMoreOpen(false);
    setSelectMoreOpen(false);
    setSelectTimeOpen(false);
    setExtendOpen(false);
    if (which === 'activate') setActivateOpen(true);
    else if (which === 'recheck') setRecheckOpen(true);
    else if (which === 'cash') setCashOpen(true);
    else if (which === 'more') setMoreOpen(true);
    else if (which === 'selectMore') setSelectMoreOpen(true);
    else if (which === 'selectTime') setSelectTimeOpen(true);
    else if (which === 'extend') setExtendOpen(true);
  };

  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const rotateOffer = () => setOffers((prev) => (prev.length > 1 ? [...prev.slice(1), prev[0]] : prev));

  const unlockMoreOptions = () => setOffers(prev => {
    if (!prev.length) return prev;
    const first = prev[0];
    const max = (first.combinations?.length || 1);
    const current = Number(first.enabledCount || 1);
    const next = Math.min(max, current + 1);
    if (next === current) return prev;
    return [{ ...first, enabledCount: next }, ...prev.slice(1)];
  });

  const unlockMoreTime = () => setOffers(prev => {
    if (!prev.length) return prev;
    const first = prev[0];
    const max = (first.schedules?.length || 1);
    const current = Number(first.scheduleEnabledCount || 1);
    const next = Math.min(max, current + 1);
    if (next === current) return prev;
    return [{ ...first, scheduleEnabledCount: next }, ...prev.slice(1)];
  });

  const [dues, setDues] = useState<any[]>([]);

  const cur = offers[0] || null;
  const [selectedComboIdx, setSelectedComboIdx] = useState<number | null>(null);
  const [schedule, setSchedule] = useState("");
  useEffect(() => {
    if (active === "check" && cur) {
      setSelectedComboIdx(0);
      const firstEnabledSchedule = (cur.schedules || [])[0] || "daily";
      setSchedule(firstEnabledSchedule);
    }
  }, [active, cur]);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const addDuesFromCombo = (combo: any, scheduleChoice: string, offerId: string, offerAmount: number) => {
    const intervalDays = scheduleChoice === "daily" ? 1 : scheduleChoice === "weekly" ? 7 : 30;
    const today = new Date();
    const sortedEntries = Object.entries(combo.counts).sort(([a], [b]) => a.localeCompare(b));
    const rows: any[] = [];
    let offset = 0;
    sortedEntries.forEach(([k, v]) => {
      const card = k; const n = Number(v || 0);
      for (let i = 0; i < n; i++) {
        const dueDate = new Date(today); dueDate.setDate(today.getDate() + offset);
        rows.push({
          id: `due-${Date.now()}-${offerId}-${card}-${i}-${Math.random().toString(36).slice(2,6)}`,
          dueDate: dueDate.toISOString().slice(0, 10),
          amount: 0,
          card,
          status: offset === 0 ? "due" : "upcoming",
          offerId,
          offerAmount,
          schedule: scheduleChoice,
        });
        offset += intervalDays;
      }
    });
    setDues((prev) => sortDues([...prev, ...rows]));
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="flex min-h-screen">
        <Sidebar active={active} setActive={setActive} userId={userId} onAdminClick={() => setAdminOpen(true)} isCompact={isCompact} onToggleCompact={toggleCompactMode} />
        <main className="flex-1 bg-white">

          {active === "account" && (
            <div className="max-w-4xl mx-auto p-6 text-center">
              <h1 className="text-4xl font-extrabold">{renderAcronym(Labels.Hi)} {app.user.firstName}</h1>
              <p className="text-neutral-500">{renderAcronym(Labels.Welcome)}</p>
              <div className="h-10" />
              <button className="px-4 py-3 rounded-xl bg-blue-600 text-white font-bold" onClick={() => setAccountOpen(true)}>{renderAcronym(Labels.Account)}</button>

              <Modal open={accountOpen} onClose={() => setAccountOpen(false)} title={Labels.Account.full} width={680}>
                <div className="space-y-1">
                  <div className="font-extrabold text-lg">{app.user.fullName}</div>
                  <div className="text-neutral-600">{renderAcronym(Labels.AccountNumber)} {app.account.number}</div>
                  <div className="text-neutral-600">{renderAcronym(Labels.AccountCurrency)} {app.account.currency}</div>
                </div>
                <div className="mt-4 grid gap-3">
                  <button className="rounded-xl py-3 font-bold bg-green-600 text-white" onClick={() => {
                    setAccountOpen(false);
                    setCashoutOpen(true);
                  }}>{renderAcronym(Labels.AvailableCashOut)}</button>
                  <button className="rounded-xl py-3 font-bold bg-orange-600 text-white" onClick={() => { setAccountOpen(false); setActive("dues"); }}>{renderAcronym(Labels.Dues)}</button>
                  <button className="rounded-xl py-3 font-bold bg-purple-600 text-white" onClick={() => { setAccountOpen(false); setActive("locations"); }}>{renderAcronym(Labels.Locations)}</button>
                </div>
              </Modal>

              <Modal open={cashoutOpen} onClose={() => setCashoutOpen(false)} title={Labels.AvailableCashOut.full} width={680}>
                <div className="space-y-2">
                  <div className="text-5xl font-black text-green-600">{app.account.symbol} {(app.balances.cards + app.balances.collect).toFixed(2)}</div>
                  <div className="text-neutral-600">Cards: {app.account.symbol} {fmt(app.balances.cards)} · Collect: {app.account.symbol} {fmt(app.balances.collect)}</div>
                  <div className="grid gap-3 mt-2">
                    <button className="rounded-xl py-3 font-bold bg-blue-600 text-white">{renderAcronym(Labels.BankTransfer)}</button>
                    <button className="rounded-xl py-3 font-bold bg-purple-600 text-white">{renderAcronym(Labels.MobileWallet)}</button>
                    <button className="rounded-xl py-3 font-bold bg-orange-600 text-white">{renderAcronym(Labels.CashPickup)}</button>
                  </div>
                </div>
              </Modal>
            </div>
          )}

          {active === "cards" && (
            <div className="max-w-4xl mx-auto p-6 text-center">
              <div className="text-6xl font-black">{app.account.symbol} {fmt(app.balances.cards)}</div>
              <div className="h-3" />
              <button className="rounded-xl px-4 py-3 font-bold bg-blue-600 text-white" onClick={() => setActive("cards-recharge")}>{renderAcronym(Labels.RechargeCards)}</button>
            </div>
          )}

          {active === "cards-recharge" && (
            <div className="max-w-3xl mx-auto p-6">
              <h2 className="text-center text-2xl font-extrabold mb-3">Cank</h2>
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                {CARD_KEYS.map((k) => (
                  <button key={k} className={`w-28 h-36 rounded-xl border-2 flex items-center justify-center font-extrabold ${k === "white" ? "bg-neutral-100 text-neutral-800 border-neutral-300" : k === "red" ? "bg-red-500 text-white" : k === "sky" ? "bg-sky-400 text-white" : k === "blue" ? "bg-blue-600 text-white" : k === "silver" ? "bg-neutral-400 text-neutral-900" : k === "gold" ? "bg-amber-500 text-neutral-900" : "bg-neutral-900 text-white"} ${color === k ? "outline outline-2 outline-blue-500 outline-offset-2" : ""}`} onClick={() => setColor(k)}>
                    <div className="text-center">
                      <div className="uppercase text-2xl">{k}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="max-w-lg mx-auto">
                <label className="font-semibold text-sm">Select Card Color:</label>
                <select className="w-full mt-1 rounded-xl border p-2" value={color} onChange={(e) => setColor(e.target.value)}>
                  <option value="">Choose a card color</option>
                  {CARD_KEYS.map((k) => (
                    <option key={k} value={k}>{k.toUpperCase()}</option>
                  ))}
                </select>
                <div className="h-3" />
                <label className="font-semibold text-sm">Number of Cards:</label>
                <select className="w-full mt-1 rounded-xl border p-2" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} card{n > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>

              <div className="text-center rounded-xl border p-3 my-3">
                {color ? `${qty} ${String(color).toUpperCase()} card${qty > 1 ? "s" : ""}` : "—"}
              </div>

              <div className="flex gap-2 justify-center">
                <button className="rounded-xl px-4 py-2" onClick={() => setActive("cards")}>Cancel</button>
                <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white disabled:opacity-50" disabled={!color || qty <= 0} onClick={() => setConfirmOpen(true)}>Recharge</button>
              </div>

              <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Recharge" width={520}>
                <div className="space-y-3">
                  <div className="rounded-xl border p-3">{qty} {String(color).toUpperCase()} card{qty > 1 ? "s" : ""}</div>
                  <div className="flex gap-2 justify-center">
                    <button className="rounded-xl px-4 py-2" onClick={() => setConfirmOpen(false)}>Back</button>
                    <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={async () => {
                      if (!color) return;
                      const total = calculateCardCount(color, qty);
                      const newCardsBalance = Number(app.balances.cards) + total;
                      trackConversion(userId, 'recharge_cards', { color, qty, total });
                      setApp((p) => ({ ...p, balances: { ...p.balances, cards: newCardsBalance } }));
                      setConfirmOpen(false);
                      setSuccessOpen(true);
                    }}>Confirm</button>
                  </div>
                </div>
              </Modal>

              <Modal open={successOpen} onClose={() => { setSuccessOpen(false); setActive("cards"); setColor(""); setQty(1); }} title="Recharge Successful" width={520}>
                <div className="space-y-3">
                  <div className="rounded-xl border p-3">Added {qty} {String(color).toUpperCase()} card{qty > 1 ? "s" : ""}</div>
                  <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={() => { setSuccessOpen(false); setActive("cards"); setColor(""); setQty(1); }}>Back to Cards</button>
                </div>
              </Modal>
            </div>
          )}

          {active === "collect" && (
            <div className="max-w-4xl mx-auto p-6 text-center">
              <div className="text-6xl font-black">{app.account.symbol} {fmt(app.balances.collect)}</div>
              <div className="h-3" />
              <button className="rounded-xl px-4 py-3 font-bold bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed" disabled={!hasOffers} onClick={() => setRecvOpen(true)}>Receivables</button>
              {!hasOffers && <div className="mt-2 text-sm text-neutral-500">No receivables available</div>}

              <Modal open={recvOpen} onClose={() => setRecvOpen(false)} title="Receivables" width={520}>
                <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={() => { setRecvOpen(false); setActive("check"); }}>Check</button>
              </Modal>
            </div>
          )}

          {active === "credit" && (
            <div className="max-w-4xl mx-auto p-6 text-center">
              <h1 className="text-3xl font-extrabold mb-3">{renderAcronym(Labels.Credit)}</h1>
              <button className="rounded-xl px-4 py-3 font-bold bg-blue-600 text-white" onClick={() => openCreditModal('activate')}>Check</button>

              <Modal open={activateOpen} onClose={() => setActivateOpen(false)} title={Labels.ActivateReceivables.full} width={480}>
                <div className="flex gap-2 justify-center">
                  <button className="rounded-xl px-4 py-2 font-bold bg-green-600 text-white" onClick={async () => {
                    await trackModalClick(userId, 'activate', 'accept', userFlowStep);
                    await progressUserFlow(userId, 'accept');
                    setActivateOpen(false);
                    setActive("check");
                  }}>{renderAcronym(Labels.Accept)}</button>
                  <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={async () => {
                    await trackModalClick(userId, 'activate', 'recheck', userFlowStep);
                    await progressUserFlow(userId, 'recheck');
                    const updatedFlow = await getUserFlow(userId);
                    if (updatedFlow) setUserFlowStep(updatedFlow.current_modal_step);
                    openCreditModal('recheck');
                  }}>Recheck</button>
                </div>
              </Modal>

              <Modal open={recheckOpen} onClose={() => setRecheckOpen(false)} title="Re-activate Receivables" width={480}>
                <div className="flex gap-2 justify-center">
                  <button className="rounded-xl px-4 py-2 font-bold bg-green-600 text-white" onClick={async () => {
                    await trackModalClick(userId, 'recheck', 'accept', userFlowStep);
                    await progressUserFlow(userId, 'accept');
                    setRecheckOpen(false);
                    rotateOffer();
                    setActive("check");
                  }}>Accept</button>
                  <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={async () => {
                    await trackModalClick(userId, 'recheck', 'recheck', userFlowStep);
                    await progressUserFlow(userId, 'recheck');
                    const updatedFlow = await getUserFlow(userId);
                    if (updatedFlow) setUserFlowStep(updatedFlow.current_modal_step);
                    openCreditModal('cash');
                  }}>Recheck</button>
                </div>
              </Modal>

              <Modal open={cashOpen} onClose={() => setCashOpen(false)} title="Cash" width={480}>
                <div className="space-y-3">
                  <div className="text-neutral-600">Amount: <span className="font-extrabold">{app.account.symbol} {cashOfferAmount.toFixed(2)}</span></div>
                  <div className="flex gap-2 justify-center">
                    <button className="rounded-xl px-4 py-2 font-bold bg-green-600 text-white" onClick={async () => {
                      if (cashOfferId) {
                        await acceptOffer(cashOfferId);
                        await trackModalClick(userId, 'cash', 'accept', userFlowStep, { amount: cashOfferAmount });
                        await progressUserFlow(userId, 'accept');
                        await loadOffers();
                      }
                      setCashOpen(false);
                      const newCardsBalance = app.balances.cards + cashOfferAmount;
                      setApp(p => ({ ...p, balances: { ...p.balances, cards: newCardsBalance } }));
                      setActive("cards");
                      showToast(`${app.account.symbol} ${cashOfferAmount.toFixed(2)} added to Cards`);
                    }}>Accept</button>
                    <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={async () => {
                      await trackModalClick(userId, 'cash', 'recheck', userFlowStep);
                      await progressUserFlow(userId, 'recheck');
                      const updatedFlow = await getUserFlow(userId);
                      if (updatedFlow) setUserFlowStep(updatedFlow.current_modal_step);
                      openCreditModal('more');
                    }}>Recheck</button>
                  </div>
                </div>
              </Modal>

              <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More Options" width={480}>
                <div className="space-y-3">
                  <div className="text-neutral-600"></div>
                  <div className="flex gap-2 justify-center">
                    <button className="rounded-xl px-4 py-2 font-bold bg-green-600 text-white" onClick={async () => {
                      await trackModalClick(userId, 'more', 'accept', userFlowStep);
                      await progressUserFlow(userId, 'accept');
                      unlockMoreOptions();
                      setMoreOpen(false);
                      setActive('collect');
                      setRecvOpen(true);
                    }}>Accept</button>
                    <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={async () => {
                      await trackModalClick(userId, 'more', 'recheck', userFlowStep);
                      await progressUserFlow(userId, 'recheck');
                      const updatedFlow = await getUserFlow(userId);
                      if (updatedFlow) setUserFlowStep(updatedFlow.current_modal_step);
                      openCreditModal('selectMore');
                    }}>Recheck</button>
                  </div>
                </div>
              </Modal>

              <Modal open={selectMoreOpen} onClose={() => setSelectMoreOpen(false)} title="Select More Options" width={480}>
                <div className="space-y-3">
                  <div className="text-neutral-600"></div>
                  <div className="flex gap-2 justify-center">
                    <button className="rounded-xl px-4 py-2 font-bold bg-green-600 text-white" onClick={async () => {
                      await trackModalClick(userId, 'selectMore', 'accept', userFlowStep);
                      await progressUserFlow(userId, 'accept');
                      unlockMoreOptions();
                      setSelectMoreOpen(false);
                      setActive('collect');
                      setRecvOpen(true);
                    }}>Accept</button>
                    <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={async () => {
                      await trackModalClick(userId, 'selectMore', 'recheck', userFlowStep);
                      await progressUserFlow(userId, 'recheck');
                      const updatedFlow = await getUserFlow(userId);
                      if (updatedFlow) setUserFlowStep(updatedFlow.current_modal_step);
                      openCreditModal('selectTime');
                    }}>Recheck</button>
                  </div>
                </div>
              </Modal>

              <Modal open={selectTimeOpen} onClose={() => setSelectTimeOpen(false)} title="Select More Time" width={480}>
                <div className="space-y-3">
                  <div className="text-neutral-600"></div>
                  <div className="flex gap-2 justify-center">
                    <button className="rounded-xl px-4 py-2 font-bold bg-green-600 text-white" onClick={async () => {
                      await trackModalClick(userId, 'selectTime', 'accept', userFlowStep);
                      await progressUserFlow(userId, 'accept');
                      unlockMoreTime();
                      setSelectTimeOpen(false);
                      setActive('collect');
                      setRecvOpen(true);
                    }}>Accept</button>
                    <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={async () => {
                      await trackModalClick(userId, 'selectTime', 'recheck', userFlowStep);
                      await progressUserFlow(userId, 'recheck');
                      const updatedFlow = await getUserFlow(userId);
                      if (updatedFlow) setUserFlowStep(updatedFlow.current_modal_step);
                      openCreditModal('extend');
                    }}>Recheck</button>
                  </div>
                </div>
              </Modal>

              <Modal open={extendOpen} onClose={() => setExtendOpen(false)} title="Extend Time" width={480}>
                <div className="space-y-3">
                  <div className="text-neutral-600"></div>
                  <div className="flex gap-2 justify-center">
                    <button className="rounded-xl px-4 py-2 font-bold bg-green-600 text-white" onClick={async () => {
                      await trackModalClick(userId, 'extend', 'accept', userFlowStep);
                      await progressUserFlow(userId, 'accept');
                      setExtendOpen(false);
                      setActive('dues');
                    }}>Accept</button>
                    <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={async () => {
                      await trackModalClick(userId, 'extend', 'recheck', userFlowStep);
                      await progressUserFlow(userId, 'recheck');
                      const updatedFlow = await getUserFlow(userId);
                      if (updatedFlow) setUserFlowStep(updatedFlow.current_modal_step);
                      openCreditModal('activate');
                    }}>Recheck</button>
                  </div>
                </div>
              </Modal>
            </div>
          )}

          {active === "check" && (
            <div className="max-w-3xl mx-auto p-6">
              {!cur ? (
                <div className="text-center space-y-3">
                  <div className="text-5xl font-black text-green-600">{app.account.symbol} 0.00</div>
                  <div className="text-neutral-500">No receivables offer available</div>
                  <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={() => setActive("collect")}>{renderAcronym(Labels.Back)}</button>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-6xl font-black text-green-600">{app.account.symbol} {cur.amount.toFixed(2)}</div>
                    <div className="text-neutral-500">Available to collect</div>
                  </div>

                  <div className="font-extrabold mt-4 mb-2">{renderAcronym(Labels.SelectCombo)}</div>
                  <div className="flex flex-col gap-3">
                    {cur.combinations.map((c: any, idx: number) => {
                      const enabled = idx < (cur.enabledCount || 1);
                      return (
                        <button
                          key={c.label}
                          className={`w-full rounded-xl border p-3 flex items-center justify-between ${idx === (selectedComboIdx ?? 0) ? "ring-2 ring-neutral-900" : ""} ${enabled ? "bg-white" : "opacity-50 grayscale cursor-not-allowed"}`}
                          onClick={() => { if (enabled) setSelectedComboIdx(idx); }}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            {Object.entries(c.counts).map(([k, v]) => (
                              <span key={k} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold">
                                <span className="w-5 h-5 rounded-md" style={{ background: k === "white" ? "#f3f4f6" : k === "red" ? "#ef4444" : k === "sky" ? "#22c1f1" : k === "blue" ? "#2563eb" : k === "silver" ? "#9CA3AF" : k === "gold" ? "#D4AF37" : "#111827" }} />
                                {v as number} {k.toUpperCase()}
                              </span>
                            ))}
                          </div>
                          <div className="font-extrabold">{c.label}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="font-extrabold mt-4 mb-2">{renderAcronym(Labels.SelectSchedule)}</div>
                  <div className="grid grid-cols-3 gap-3">
                    {cur.schedules.map((s: string, idx: number) => {
                      const sEnabled = idx < (cur.scheduleEnabledCount || 1);
                      return (
                        <button
                          key={s}
                          className={`rounded-xl border py-6 font-bold ${schedule === s ? "ring-2 ring-neutral-900" : ""} ${sEnabled ? "" : "opacity-50 grayscale cursor-not-allowed"}`}
                          onClick={() => { if (sEnabled) setSchedule(s); }}
                        >
                          {s.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="mt-4 w-full rounded-xl py-3 font-bold bg-green-600 text-white disabled:opacity-50"
                    disabled={selectedComboIdx == null || selectedComboIdx >= (cur.enabledCount || 1) || !schedule}
                    onClick={async () => {
                      const chosen = cur.combinations[selectedComboIdx ?? 0];
                      await acceptOffer(cur.offerId);
                      trackConversion(userId, 'receivables_offer_accept', {
                        offerId: cur.offerId,
                        amount: cur.amount,
                        combination: chosen.label,
                        duration: schedule
                      });
                      const newCollectBalance = app.balances.collect + cur.amount;
                      setApp((p) => ({ ...p, balances: { ...p.balances, collect: newCollectBalance } }));
                      addDuesFromCombo(chosen, schedule, cur.offerId, cur.amount);
                      await loadOffers();
                      setActive("collect");
                      showToast(`${app.account.symbol} ${cur.amount.toFixed(2)} added to Collect`);
                    }}
                  >
                    {renderAcronym(Labels.Accept)}
                  </button>
                </>
              )}
            </div>
          )}

          {active === "dues" && (
            <DuesPage app={app} setActive={setActive} dues={dues} setDues={setDues} />
          )}

          {active === "locations" && (
            <div className="max-w-4xl mx-auto p-6 text-center">
              <h1 className="text-3xl font-extrabold">Locations</h1>
              <button className="mt-3 rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={() => setActive("account")}>Back to Account</button>
            </div>
          )}

          {active === "settings" && (
            <div className="max-w-4xl mx-auto p-6 text-center">
              <h1 className="text-3xl font-extrabold">Settings</h1>
            </div>
          )}

        </main>
      </div>
      <Toast msg={toast} />
      {adminOpen && (
        <AdminPage
          onClose={() => {
            setAdminOpen(false);
            loadOffers();
          }}
        />
      )}
    </div>
  );
}

function DuesPage({ app, setActive, dues, setDues }: { app: any; setActive: (a: string) => void; dues: any[]; setDues: (d: any[]) => void }) {
  const byOffer = dues.reduce((acc: any, d: any) => {
    const key = d.offerId || 'unknown';
    (acc[key] ||= []).push(d);
    return acc;
  }, {});
  const entries = Object.entries(byOffer);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-extrabold">Dues</h1>
        <p className="text-neutral-500 text-sm">Simple timeline, grouped by offer. Tap a group to view details.</p>
      </div>
      {entries.length === 0 ? (
        <div className="text-center text-neutral-500">No dues yet</div>
      ) : (
        <div className="space-y-6">
          {entries.map(([offerId, items]) => {
            const sorted = sortDues(items as any[]);
            const meta = sorted[0] || {};
            const firstDate = new Date(sorted[0]?.dueDate || Date.now());
            return (
              <section key={offerId} className="rounded-2xl border p-4">
                <button className="w-full text-left" onClick={() => setActive('due-details-' + offerId)}>
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold">Offer {meta.offerAmount ? `${app.account.symbol} ${Number(meta.offerAmount).toFixed(2)}` : offerId}</div>
                    <div className="text-xs text-neutral-500">Schedule: {meta.schedule ? String(meta.schedule).toUpperCase() : '—'}</div>
                  </div>
                  <div className="text-xs text-neutral-500">First due: {firstDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div className="mt-3 overflow-x-auto">
                    <div className="flex items-center gap-6 px-1 py-2">
                      {sorted.map((d: any, i: number) => {
                        const dot = d.status === 'paid' ? 'bg-green-600' : d.status === 'overdue' ? 'bg-red-600' : 'bg-blue-600';
                        const tip = new Date(d.dueDate).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
                        const cardLetter = (d.card || '').slice(0,1).toUpperCase();
                        return (
                          <div key={d.id} className="flex flex-col items-center min-w-[48px]">
                            <div className="h-2 w-10 rounded-full bg-neutral-200" />
                            <span title={tip} className={`mt-1 h-3 w-3 rounded-full ${dot}`}></span>
                            <div className="mt-1 text-[10px] text-neutral-500">{i+1}</div>
                            <div className="mt-1 px-2 py-0.5 text-[10px] font-bold rounded border uppercase">{cardLetter}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </button>
              </section>
            );
          })}
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <button className="rounded-xl px-4 py-2 font-bold bg-blue-600 text-white" onClick={() => setActive("account")}>Back to Account</button>
      </div>
    </div>
  );
}

export default App;
