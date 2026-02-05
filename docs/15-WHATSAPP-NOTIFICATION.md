# WhatsApp Notification

## Purpose

Send automatic WhatsApp notifications to students/parents when:
- Payment has been verified
- Payment request is about to expire
- Monthly tuition reminder

---

## Implementation Options

### Option 1: WhatsApp Link (Click-to-Chat)

Generate a link that redirects to WhatsApp with pre-filled message. User clicks to send.

**Pros**: Free, no API needed, simple
**Cons**: Requires manual click, not automatic

### Option 2: WhatsApp Business API (Official)

Use official WhatsApp Business API for automatic sending.

**Pros**: Fully automatic, reliable, official
**Cons**: Requires approval, monthly fees, complex setup

### Option 3: Third-Party Services

Use services like Fonnte, Wablas, or Twilio for sending messages.

**Pros**: Easier setup than official API, automatic
**Cons**: Monthly fees, depends on third party

---

## Option 1: WhatsApp Link Implementation

### Generate WhatsApp Link

```typescript
// src/lib/services/whatsapp-link.ts

interface WhatsAppLinkParams {
  phone: string;
  message: string;
}

/**
 * Generate WhatsApp click-to-chat link
 * Works on both mobile and web
 */
function generateWhatsAppLink(params: WhatsAppLinkParams): string {
  const { phone, message } = params;

  // Normalize phone number (remove non-digits, add country code)
  let normalizedPhone = phone.replace(/\D/g, '');

  // Convert Indonesian format (08xx) to international (628xx)
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '62' + normalizedPhone.substring(1);
  }

  // URL encode the message
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

/**
 * Generate payment verified notification link
 */
function generatePaymentVerifiedLink(data: {
  parentPhone: string;
  studentName: string;
  month: string;
  year: number;
  amount: number;
}): string {
  const message = `*PEMBAYARAN BERHASIL*

Yth. Orang Tua/Wali dari *${data.studentName}*

Pembayaran SPP bulan *${data.month} ${data.year}* sebesar *Rp ${data.amount.toLocaleString('id-ID')}* telah berhasil diverifikasi.

Terima kasih atas pembayaran Anda.

_Pesan ini dikirim otomatis oleh Sistem SPP Sekolah_`;

  return generateWhatsAppLink({
    phone: data.parentPhone,
    message
  });
}

/**
 * Generate payment reminder link
 */
function generatePaymentReminderLink(data: {
  parentPhone: string;
  studentName: string;
  month: string;
  year: number;
  amount: number;
  dueDate: string;
}): string {
  const message = `*PENGINGAT PEMBAYARAN SPP*

Yth. Orang Tua/Wali dari *${data.studentName}*

Mohon segera melakukan pembayaran SPP bulan *${data.month} ${data.year}* sebesar *Rp ${data.amount.toLocaleString('id-ID')}*.

Jatuh tempo: *${data.dueDate}*

Silakan login ke portal siswa untuk melakukan pembayaran.

_Pesan ini dikirim otomatis oleh Sistem SPP Sekolah_`;

  return generateWhatsAppLink({
    phone: data.parentPhone,
    message
  });
}
```

### Frontend: Show WhatsApp Button

```tsx
// components/WhatsAppButton.tsx

interface WhatsAppButtonProps {
  href: string;
  children: React.ReactNode;
}

function WhatsAppButton({ href, children }: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
    >
      <WhatsAppIcon className="w-5 h-5" />
      {children}
    </a>
  );
}

// Usage in payment success page
function PaymentSuccessPage({ paymentData }) {
  const whatsappLink = generatePaymentVerifiedLink({
    parentPhone: paymentData.parentPhone,
    studentName: paymentData.studentName,
    month: paymentData.month,
    year: paymentData.year,
    amount: paymentData.amount
  });

  return (
    <div className="text-center">
      <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
      <h1 className="text-2xl font-bold mt-4">Pembayaran Berhasil!</h1>

      <div className="mt-6">
        <p className="text-gray-600 mb-4">
          Bagikan konfirmasi pembayaran via WhatsApp:
        </p>
        <WhatsAppButton href={whatsappLink}>
          Kirim ke WhatsApp
        </WhatsAppButton>
      </div>
    </div>
  );
}
```

---

## Option 2: WhatsApp Business API

### Setup Requirements

1. Facebook Business Account
2. WhatsApp Business Account
3. Verified Business
4. Phone number for WhatsApp Business
5. Meta Developer Account

### Database Schema

```prisma
model WhatsAppLog {
  id          String   @id @default(uuid())
  phone       String
  messageType String   @map("message_type") // PAYMENT_VERIFIED, REMINDER, etc.
  message     String   @db.Text
  status      String   // PENDING, SENT, DELIVERED, READ, FAILED
  messageId   String?  @map("message_id") // WhatsApp message ID
  errorMessage String? @map("error_message")
  sentAt      DateTime? @map("sent_at")
  deliveredAt DateTime? @map("delivered_at")
  readAt      DateTime? @map("read_at")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([status])
  @@index([phone])
  @@map("whatsapp_logs")
}
```

### Implementation

```typescript
// src/lib/services/whatsapp-api.ts

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
}

class WhatsAppAPI {
  private baseUrl = 'https://graph.facebook.com/v18.0';
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  /**
   * Send text message
   */
  async sendTextMessage(to: string, message: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.normalizePhone(to),
          type: 'text',
          text: { body: message }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send message');
    }

    return data.messages[0].id;
  }

  /**
   * Send template message (pre-approved)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    components: any[]
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.normalizePhone(to),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'id' },
            components
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send message');
    }

    return data.messages[0].id;
  }

  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) {
      normalized = '62' + normalized.substring(1);
    }
    return normalized;
  }
}
```

### Message Templates

Register these templates in WhatsApp Business Manager:

```
Template: payment_verified
Language: Indonesian (id)
Category: UTILITY

Header: PEMBAYARAN BERHASIL
Body: Yth. Orang Tua/Wali dari {{1}},

Pembayaran SPP bulan {{2}} {{3}} sebesar Rp {{4}} telah berhasil diverifikasi.

Terima kasih atas pembayaran Anda.
Footer: Sistem SPP Sekolah
```

```
Template: payment_reminder
Language: Indonesian (id)
Category: UTILITY

Header: PENGINGAT PEMBAYARAN
Body: Yth. Orang Tua/Wali dari {{1}},

Mohon segera melakukan pembayaran SPP bulan {{2}} {{3}} sebesar Rp {{4}}.

Jatuh tempo: {{5}}

Silakan login ke portal siswa untuk melakukan pembayaran.
Footer: Sistem SPP Sekolah
Buttons: [URL] Login Portal | {{url}}
```

### Send Payment Verified Notification

```typescript
// src/lib/services/notification-service.ts

async function notifyPaymentVerified(paymentRequestId: string): Promise<void> {
  const request = await prisma.paymentRequest.findUnique({
    where: { id: paymentRequestId },
    include: {
      studentAccount: {
        include: { student: true }
      },
      tuition: true
    }
  });

  if (!request) return;

  const student = request.studentAccount.student;
  const tuition = request.tuition;

  // Log the notification attempt
  const log = await prisma.whatsAppLog.create({
    data: {
      phone: student.parentPhone,
      messageType: 'PAYMENT_VERIFIED',
      message: JSON.stringify({
        studentName: student.name,
        month: tuition.month,
        year: tuition.year,
        amount: request.baseAmount.toNumber()
      }),
      status: 'PENDING'
    }
  });

  try {
    const wa = new WhatsAppAPI(getWhatsAppConfig());

    const messageId = await wa.sendTemplateMessage(
      student.parentPhone,
      'payment_verified',
      [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: student.name },
            { type: 'text', text: tuition.month },
            { type: 'text', text: tuition.year.toString() },
            { type: 'text', text: request.baseAmount.toNumber().toLocaleString('id-ID') }
          ]
        }
      ]
    );

    // Update log with success
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: {
        status: 'SENT',
        messageId,
        sentAt: new Date()
      }
    });
  } catch (error) {
    // Update log with failure
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message
      }
    });

    console.error('WhatsApp notification failed:', error);
  }
}
```

---

## Option 3: Third-Party Service (Fonnte)

### Why Fonnte?

- Indonesian service, local support
- Simple REST API
- Affordable pricing
- No WhatsApp Business approval needed

### Implementation

```typescript
// src/lib/services/fonnte-whatsapp.ts

interface FonnteConfig {
  apiKey: string;
}

class FonnteWhatsApp {
  private baseUrl = 'https://api.fonnte.com';
  private apiKey: string;

  constructor(config: FonnteConfig) {
    this.apiKey = config.apiKey;
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: this.normalizePhone(to),
        message,
        countryCode: '62'
      })
    });

    const data = await response.json();
    return data.status === true;
  }

  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('62')) {
      normalized = normalized.substring(2);
    }
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1);
    }
    return normalized;
  }
}
```

---

## Environment Variables

```env
# Option 2: WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Option 3: Fonnte
FONNTE_API_KEY=your-fonnte-api-key
```

---

## Notification Triggers

### After Payment Verified

```typescript
// In IMAP payment checker, after verifyPayment()

await notifyPaymentVerified(requestId);
```

### Daily Payment Reminder (Cron)

```typescript
// src/lib/cron/payment-reminder-cron.ts

import cron from 'node-cron';

// Run daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  // Find tuitions due in 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const upcomingDue = await prisma.tuition.findMany({
    where: {
      status: { in: ['UNPAID', 'PARTIAL'] },
      dueDate: {
        gte: new Date(),
        lte: threeDaysFromNow
      }
    },
    include: {
      student: true
    }
  });

  for (const tuition of upcomingDue) {
    await sendPaymentReminder(tuition);
  }
});
```

---

## API Endpoints

### Admin: Resend Notification

```typescript
// POST /api/v1/admin/notifications/resend

// Request
{
  "type": "PAYMENT_VERIFIED",
  "paymentRequestId": "uuid"
}

// Response
{
  "success": true,
  "data": {
    "sent": true,
    "messageId": "wamid.xxx"
  }
}
```

### Admin: View Notification Logs

```typescript
// GET /api/v1/admin/notifications?page=1&limit=10&status=FAILED

// Response
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "phone": "081234567890",
        "messageType": "PAYMENT_VERIFIED",
        "status": "FAILED",
        "errorMessage": "Phone number not on WhatsApp",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

## Recommendation

| Scenario | Recommended Option |
|----------|-------------------|
| MVP / Low budget | Option 1 (WhatsApp Link) |
| Production / Auto notify | Option 3 (Fonnte) |
| Enterprise / Compliance | Option 2 (Official API) |

For this school tuition system, **Option 3 (Fonnte)** is recommended:
- Automatic sending without user action
- Affordable for school budget
- Easy integration
- Indonesian local support
