/**
 * Centralized UI text labels with abbreviation support.
 * Abbreviation rules:
 *   A = Acronym (first letter of each word)
 *   B = First character only
 *   C = Custom human-reviewed token (preferred for uniqueness & readability)
 */

export interface LabelEntry {
  full: string;
  abbr?: {
    A: string;
    B: string;
    C: string;
  };
  protected?: boolean; // If true, do not abbreviate visually
}

export const Labels: Record<string, LabelEntry> = {
  // AdminPage & common
  Loading: {
    full: 'Loading...',
    abbr: { A: 'L', B: 'L', C: 'Loading' },
  },
  LoadingTemplates: {
    full: 'Loading templates...',
    abbr: { A: 'LT', B: 'L', C: 'LoadingTemplates' },
  },
  AdminManageOffers: {
    full: 'Admin - Manage Offers',
    abbr: { A: 'AMO', B: 'A', C: 'AdminOffers' },
  },
  OfferTemplates: {
    full: 'Offer Templates',
    abbr: { A: 'OT', B: 'O', C: 'OfferTemplates' },
  },
  FilterByStatus: {
    full: 'Filter by status:',
    abbr: { A: 'FBS', B: 'F', C: 'FilterStatus' },
  },
  AllOffers: {
    full: 'All Offers',
    abbr: { A: 'AO', B: 'A', C: 'AllOffers' },
  },
  AvailableOnly: {
    full: 'Available Only',
    abbr: { A: 'AO', B: 'A', C: 'AvailableOnly' },
  },
  AcceptedOnly: {
    full: 'Accepted Only',
    abbr: { A: 'AO', B: 'A', C: 'AcceptedOnly' },
  },
  CashOffers: {
    full: 'Cash Offers',
    abbr: { A: 'CO', B: 'C', C: 'CashOffers' },
  },
  ReceivablesOffers: {
    full: 'Receivables Offers',
    abbr: { A: 'RO', B: 'R', C: 'ReceivablesOffers' },
  },
  AddCashOffer: {
    full: 'Add Cash Offer',
    abbr: { A: 'ACO', B: 'A', C: 'AddCash' },
  },
  AddReceivablesOffer: {
    full: 'Add Receivables Offer',
    abbr: { A: 'ARO', B: 'A', C: 'AddReceivables' },
  },
  ManageTemplates: {
    full: 'Manage Templates',
    abbr: { A: 'MT', B: 'M', C: 'ManageTemplates' },
  },
  PreviewTemplates: {
    full: 'Preview Templates',
    abbr: { A: 'PT', B: 'P', C: 'PreviewTemplates' },
  },
  OpenTemplatesPreviewNewTab: {
    full: 'Open templates preview in a new tab',
    abbr: { A: 'OTPINT', B: 'O', C: 'OpenPreview' },
    protected: true, // Tooltip — keep full
  },
  Close: {
    full: 'Close',
    abbr: { A: 'C', B: 'C', C: 'Close' },
    protected: true, // Accessibility
  },
  Combinations: {
    full: 'Combinations',
    abbr: { A: 'C', B: 'C', C: 'Combinations' },
  },
  Schedules: {
    full: 'Schedules',
    abbr: { A: 'S', B: 'S', C: 'Schedules' },
  },
  EnabledCombinations: {
    full: 'Enabled combinations:',
    abbr: { A: 'EC', B: 'E', C: 'EnabledCombos' },
  },
  EnabledSchedules: {
    full: 'Enabled schedules:',
    abbr: { A: 'ES', B: 'E', C: 'EnabledSchedules' },
  },
  ResetToAvailable: {
    full: 'Reset to Available',
    abbr: { A: 'RTA', B: 'R', C: 'ResetAvailable' },
    protected: true, // Tooltip
  },
  Edit: {
    full: 'Edit',
    abbr: { A: 'E', B: 'E', C: 'Edit' },
    protected: true, // Tooltip
  },
  Delete: {
    full: 'Delete',
    abbr: { A: 'D', B: 'D', C: 'Delete' },
    protected: true, // Tooltip
  },
  AssignToUser: {
    full: 'Assign to User',
    abbr: { A: 'ATU', B: 'A', C: 'AssignUser' },
    protected: true, // Tooltip
  },
  NoCashOffers: {
    full: 'No cash offers yet. Click "Add Cash Offer" to create one.',
    abbr: { A: 'NCOY', B: 'N', C: 'NoCashOffers' },
  },
  NoReceivablesOffers: {
    full: 'No offers yet. Click "Add Receivables Offer" to create one.',
    abbr: { A: 'NOY', B: 'N', C: 'NoReceivablesOffers' },
  },
  CreateNewOffer: {
    full: 'Create New Offer',
    abbr: { A: 'CNO', B: 'C', C: 'CreateOffer' },
  },
  EditOffer: {
    full: 'Edit Offer',
    abbr: { A: 'EO', B: 'E', C: 'EditOffer' },
  },
  AmountEGP: {
    full: 'Amount (EGP)',
    abbr: { A: 'AE', B: 'A', C: 'Amount' },
  },
  AddCombination: {
    full: 'Add Combination',
    abbr: { A: 'AC', B: 'A', C: 'AddCombo' },
  },
  PleaseEnterLabel: {
    full: 'Please enter a combination label (e.g., "2W + 1R")',
    abbr: { A: 'PEACL', B: 'P', C: 'EnterLabel' },
    protected: true, // Validation
  },
  PleaseAddCard: {
    full: 'Please add at least one card to the combination',
    abbr: { A: 'PAAALOTC', B: 'P', C: 'AddCard' },
    protected: true, // Validation
  },
  CancelButton: {
    full: 'Cancel',
    abbr: { A: 'C', B: 'C', C: 'Cancel' },
  },
  CreateOfferButton: {
    full: 'Create Offer',
    abbr: { A: 'CO', B: 'C', C: 'CreateOffer' },
  },
  SaveChangesButton: {
    full: 'Save Changes',
    abbr: { A: 'SC', B: 'S', C: 'SaveChanges' },
  },
  SavingButton: {
    full: 'Saving...',
    abbr: { A: 'S', B: 'S', C: 'Saving' },
  },
  PleaseEnterValidAmount: {
    full: 'Please enter a valid amount',
    abbr: { A: 'PEVA', B: 'P', C: 'ValidAmount' },
    protected: true, // Validation
  },
  PleaseAddCombination: {
    full: 'Please add at least one combination',
    abbr: { A: 'PAALOC', B: 'P', C: 'AddComboRequired' },
    protected: true, // Validation
  },
  ErrorSavingOffer: {
    full: 'Error saving offer: ',
    abbr: { A: 'ESO', B: 'E', C: 'ErrorSave' },
    protected: true, // Error message
  },
  ErrorDeletingOffer: {
    full: 'Error deleting offer: ',
    abbr: { A: 'EDO', B: 'E', C: 'ErrorDelete' },
    protected: true, // Error message
  },
  ConfirmDeleteOffer: {
    full: 'Are you sure you want to delete this offer?',
    abbr: { A: 'ASYWTDTO', B: 'A', C: 'ConfirmDelete' },
    protected: true, // Confirmation
  },
  ConfirmResetOffer: {
    full: 'Reset this offer back to available status?',
    abbr: { A: 'RTOBAS', B: 'R', C: 'ConfirmReset' },
    protected: true, // Confirmation
  },
  ConfirmDeleteTemplate: {
    full: 'Are you sure you want to delete this template?',
    abbr: { A: 'ASYWTDTT', B: 'A', C: 'ConfirmDelTemplate' },
    protected: true, // Confirmation
  },

  // Templates Manager
  CashTemplates: {
    full: 'Cash Templates',
    abbr: { A: 'CT', B: 'C', C: 'CashTemplates' },
  },
  ReceivablesTemplates: {
    full: 'Receivables Templates',
    abbr: { A: 'RT', B: 'R', C: 'ReceivablesTemplates' },
  },
  AddCashTemplate: {
    full: 'Add Cash Template',
    abbr: { A: 'ACT', B: 'A', C: 'AddCashTpl' },
  },
  AddReceivablesTemplate: {
    full: 'Add Receivables Template',
    abbr: { A: 'ART', B: 'A', C: 'AddRecTpl' },
  },
  NoCashTemplates: {
    full: 'No cash templates yet. Click "Add Cash Template" to create one.',
    abbr: { A: 'NCTY', B: 'N', C: 'NoCashTemplates' },
  },
  NoReceivablesTemplates: {
    full: 'No receivables templates yet. Click "Add Receivables Template" to create one.',
    abbr: { A: 'NRTY', B: 'N', C: 'NoRecTemplates' },
  },
  TemplateNameLabel: {
    full: 'Template Name',
    abbr: { A: 'TN', B: 'T', C: 'TemplateName' },
  },
  CreateNewTemplate: {
    full: 'Create New Template',
    abbr: { A: 'CNT', B: 'C', C: 'CreateTpl' },
  },
  EditTemplate: {
    full: 'Edit Template',
    abbr: { A: 'ET', B: 'E', C: 'EditTpl' },
  },
  PleaseEnterTemplateName: {
    full: 'Please enter a template name',
    abbr: { A: 'PETN', B: 'P', C: 'EnterName' },
    protected: true, // Validation
  },
  ErrorSavingTemplate: {
    full: 'Error saving template: ',
    abbr: { A: 'EST', B: 'E', C: 'ErrorSaveTpl' },
    protected: true, // Error message
  },
  ErrorDeletingTemplate: {
    full: 'Error deleting template: ',
    abbr: { A: 'EDT', B: 'E', C: 'ErrorDelTpl' },
    protected: true, // Error message
  },
  ErrorAssigningTemplate: {
    full: 'Error assigning template to user',
    abbr: { A: 'EATT', B: 'E', C: 'ErrorAssign' },
    protected: true, // Error message
  },

  // Assignment Dialog
  AssignTemplateToUser: {
    full: 'Assign Template to User',
    abbr: { A: 'ATTU', B: 'A', C: 'AssignTpl' },
  },
  EnterUserID: {
    full: 'Please enter a user ID',
    abbr: { A: 'PEUI', B: 'P', C: 'EnterUserID' },
    protected: true, // Validation
  },
  UserIDLabel: {
    full: 'User ID',
    abbr: { A: 'U', B: 'U', C: 'UserID' },
  },
  AssignButton: {
    full: 'Assign',
    abbr: { A: 'A', B: 'A', C: 'Assign' },
  },
  SuccessfullyAssigned: {
    full: 'Template assigned successfully!',
    abbr: { A: 'TAS', B: 'T', C: 'AssignSuccess' },
  },

  // Color labels (card types)
  ColorRed: {
    full: 'Red',
    abbr: { A: 'R', B: 'R', C: 'RD' },
  },
  ColorWhite: {
    full: 'White',
    abbr: { A: 'W', B: 'W', C: 'WH' },
  },
  ColorSky: {
    full: 'Sky',
    abbr: { A: 'S', B: 'S', C: 'SK' },
  },
  ColorBlue: {
    full: 'Blue',
    abbr: { A: 'B', B: 'B', C: 'BL' },
  },
  ColorBlack: {
    full: 'Black',
    abbr: { A: 'B', B: 'B', C: 'BK' },
  },
  ColorSilver: {
    full: 'Silver',
    abbr: { A: 'S', B: 'S', C: 'SV' },
  },
  ColorGold: {
    full: 'Gold',
    abbr: { A: 'G', B: 'G', C: 'GD' },
  },

  // Backend identifiers (DO NOT ABBREVIATE)
  TypeCash: {
    full: 'cash',
    protected: true, // Backend identifier
  },
  TypeReceivables: {
    full: 'receivables',
    protected: true, // Backend identifier
  },
  StatusAvailable: {
    full: 'available',
    protected: true, // Backend identifier
  },
  StatusAccepted: {
    full: 'accepted',
    protected: true, // Backend identifier
  },
  ScheduleDaily: {
    full: 'daily',
    protected: true, // Backend identifier
  },
  ScheduleWeekly: {
    full: 'weekly',
    protected: true, // Backend identifier
  },
  ScheduleMonthly: {
    full: 'monthly',
    protected: true, // Backend identifier
  },

  // App main pages
  Cank: {
    full: 'Cank',
    abbr: { A: 'C', B: 'C', C: 'Cank' },
  },
  Account: {
    full: 'Account',
    abbr: { A: 'A', B: 'A', C: 'Acct' },
  },
  Cards: {
    full: 'Cards',
    abbr: { A: 'C', B: 'C', C: 'Cards' },
  },
  Collect: {
    full: 'Collect',
    abbr: { A: 'C', B: 'C', C: 'Collect' },
  },
  Credit: {
    full: 'Credit',
    abbr: { A: 'C', B: 'C', C: 'Credit' },
  },
  Settings: {
    full: 'Settings',
    abbr: { A: 'S', B: 'S', C: 'Settings' },
  },
  AdminPanel: {
    full: 'Admin Panel',
    abbr: { A: 'AP', B: 'A', C: 'AdminPanel' },
  },
  ActivateReceivables: {
    full: 'Activate Receivables',
    abbr: { A: 'AR', B: 'A', C: 'ActivateRec' },
  },
  Welcome: {
    full: 'Welcome to Cank',
    abbr: { A: 'WTC', B: 'W', C: 'Welcome' },
  },
  DemoUser: {
    full: 'Demo User',
    abbr: { A: 'DU', B: 'D', C: 'DemoUser' },
  },
  AccountNumber: {
    full: 'Account #',
    abbr: { A: 'A#', B: 'A', C: 'AcctNum' },
  },
  AccountCurrency: {
    full: 'Account Currency:',
    abbr: { A: 'AC', B: 'A', C: 'Currency' },
  },
  AvailableCashOut: {
    full: 'Available Cash-out',
    abbr: { A: 'ACO', B: 'A', C: 'CashOut' },
  },
  Dues: {
    full: 'Dues',
    abbr: { A: 'D', B: 'D', C: 'Dues' },
  },
  Locations: {
    full: 'Locations',
    abbr: { A: 'L', B: 'L', C: 'Locations' },
  },
  BankTransfer: {
    full: 'Bank Transfer',
    abbr: { A: 'BT', B: 'B', C: 'BankTransfer' },
  },
  MobileWallet: {
    full: 'Mobile Wallet',
    abbr: { A: 'MW', B: 'M', C: 'MobileWallet' },
  },
  CashPickup: {
    full: 'Cash Pickup',
    abbr: { A: 'CP', B: 'C', C: 'CashPickup' },
  },
  RechargeCards: {
    full: 'Recharge Cards',
    abbr: { A: 'RC', B: 'R', C: 'RechargeCards' },
  },
  Hi: {
    full: 'Hi',
    abbr: { A: 'H', B: 'H', C: 'Hi' },
  },
  SelectCards: {
    full: 'Select the cards you want to recharge with',
    abbr: { A: 'STCYWTRC', B: 'S', C: 'SelectCards' },
  },
  SelectCombo: {
    full: 'Select a combination and click next',
    abbr: { A: 'SACN', B: 'S', C: 'SelectCombo' },
  },
  SelectSchedule: {
    full: 'Select a schedule',
    abbr: { A: 'SS', B: 'S', C: 'SelectSchedule' },
  },
  Next: {
    full: 'Next',
    abbr: { A: 'N', B: 'N', C: 'Next' },
  },
  Back: {
    full: 'Back',
    abbr: { A: 'B', B: 'B', C: 'Back' },
  },
  Accept: {
    full: 'Accept',
    abbr: { A: 'A', B: 'A', C: 'Accept' },
  },
  Decline: {
    full: 'Decline',
    abbr: { A: 'D', B: 'D', C: 'Decline' },
  },
  OfferAmount: {
    full: 'Offer Amount:',
    abbr: { A: 'OA', B: 'O', C: 'OfferAmt' },
  },
  OfferDetails: {
    full: 'Offer Details',
    abbr: { A: 'OD', B: 'O', C: 'OfferDetails' },
  },
  Repay: {
    full: 'Repay',
    abbr: { A: 'R', B: 'R', C: 'Repay' },
  },
  RecheckReceivables: {
    full: 'Re-activate Receivables',
    abbr: { A: 'RR', B: 'R', C: 'ReactivateRec' },
  },
  Cash: {
    full: 'Cash',
    abbr: { A: 'C', B: 'C', C: 'Cash' },
  },
  MoreOptions: {
    full: 'More Options',
    abbr: { A: 'MO', B: 'M', C: 'MoreOpts' },
  },
  SelectMoreOptions: {
    full: 'Select More Options',
    abbr: { A: 'SMO', B: 'S', C: 'SelectMoreOpts' },
  },
  SelectMoreTime: {
    full: 'Select More Time',
    abbr: { A: 'SMT', B: 'S', C: 'SelectMoreTime' },
  },
  ExtendTime: {
    full: 'Extend Time',
    abbr: { A: 'ET', B: 'E', C: 'ExtendTime' },
  },
};

/**
 * Abbreviate a label entry using the specified rule.
 * If protected flag is set or rule is invalid, returns the full text.
 */
export function abbreviate(
  entry: LabelEntry,
  rule: 'A' | 'B' | 'C' = 'C'
): string {
  if (entry.protected) {
    return entry.full;
  }
  if (!entry.abbr || !entry.abbr[rule]) {
    return entry.full;
  }
  return entry.abbr[rule];
}

/**
 * Get full text for accessibility/tooltips.
 */
export function getFullText(entry: LabelEntry): string {
  return entry.full;
}

/**
 * Runtime toggle: when compactMode is true, abbreviate; otherwise show full text.
 */
let compactMode = true; // DEFAULT: enabled for presentation

export function setCompactMode(enabled: boolean): void {
  compactMode = enabled;
}

export function getCompactMode(): boolean {
  return compactMode;
}

/**
 * Smart render: returns abbreviated or full text based on mode.
 */
export function render(entry: LabelEntry, rule: 'A' | 'B' | 'C' = 'C'): string {
  if (compactMode && !entry.protected) {
    return abbreviate(entry, rule);
  }
  return entry.full;
}

/**
 * Render acronym (rule A) when compactMode is enabled; otherwise show full text.
 * Used for UI-only visible text where abbreviation is desired in compact mode.
 */
export function renderAcronym(entry: LabelEntry): string {
  if (entry.protected) return entry.full;
  if (compactMode) {
    return abbreviate(entry, 'A');
  }
  return entry.full;
}
