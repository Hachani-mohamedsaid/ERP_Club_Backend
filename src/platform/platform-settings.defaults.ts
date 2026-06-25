export const EXTENDED_SETTINGS_KEYS = [
  'smtpHost',
  'smtpPort',
  'smtpUser',
  'smtpPassword',
  'smtpSecure',
  'smtpFromName',
  'smtpFromEmail',
  'primaryColor',
  'logoUrl',
  'faviconUrl',
  'tagline',
  'darkModeDefault',
  'storageProvider',
  'maxUploadMb',
  's3Bucket',
  's3Region',
  'cdnUrl',
  'aiProvider',
  'aiModel',
  'aiEnabled',
  'aiMaxTokens',
  'aiApiKey',
  'mfaRequired',
  'sessionTimeoutMin',
  'maxLoginAttempts',
  'ipBlockEnabled',
  'passwordMinLength',
  'requireStrongPassword',
  'stripeEnabled',
  'stripePublicKey',
  'stripeSecretKey',
  'taxRate',
  'invoicePrefix',
  'gracePeriodDays',
  'autoSuspendOnFailure',
] as const;

export const DEFAULT_EXTENDED_SETTINGS: Record<string, unknown> = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: 'noreply@odin.erp.tn',
  smtpPassword: '',
  smtpSecure: true,
  smtpFromName: 'ODIN ERP',
  smtpFromEmail: 'noreply@odin.erp.tn',
  primaryColor: '#FF7A00',
  logoUrl: '',
  faviconUrl: '',
  tagline: 'Intelligence sportive pour clubs professionnels',
  darkModeDefault: true,
  storageProvider: 'local',
  maxUploadMb: 25,
  s3Bucket: '',
  s3Region: 'eu-west-1',
  cdnUrl: '',
  aiProvider: 'openai',
  aiModel: 'gpt-4o-mini',
  aiEnabled: true,
  aiMaxTokens: 4096,
  aiApiKey: '',
  mfaRequired: false,
  sessionTimeoutMin: 480,
  maxLoginAttempts: 5,
  ipBlockEnabled: true,
  passwordMinLength: 8,
  requireStrongPassword: true,
  stripeEnabled: false,
  stripePublicKey: '',
  stripeSecretKey: '',
  taxRate: 19,
  invoicePrefix: 'INV',
  gracePeriodDays: 7,
  autoSuspendOnFailure: true,
};

export function pickExtended(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of EXTENDED_SETTINGS_KEYS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

export function mergeExtended(
  stored: Record<string, unknown> | null | undefined,
  patch?: Record<string, unknown>,
) {
  return { ...DEFAULT_EXTENDED_SETTINGS, ...(stored ?? {}), ...(patch ?? {}) };
}

export function flattenSettings(row: {
  id: string;
  platformName: string;
  platformUrl: string;
  contactEmail: string;
  supportPhone: string;
  timezone: string;
  defaultLanguage: string;
  currency: string;
  maintenanceMode: boolean;
  openRegistration: boolean;
  debugMode: boolean;
  trialDays: number;
  updatedAt: Date;
  extendedSettings?: unknown;
}) {
  const extended = mergeExtended(
    row.extendedSettings as Record<string, unknown> | null,
  );
  return {
    id: row.id,
    platformName: row.platformName,
    platformUrl: row.platformUrl,
    contactEmail: row.contactEmail,
    supportPhone: row.supportPhone,
    timezone: row.timezone,
    defaultLanguage: row.defaultLanguage,
    currency: row.currency,
    maintenanceMode: row.maintenanceMode,
    openRegistration: row.openRegistration,
    debugMode: row.debugMode,
    trialDays: row.trialDays,
    updatedAt: row.updatedAt.toISOString(),
    ...extended,
  };
}

export function fallbackSettingsRow() {
  return flattenSettings({
    id: 'default',
    platformName: 'ODIN ERP',
    platformUrl: 'https://odin.erp.tn',
    contactEmail: 'admin@odin.erp.tn',
    supportPhone: '+216 71 000 000',
    timezone: 'Africa/Tunis',
    defaultLanguage: 'fr',
    currency: 'TND',
    maintenanceMode: false,
    openRegistration: true,
    debugMode: false,
    trialDays: 14,
    updatedAt: new Date(),
    extendedSettings: DEFAULT_EXTENDED_SETTINGS,
  });
}
