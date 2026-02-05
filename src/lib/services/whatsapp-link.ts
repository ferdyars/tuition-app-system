/**
 * WhatsApp Link Generator
 * Generates click-to-chat links (wa.me) for manual sending
 * No API needed, free, works on mobile and web
 */

interface WhatsAppLinkParams {
  phone: string;
  message: string;
}

/**
 * Normalize Indonesian phone number to international format
 * 08xx -> 628xx
 */
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("0")) {
    normalized = `62${normalized.substring(1)}`;
  }
  return normalized;
}

/**
 * Generate WhatsApp click-to-chat link
 * Works on both mobile and web
 */
export function generateWhatsAppLink(params: WhatsAppLinkParams): string {
  const { phone, message } = params;
  const normalizedPhone = normalizePhone(phone);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

/**
 * Generate payment verified notification link
 */
export function generatePaymentVerifiedLink(data: {
  parentPhone: string;
  studentName: string;
  month: string;
  year: number;
  amount: number;
}): string {
  const message = `*PEMBAYARAN BERHASIL*

Yth. Orang Tua/Wali dari *${data.studentName}*

Pembayaran SPP bulan *${data.month} ${data.year}* sebesar *Rp ${data.amount.toLocaleString("id-ID")}* telah berhasil diverifikasi.

Terima kasih atas pembayaran Anda.

_Pesan ini dikirim otomatis oleh Sistem SPP Sekolah_`;

  return generateWhatsAppLink({
    phone: data.parentPhone,
    message,
  });
}

/**
 * Generate payment reminder link
 */
export function generatePaymentReminderLink(data: {
  parentPhone: string;
  studentName: string;
  month: string;
  year: number;
  amount: number;
  dueDate: string;
}): string {
  const message = `*PENGINGAT PEMBAYARAN SPP*

Yth. Orang Tua/Wali dari *${data.studentName}*

Mohon segera melakukan pembayaran SPP bulan *${data.month} ${data.year}* sebesar *Rp ${data.amount.toLocaleString("id-ID")}*.

Jatuh tempo: *${data.dueDate}*

Silakan login ke portal siswa untuk melakukan pembayaran.

_Pesan ini dikirim otomatis oleh Sistem SPP Sekolah_`;

  return generateWhatsAppLink({
    phone: data.parentPhone,
    message,
  });
}

/**
 * Generate payment request created link
 */
export function generatePaymentRequestLink(data: {
  parentPhone: string;
  studentName: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  totalAmount: number;
  expiresInMinutes: number;
}): string {
  const message = `*INSTRUKSI PEMBAYARAN SPP*

Yth. Orang Tua/Wali dari *${data.studentName}*

Silakan transfer ke rekening berikut:

Bank: *${data.bankName}*
No. Rekening: *${data.accountNumber}*
Atas Nama: *${data.accountName}*

Jumlah: *Rp ${data.totalAmount.toLocaleString("id-ID")}*

⚠️ *PENTING:* Transfer sesuai nominal di atas (termasuk angka unik). Pembayaran berlaku selama *${data.expiresInMinutes} menit*.

_Pesan ini dikirim otomatis oleh Sistem SPP Sekolah_`;

  return generateWhatsAppLink({
    phone: data.parentPhone,
    message,
  });
}
