export type GiftCardType = 'bank' | 'physical';

export interface BaseGiftCardConfig {
  id: string;
  type: GiftCardType;
}

export interface BankGiftCardConfig extends BaseGiftCardConfig {
  type: 'bank';
  bankName: string;
  logoSrc: string;
  cardBgSrc: string;
  chipSrc: string;
  accountNumber: string;
  accountName: string;
  copyLabel?: string;
  copiedLabel?: string;
}

export interface PhysicalGiftCardConfig extends BaseGiftCardConfig {
  type: 'physical';
  title: string;
  recipientName: string;
  phone?: string;
  addressLines: string[];
  copyLabel?: string;
  copiedLabel?: string;
}

export type GiftCardConfig = BankGiftCardConfig | PhysicalGiftCardConfig;

export type BankGiftCardTemplate = Omit<BankGiftCardConfig, 'accountNumber' | 'accountName'>;
export type PhysicalGiftCardTemplate = Omit<PhysicalGiftCardConfig, 'recipientName' | 'phone' | 'addressLines'>;
export type GiftCardTemplate = BankGiftCardTemplate | PhysicalGiftCardTemplate;

export const bankGiftCardTemplates: Record<string, BankGiftCardTemplate> = {
  mandiri: {
    id: 'mandiri',
    type: 'bank',
    bankName: 'Mandiri',
    logoSrc: 'https://media.kirimkata.com/mandiri.png',
    cardBgSrc: 'https://media.kirimkata.com/card-bg-1024x640.jpeg',
    chipSrc: 'https://media.kirimkata.com/chip-atm.png',
    copyLabel: 'Salin rekening',
    copiedLabel: 'Tersalin',
  },
  Mandiri: {
    id: 'mandiri',
    type: 'bank',
    bankName: 'Mandiri',
    logoSrc: 'https://media.kirimkata.com/mandiri.png',
    cardBgSrc: 'https://media.kirimkata.com/card-bg-1024x640.jpeg',
    chipSrc: 'https://media.kirimkata.com/chip-atm.png',
    copyLabel: 'Salin rekening',
    copiedLabel: 'Tersalin',
  },
  bca: {
    id: 'bca',
    type: 'bank',
    bankName: 'BCA',
    logoSrc: 'https://media.kirimkata.com/bca.png',
    cardBgSrc: 'https://media.kirimkata.com/card-bg-1024x640.jpeg',
    chipSrc: 'https://media.kirimkata.com/chip-atm.png',
    copyLabel: 'Salin rekening',
    copiedLabel: 'Tersalin',
  },
  BCA: {
    id: 'bca',
    type: 'bank',
    bankName: 'BCA',
    logoSrc: 'https://media.kirimkata.com/bca.png',
    cardBgSrc: 'https://media.kirimkata.com/card-bg-1024x640.jpeg',
    chipSrc: 'https://media.kirimkata.com/chip-atm.png',
    copyLabel: 'Salin rekening',
    copiedLabel: 'Tersalin',
  },
};

export const physicalGiftCardTemplates: Record<string, PhysicalGiftCardTemplate> = {
  physical: {
    id: 'physical',
    type: 'physical',
    title: 'Kirim Hadiah Fisik',
    copyLabel: 'Salin Alamat',
    copiedLabel: 'Tersalin',
  },
};

export const giftCardTemplateGroups = {
  bank: bankGiftCardTemplates,
  physical: physicalGiftCardTemplates,
};

const giftCardTemplates: Record<string, GiftCardTemplate> = {
  ...bankGiftCardTemplates,
  ...physicalGiftCardTemplates,
};

export type BankGiftCardTemplateId = keyof typeof bankGiftCardTemplates;
export type PhysicalGiftCardTemplateId = keyof typeof physicalGiftCardTemplates;
export type GiftCardTemplateId = keyof typeof giftCardTemplates;

interface BaseWeddingGiftCardDefinition {
  templateId: GiftCardTemplateId;
  id?: string;
}

export type BankWeddingGiftCardDefinition = BaseWeddingGiftCardDefinition & {
  templateId: BankGiftCardTemplateId;
  accountNumber: string;
  accountName: string;
  copyLabel?: string;
  copiedLabel?: string;
};

export type PhysicalWeddingGiftCardDefinition = BaseWeddingGiftCardDefinition & {
  templateId: PhysicalGiftCardTemplateId;
  recipientName: string;
  phone?: string;
  addressLines: string[];
  title?: string;
  copyLabel?: string;
  copiedLabel?: string;
};

export type WeddingGiftCardDefinition =
  | BankWeddingGiftCardDefinition
  | PhysicalWeddingGiftCardDefinition;

const resolveWeddingGiftCards = (definitions: WeddingGiftCardDefinition[]): GiftCardConfig[] =>
  definitions.map((definition) => {
    const template = giftCardTemplates[definition.templateId];

    if (!template) {
      throw new Error(`Unknown gift card template: ${definition.templateId}`);
    }

    if (template.type === 'bank') {
      const bankDefinition = definition as BankWeddingGiftCardDefinition;
      return {
        ...template,
        id: bankDefinition.id ?? template.id,
        accountNumber: bankDefinition.accountNumber,
        accountName: bankDefinition.accountName,
        copyLabel: bankDefinition.copyLabel ?? template.copyLabel,
        copiedLabel: bankDefinition.copiedLabel ?? template.copiedLabel,
      } satisfies BankGiftCardConfig;
    }

    const physicalDefinition = definition as PhysicalWeddingGiftCardDefinition;

    return {
      ...template,
      id: physicalDefinition.id ?? template.id,
      title: physicalDefinition.title ?? template.title,
      recipientName: physicalDefinition.recipientName,
      phone: physicalDefinition.phone,
      addressLines: physicalDefinition.addressLines,
      copyLabel: physicalDefinition.copyLabel ?? template.copyLabel,
      copiedLabel: physicalDefinition.copiedLabel ?? template.copiedLabel,
    } satisfies PhysicalGiftCardConfig;
  });

export interface WeddingGiftConfig {
  title: string;
  subtitle: string;
  buttonLabel: string;
  giftImageSrc: string;
  /** Opacity overlay hitam di belakang konten (0..1) */
  backgroundOverlayOpacity: number;
  cards: GiftCardConfig[];
}

const baseWeddingGift = {
  title: '[WEDDING_GIFT_TITLE]',
  subtitle: '[WEDDING_GIFT_SUBTITLE]',
  buttonLabel: 'Kirim Hadiah',
  giftImageSrc: '/gift_box.png',
  backgroundOverlayOpacity: 0.55,
  bankAccounts: [],
  physicalGift: {
    recipientName: '[RECIPIENT_NAME]',
    phone: '',
    addressLines: ['[RECIPIENT_ADDRESS]'],
  },
} as const;

// For generic defaults we only define a single physical gift card placeholder.
// All real bank accounts must come from the database.
const defaultWeddingGiftCardDefinitions: WeddingGiftCardDefinition[] = [
  {
    templateId: 'physical',
    recipientName: baseWeddingGift.physicalGift.recipientName,
    phone: baseWeddingGift.physicalGift.phone,
    addressLines: [...baseWeddingGift.physicalGift.addressLines],
  },
];

const defaultWeddingGiftConfig: WeddingGiftConfig = {
  title: baseWeddingGift.title,
  subtitle: baseWeddingGift.subtitle,
  buttonLabel: baseWeddingGift.buttonLabel,
  giftImageSrc: baseWeddingGift.giftImageSrc,
  backgroundOverlayOpacity: baseWeddingGift.backgroundOverlayOpacity,
  cards: resolveWeddingGiftCards(defaultWeddingGiftCardDefinitions),
};

export function getWeddingGiftConfig(): WeddingGiftConfig {
  return defaultWeddingGiftConfig;
}
