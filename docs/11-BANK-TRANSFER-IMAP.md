# Bank Transfer Payment with IMAP Verification

## Purpose

Automatically verify bank transfers by:
1. Generating unique payment amounts (with random Rupiah suffix)
2. Monitoring bank email notifications via IMAP
3. Matching payments by unique amount

---

## Features Overview

| Feature | Description |
|---------|-------------|
| Unique Amount | Random 1-999 suffix for auto-matching |
| Multiple Banks | Support transfer to multiple school bank accounts |
| Flexible Payment | Can change tuition selection (max 2 times) |
| IMAP Verification | Auto-verify via bank email notifications |

---

## Database Schema

```prisma
enum PaymentRequestStatus {
  PENDING       // Waiting for transfer
  EXPIRED       // Payment window expired
  VERIFYING     // Transfer detected, verifying
  VERIFIED      // Payment confirmed
  FAILED        // Verification failed
  CANCELLED     // Cancelled by user
}

model PaymentRequest {
  id               String               @id @default(uuid())
  studentNis       String               @map("student_nis")
  tuitionId        String               @map("tuition_id")

  // Unique amount for matching
  baseAmount       Decimal              @map("base_amount") @db.Decimal(10, 2)
  uniqueCode       Int                  @map("unique_code") // 1-999 (random suffix)
  totalAmount      Decimal              @map("total_amount") @db.Decimal(10, 2)

  // Idempotency
  idempotencyKey   String               @unique @map("idempotency_key")

  // Change tracking (max 2 changes allowed)
  changeCount      Int                  @default(0) @map("change_count")
  changeHistory    Json?                @map("change_history") // Array of previous tuitionIds

  // Timing
  status           PaymentRequestStatus @default(PENDING)
  expiresAt        DateTime             @map("expires_at")
  verifiedAt       DateTime?            @map("verified_at")

  // Selected bank
  bankAccountId    String               @map("bank_account_id")

  // Email tracking
  emailMatchId     String?              @map("email_match_id")

  createdAt        DateTime             @default(now()) @map("created_at")
  updatedAt        DateTime             @updatedAt @map("updated_at")

  // Relations
  student          Student              @relation(fields: [studentNis], references: [nis])
  tuition          Tuition              @relation(fields: [tuitionId], references: [id])
  bankAccount      SchoolBankAccount    @relation(fields: [bankAccountId], references: [id])

  @@index([status])
  @@index([totalAmount])
  @@index([expiresAt])
  @@index([bankAccountId, totalAmount]) // For matching per bank
  @@map("payment_requests")
}

// School's bank accounts (multiple banks supported)
model SchoolBankAccount {
  id              String   @id @default(uuid())
  bankName        String   @map("bank_name")      // e.g., "BCA", "Mandiri"
  bankCode        String   @map("bank_code")      // e.g., "014", "008"
  accountNumber   String   @map("account_number")
  accountName     String   @map("account_name")   // e.g., "YAYASAN SEKOLAH XYZ"

  // Display
  logoUrl         String?  @map("logo_url")
  displayOrder    Int      @default(0) @map("display_order")
  isActive        Boolean  @default(true) @map("is_active")

  // IMAP config for this bank (optional, can use global)
  imapHost        String?  @map("imap_host")
  imapPort        Int?     @map("imap_port")
  imapUser        String?  @map("imap_user")
  imapPassword    String?  @map("imap_password") // Encrypted

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  paymentRequests PaymentRequest[]

  @@unique([bankCode, accountNumber])
  @@index([isActive])
  @@map("school_bank_accounts")
}

model BankEmailLog {
  id               String   @id @default(uuid())
  emailUid         String   @unique @map("email_uid") // IMAP UID
  receivedAt       DateTime @map("received_at")
  fromAddress      String   @map("from_address")
  subject          String
  amount           Decimal? @db.Decimal(10, 2)
  senderName       String?  @map("sender_name")
  senderAccount    String?  @map("sender_account")
  rawContent       String?  @map("raw_content") @db.Text

  // Which bank account received this
  bankAccountId    String?  @map("bank_account_id")

  // Matching
  isMatched        Boolean  @default(false) @map("is_matched")
  matchedRequestId String?  @map("matched_request_id")

  processedAt      DateTime @default(now()) @map("processed_at")

  @@index([amount])
  @@index([isMatched])
  @@index([bankAccountId, amount])
  @@map("bank_email_logs")
}
```

---

## Multiple Bank Accounts

### API: Get Available Banks

```typescript
// GET /api/v1/student/banks

// Response
{
  "success": true,
  "data": {
    "banks": [
      {
        "id": "uuid-1",
        "bankName": "BCA",
        "bankCode": "014",
        "accountNumber": "1234567890",
        "accountName": "YAYASAN SEKOLAH XYZ",
        "logoUrl": "/images/banks/bca.png",
        "displayOrder": 1
      },
      {
        "id": "uuid-2",
        "bankName": "Mandiri",
        "bankCode": "008",
        "accountNumber": "0987654321",
        "accountName": "YAYASAN SEKOLAH XYZ",
        "logoUrl": "/images/banks/mandiri.png",
        "displayOrder": 2
      },
      {
        "id": "uuid-3",
        "bankName": "BNI",
        "bankCode": "009",
        "accountNumber": "1122334455",
        "accountName": "YAYASAN SEKOLAH XYZ",
        "logoUrl": "/images/banks/bni.png",
        "displayOrder": 3
      }
    ]
  }
}
```

### Service: Get Active Banks

```typescript
// src/lib/services/bank-account-service.ts

async function getActiveBankAccounts() {
  return prisma.schoolBankAccount.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      bankName: true,
      bankCode: true,
      accountNumber: true,
      accountName: true,
      logoUrl: true,
      displayOrder: true
    }
  });
}
```

### Frontend: Bank Selection Component

```tsx
// components/BankSelector.tsx

interface Bank {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  logoUrl: string | null;
}

interface BankSelectorProps {
  banks: Bank[];
  selectedBankId: string | null;
  onSelect: (bankId: string) => void;
}

function BankSelector({ banks, selectedBankId, onSelect }: BankSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Pilih Bank Tujuan Transfer</label>
      <div className="grid grid-cols-1 gap-3">
        {banks.map((bank) => (
          <div
            key={bank.id}
            onClick={() => onSelect(bank.id)}
            className={`
              p-4 border rounded-lg cursor-pointer transition-all
              ${selectedBankId === bank.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <div className="flex items-center gap-3">
              {bank.logoUrl && (
                <img
                  src={bank.logoUrl}
                  alt={bank.bankName}
                  className="w-10 h-10 object-contain"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">{bank.bankName}</p>
                <p className="text-sm text-gray-600">{bank.accountNumber}</p>
                <p className="text-xs text-gray-500">{bank.accountName}</p>
              </div>
              {selectedBankId === bank.id && (
                <CheckIcon className="w-5 h-5 text-blue-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Unique Amount Generation

### Concept

Generate unique transfer amounts by adding a random 1-999 suffix:
- Base amount: Rp 500.000
- Unique code: 123
- Total amount: Rp 500.123

This allows automatic matching when the bank sends transfer notification.

### Implementation

```typescript
// src/lib/business-logic/unique-amount-generator.ts

interface UniqueAmountResult {
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
}

/**
 * Generate unique transfer amount
 * Example: Base Rp 500.000 + unique 123 = Rp 500.123
 */
function generateUniqueAmount(baseAmount: number): UniqueAmountResult {
  const uniqueCode = Math.floor(Math.random() * 999) + 1;
  const totalAmount = baseAmount + uniqueCode;

  return {
    baseAmount,
    uniqueCode,
    totalAmount
  };
}

/**
 * Get available unique amount (not used by pending payments for same bank)
 */
async function getAvailableUniqueAmount(
  baseAmount: number,
  bankAccountId: string,
  prisma: PrismaClient
): Promise<UniqueAmountResult> {
  const maxAttempts = 50;

  for (let i = 0; i < maxAttempts; i++) {
    const result = generateUniqueAmount(baseAmount);

    // Check if amount is already pending for this bank
    const existing = await prisma.paymentRequest.findFirst({
      where: {
        bankAccountId,
        totalAmount: result.totalAmount,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    if (!existing) {
      return result;
    }
  }

  throw new Error('Tidak dapat membuat kode unik. Terlalu banyak pembayaran pending.');
}
```

---

## Flexible Payment Change (Max 2 Times)

### Why Allow Changes?

- Student may select wrong tuition period
- Unique amount is already generated and reserved
- No need to create new payment request

### Constraints

- Maximum **2 changes** allowed per payment request
- Can only change while status is `PENDING`
- New tuition must belong to same student
- Change history is tracked for audit

### Implementation

```typescript
// src/lib/services/payment-request-service.ts

const MAX_CHANGE_COUNT = 2;

interface ChangePaymentTuitionInput {
  paymentRequestId: string;
  newTuitionId: string;
  studentNis: string;
}

async function changePaymentTuition(input: ChangePaymentTuitionInput) {
  const { paymentRequestId, newTuitionId, studentNis } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Get current payment request
    const request = await tx.paymentRequest.findUnique({
      where: { id: paymentRequestId },
      include: { tuition: true }
    });

    if (!request) {
      throw new Error('Payment request tidak ditemukan');
    }

    // 2. Validate ownership
    if (request.studentNis !== studentNis) {
      throw new Error('Tidak memiliki akses ke payment request ini');
    }

    // 3. Check status
    if (request.status !== 'PENDING') {
      throw new Error('Hanya dapat mengubah payment request yang masih PENDING');
    }

    // 4. Check change limit
    if (request.changeCount >= MAX_CHANGE_COUNT) {
      throw new Error(`Maksimal perubahan adalah ${MAX_CHANGE_COUNT} kali`);
    }

    // 5. Validate new tuition
    const newTuition = await tx.tuition.findFirst({
      where: {
        id: newTuitionId,
        studentNis: studentNis,
        status: { not: 'PAID' }
      }
    });

    if (!newTuition) {
      throw new Error('Tuition tidak valid atau sudah lunas');
    }

    // 6. Build change history
    const previousHistory = (request.changeHistory as string[]) || [];
    const newHistory = [...previousHistory, request.tuitionId];

    // 7. Update payment request
    const updated = await tx.paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        tuitionId: newTuitionId,
        baseAmount: newTuition.feeAmount.sub(newTuition.paidAmount),
        changeCount: { increment: 1 },
        changeHistory: newHistory
      },
      include: {
        tuition: true,
        bankAccount: true
      }
    });

    return {
      success: true,
      message: `Berhasil mengubah pembayaran. Sisa perubahan: ${MAX_CHANGE_COUNT - updated.changeCount}`,
      data: {
        id: updated.id,
        tuitionId: updated.tuitionId,
        baseAmount: updated.baseAmount,
        uniqueCode: updated.uniqueCode,
        totalAmount: updated.totalAmount,
        changeCount: updated.changeCount,
        remainingChanges: MAX_CHANGE_COUNT - updated.changeCount,
        bankAccount: {
          bankName: updated.bankAccount.bankName,
          accountNumber: updated.bankAccount.accountNumber,
          accountName: updated.bankAccount.accountName
        }
      }
    };
  });
}
```

### API: Change Payment Tuition

```typescript
// PUT /api/v1/student/payment-requests/:id/tuition

// Request
{
  "tuitionId": "new-tuition-uuid"
}

// Response (200)
{
  "success": true,
  "message": "Berhasil mengubah pembayaran. Sisa perubahan: 1",
  "data": {
    "id": "uuid",
    "tuitionId": "new-tuition-uuid",
    "baseAmount": 450000,
    "uniqueCode": 123,
    "totalAmount": 450123,
    "changeCount": 1,
    "remainingChanges": 1,
    "bankAccount": {
      "bankName": "BCA",
      "accountNumber": "1234567890",
      "accountName": "YAYASAN SEKOLAH XYZ"
    }
  }
}

// Response (400) - Max changes reached
{
  "success": false,
  "error": {
    "message": "Maksimal perubahan adalah 2 kali",
    "code": "MAX_CHANGES_REACHED"
  }
}
```

### Frontend: Payment Change UI

```tsx
// components/PaymentRequestDetail.tsx

interface PaymentRequestDetailProps {
  request: PaymentRequest;
  unpaidTuitions: Tuition[];
  onChangeTuition: (tuitionId: string) => void;
}

function PaymentRequestDetail({
  request,
  unpaidTuitions,
  onChangeTuition
}: PaymentRequestDetailProps) {
  const [showChangeModal, setShowChangeModal] = useState(false);
  const canChange = request.status === 'PENDING' && request.remainingChanges > 0;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Amount display */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">Total Transfer</p>
        <p className="text-3xl font-bold text-blue-600">
          Rp {request.totalAmount.toLocaleString('id-ID')}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Rp {request.baseAmount.toLocaleString('id-ID')} + kode unik {request.uniqueCode}
        </p>
      </div>

      {/* Bank info */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="font-medium">{request.bankAccount.bankName}</p>
        <p className="text-lg font-mono">{request.bankAccount.accountNumber}</p>
        <p className="text-sm text-gray-600">a.n. {request.bankAccount.accountName}</p>
      </div>

      {/* Current tuition */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Pembayaran untuk:</p>
            <p className="font-medium">{request.tuition.period} {request.tuition.year}</p>
          </div>

          {canChange && (
            <button
              onClick={() => setShowChangeModal(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Ubah ({request.remainingChanges}x tersisa)
            </button>
          )}
        </div>
      </div>

      {/* Change modal */}
      {showChangeModal && (
        <TuitionChangeModal
          currentTuitionId={request.tuitionId}
          unpaidTuitions={unpaidTuitions}
          onSelect={(tuitionId) => {
            onChangeTuition(tuitionId);
            setShowChangeModal(false);
          }}
          onClose={() => setShowChangeModal(false)}
        />
      )}
    </div>
  );
}
```

---

## IMAP Email Monitoring

### Configuration

```typescript
// src/lib/config/imap-config.ts

interface IMAPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  mailbox: string;
}

function getIMAPConfig(): IMAPConfig {
  return {
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    user: process.env.IMAP_USER!,
    password: process.env.IMAP_PASSWORD!,
    tls: true,
    mailbox: process.env.IMAP_MAILBOX || 'INBOX'
  };
}
```

### Bank Email Patterns

```typescript
// src/lib/services/bank-email-parser.ts

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
    bankCode: '014',
    bankName: 'BCA',
    fromAddressPattern: /klikbca\.com|bca\.co\.id/i,
    amountPattern: /Rp\.?\s*([\d.,]+)/i,
    senderNamePattern: /dari\s+([A-Z\s]+)/i,
    senderAccountPattern: /(\d{10,16})/
  },
  {
    bankCode: '008',
    bankName: 'Mandiri',
    fromAddressPattern: /bankmandiri\.co\.id/i,
    amountPattern: /IDR\s*([\d.,]+)/i,
    senderNamePattern: /Nama Pengirim:\s*(.+)/i,
    senderAccountPattern: /No Rekening:\s*(\d+)/i
  },
  {
    bankCode: '009',
    bankName: 'BNI',
    fromAddressPattern: /bni\.co\.id/i,
    amountPattern: /Rp\.?\s*([\d.,]+)/i,
    senderNamePattern: /Nama:\s*(.+)/i,
    senderAccountPattern: /Rekening:\s*(\d+)/i
  },
  {
    bankCode: '002',
    bankName: 'BRI',
    fromAddressPattern: /bri\.co\.id/i,
    amountPattern: /Rp\.?\s*([\d.,]+)/i,
    senderNamePattern: /Pengirim:\s*(.+)/i,
    senderAccountPattern: /No\.?\s*Rek:\s*(\d+)/i
  }
];

interface ParsedBankEmail {
  bankCode: string | null;
  bankName: string | null;
  amount: number | null;
  senderName: string | null;
  senderAccount: string | null;
}

function parseBankEmail(
  fromAddress: string,
  subject: string,
  body: string
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
        senderAccount: senderAccountMatch ? senderAccountMatch[1] : null
      };
    }
  }

  return {
    bankCode: null,
    bankName: null,
    amount: null,
    senderName: null,
    senderAccount: null
  };
}

function parseAmount(amountStr: string): number {
  // Remove dots (thousand separators) and replace comma with dot
  const cleaned = amountStr.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
}
```

### IMAP Polling Service

```typescript
// src/lib/services/imap-payment-checker.ts

import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';

class IMAPPaymentChecker {
  private imap: Imap;
  private isRunning: boolean = false;

  constructor(config: IMAPConfig) {
    this.imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false }
    });
  }

  async checkNewEmails(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.connect();
      await this.openMailbox();
      const emails = await this.fetchUnseenEmails();

      for (const email of emails) {
        await this.processEmail(email);
      }
    } catch (error) {
      console.error('IMAP check failed:', error);
      // Alert admin
    } finally {
      this.disconnect();
      this.isRunning = false;
    }
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', resolve);
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  private openMailbox(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async fetchUnseenEmails(): Promise<ParsedMail[]> {
    return new Promise((resolve, reject) => {
      this.imap.search(['UNSEEN'], async (err, results) => {
        if (err) return reject(err);
        if (!results.length) return resolve([]);

        const emails: ParsedMail[] = [];
        const fetch = this.imap.fetch(results, { bodies: '' });

        fetch.on('message', (msg) => {
          msg.on('body', async (stream) => {
            const parsed = await simpleParser(stream);
            emails.push(parsed);
          });
        });

        fetch.once('end', () => resolve(emails));
        fetch.once('error', reject);
      });
    });
  }

  private async processEmail(email: ParsedMail): Promise<void> {
    const fromAddress = email.from?.value[0]?.address || '';
    const subject = email.subject || '';
    const body = email.text || '';

    // Parse bank email
    const parsed = parseBankEmail(fromAddress, subject, body);
    if (!parsed.amount || !parsed.bankCode) return;

    // Find matching school bank account
    const bankAccount = await prisma.schoolBankAccount.findFirst({
      where: {
        bankCode: parsed.bankCode,
        isActive: true
      }
    });

    if (!bankAccount) return;

    // Log to database
    const emailLog = await prisma.bankEmailLog.create({
      data: {
        emailUid: email.messageId || crypto.randomUUID(),
        receivedAt: email.date || new Date(),
        fromAddress,
        subject,
        amount: parsed.amount,
        senderName: parsed.senderName,
        senderAccount: parsed.senderAccount,
        bankAccountId: bankAccount.id,
        rawContent: body.substring(0, 5000) // Limit storage
      }
    });

    // Try to match with pending payment for this bank
    const matchedRequest = await prisma.paymentRequest.findFirst({
      where: {
        bankAccountId: bankAccount.id,
        totalAmount: parsed.amount,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'asc' } // FIFO
    });

    if (matchedRequest) {
      await this.verifyPayment(matchedRequest.id, emailLog.id);
    }
  }

  private async verifyPayment(
    requestId: string,
    emailLogId: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Update payment request
      const request = await tx.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
          emailMatchId: emailLogId
        },
        include: {
          tuition: true,
          student: true
        }
      });

      // Update tuition
      const newPaidAmount =
        request.tuition.paidAmount.toNumber() +
        request.baseAmount.toNumber();
      const feeAmount = request.tuition.feeAmount.toNumber();

      const newStatus = newPaidAmount >= feeAmount ? 'PAID' : 'PARTIAL';

      await tx.tuition.update({
        where: { id: request.tuitionId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus
        }
      });

      // Update student's last payment date (for account cleanup)
      await tx.student.update({
        where: { nis: request.studentNis },
        data: { lastPaymentAt: new Date() }
      });

      // Create payment record
      await tx.payment.create({
        data: {
          tuitionId: request.tuitionId,
          employeeId: 'SYSTEM',
          amount: request.baseAmount,
          notes: `Bank transfer verified via IMAP. Request: ${requestId}`
        }
      });

      // Mark email as matched
      await tx.bankEmailLog.update({
        where: { id: emailLogId },
        data: {
          isMatched: true,
          matchedRequestId: requestId
        }
      });
    });

    // Send notification to student (WhatsApp/Email)
    await notifyPaymentVerified(requestId);
  }

  private disconnect(): void {
    try {
      this.imap.end();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}
```

---

## Cron Job Setup

```typescript
// src/lib/cron/payment-checker-cron.ts

import cron from 'node-cron';

// Check emails every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  try {
    const checker = new IMAPPaymentChecker(getIMAPConfig());
    await checker.checkNewEmails();
  } catch (error) {
    console.error('Payment checker cron failed:', error);
  }
});

// Expire pending payments every minute
cron.schedule('* * * * *', async () => {
  try {
    await expirePendingPayments();
  } catch (error) {
    console.error('Expiration cron failed:', error);
  }
});

async function expirePendingPayments(): Promise<void> {
  const result = await prisma.paymentRequest.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() }
    },
    data: {
      status: 'EXPIRED'
    }
  });

  if (result.count > 0) {
    console.log(`Expired ${result.count} payment requests`);
  }
}
```

---

## Environment Variables

```env
# IMAP Configuration (Global/Default)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=bank-notifications@school.com
IMAP_PASSWORD=app-specific-password
IMAP_MAILBOX=INBOX
IMAP_POLL_INTERVAL_SECONDS=30
```

---

## Payment Request API

### Create Payment Request

```typescript
// POST /api/v1/student/payment-requests

// Request
{
  "tuitionId": "uuid",
  "bankAccountId": "uuid",
  "idempotencyKey": "client-generated-uuid" // Optional
}

// Response (201)
{
  "success": true,
  "data": {
    "id": "uuid",
    "baseAmount": 500000,
    "uniqueCode": 123,
    "totalAmount": 500123,
    "changeCount": 0,
    "remainingChanges": 2,
    "expiresAt": "2024-01-15T10:30:00Z",
    "status": "PENDING",
    "bankAccount": {
      "id": "uuid",
      "bankName": "BCA",
      "accountNumber": "1234567890",
      "accountName": "YAYASAN SEKOLAH XYZ",
      "logoUrl": "/images/banks/bca.png"
    }
  }
}
```

### Check Payment Status

```typescript
// GET /api/v1/student/payment-requests/:id

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "VERIFIED", // or PENDING, EXPIRED, CANCELLED
    "totalAmount": 500123,
    "changeCount": 0,
    "remainingChanges": 2,
    "verifiedAt": "2024-01-15T10:25:00Z",
    "tuition": {
      "period": "JANUARY",
      "year": 2024,
      "status": "PAID"
    },
    "bankAccount": {
      "bankName": "BCA",
      "accountNumber": "1234567890"
    }
  }
}
```

### Cancel Payment Request

```typescript
// POST /api/v1/student/payment-requests/:id/cancel

// Response (200)
{
  "success": true,
  "data": {
    "message": "Payment request berhasil dibatalkan"
  }
}
```

---

## Admin: Bank Account Management

### List Bank Accounts

```typescript
// GET /api/v1/admin/bank-accounts

// Response
{
  "success": true,
  "data": {
    "bankAccounts": [
      {
        "id": "uuid",
        "bankName": "BCA",
        "bankCode": "014",
        "accountNumber": "1234567890",
        "accountName": "YAYASAN SEKOLAH XYZ",
        "logoUrl": "/images/banks/bca.png",
        "displayOrder": 1,
        "isActive": true,
        "pendingPayments": 15 // Count of pending payments
      }
    ]
  }
}
```

### Create/Update Bank Account

```typescript
// POST /api/v1/admin/bank-accounts
// PUT /api/v1/admin/bank-accounts/:id

// Request
{
  "bankName": "BCA",
  "bankCode": "014",
  "accountNumber": "1234567890",
  "accountName": "YAYASAN SEKOLAH XYZ",
  "logoUrl": "/images/banks/bca.png",
  "displayOrder": 1,
  "isActive": true
}
```

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Cannot generate unique amount | Return error, suggest retry later |
| Max changes reached | Return error with remaining changes info |
| IMAP connection failed | Log error, alert admin, retry next cycle |
| Email parsing failed | Log email, skip matching |
| Multiple payments match same amount | Use FIFO (first created request) |
| Payment verified after expiry | Create payment record, notify admin |
| Bank account not found | Skip email processing |

---

## Summary

| Feature | Detail |
|---------|--------|
| Multiple Banks | Configurable via `SchoolBankAccount` table |
| Unique Amount | Per-bank uniqueness (same amount OK for different banks) |
| Change Limit | Max 2 changes per payment request |
| IMAP Matching | Match by bank + amount |
| Frontend | Bank selector + change tuition UI |
