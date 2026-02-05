interface BankEmailPattern {
  bankCode: string;
  bankName: string;
  fromAddressPattern: RegExp;
  amountPattern: RegExp;
  senderNamePattern: RegExp;
  senderAccountPattern: RegExp;
}

const BANK_PATTERNS: BankEmailPattern[] = [
  {
    bankCode: "014",
    bankName: "BCA",
    fromAddressPattern: /klikbca\.com|bca\.co\.id/i,
    amountPattern: /Rp\.?\s*([\d.,]+)/i,
    senderNamePattern: /dari\s+([A-Z\s]+)/i,
    senderAccountPattern: /(\d{10,16})/,
  },
  {
    bankCode: "008",
    bankName: "Mandiri",
    fromAddressPattern: /bankmandiri\.co\.id/i,
    amountPattern: /IDR\s*([\d.,]+)/i,
    senderNamePattern: /Nama Pengirim:\s*(.+)/i,
    senderAccountPattern: /No Rekening:\s*(\d+)/i,
  },
  {
    bankCode: "009",
    bankName: "BNI",
    fromAddressPattern: /bni\.co\.id/i,
    amountPattern: /Rp\.?\s*([\d.,]+)/i,
    senderNamePattern: /Nama:\s*(.+)/i,
    senderAccountPattern: /Rekening:\s*(\d+)/i,
  },
  {
    bankCode: "002",
    bankName: "BRI",
    fromAddressPattern: /bri\.co\.id/i,
    amountPattern: /Rp\.?\s*([\d.,]+)/i,
    senderNamePattern: /Pengirim:\s*(.+)/i,
    senderAccountPattern: /No\.?\s*Rek:\s*(\d+)/i,
  },
];

export interface ParsedBankEmail {
  bankCode: string | null;
  bankName: string | null;
  amount: number | null;
  senderName: string | null;
  senderAccount: string | null;
}

function parseAmount(amountStr: string): number {
  // Remove dots (thousand separators) and replace comma with dot
  const cleaned = amountStr.replace(/\./g, "").replace(",", ".");
  return Number.parseFloat(cleaned);
}

export function parseBankEmail(
  fromAddress: string,
  subject: string,
  body: string,
): ParsedBankEmail {
  for (const pattern of BANK_PATTERNS) {
    if (pattern.fromAddressPattern.test(fromAddress)) {
      const content = `${subject} ${body}`;

      const amountMatch = content.match(pattern.amountPattern);
      const senderNameMatch = content.match(pattern.senderNamePattern);
      const senderAccountMatch = content.match(pattern.senderAccountPattern);

      return {
        bankCode: pattern.bankCode,
        bankName: pattern.bankName,
        amount: amountMatch ? parseAmount(amountMatch[1]) : null,
        senderName: senderNameMatch ? senderNameMatch[1].trim() : null,
        senderAccount: senderAccountMatch ? senderAccountMatch[1] : null,
      };
    }
  }

  return {
    bankCode: null,
    bankName: null,
    amount: null,
    senderName: null,
    senderAccount: null,
  };
}

export function getBankPatterns() {
  return BANK_PATTERNS.map((p) => ({
    bankCode: p.bankCode,
    bankName: p.bankName,
  }));
}
