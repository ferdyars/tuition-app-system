import type { NextRequest } from "next/server";
import { getPaymentRequest } from "@/lib/business-logic/payment-request";
import { getStudentSessionFromRequest } from "@/lib/student-auth";

function formatPeriod(period: string): string {
  const periodMap: Record<string, string> = {
    JULY: "Juli",
    AUGUST: "Agustus",
    SEPTEMBER: "September",
    OCTOBER: "Oktober",
    NOVEMBER: "November",
    DECEMBER: "Desember",
    JANUARY: "Januari",
    FEBRUARY: "Februari",
    MARCH: "Maret",
    APRIL: "April",
    MAY: "Mei",
    JUNE: "Juni",
    Q1: "Kuartal 1",
    Q2: "Kuartal 2",
    Q3: "Kuartal 3",
    Q4: "Kuartal 4",
    SEM1: "Semester 1",
    SEM2: "Semester 2",
  };
  return periodMap[period] || period;
}

function formatCurrency(amount: unknown): string {
  return `Rp ${Number(amount).toLocaleString("id-ID")}`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getStudentSessionFromRequest(request);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const payment = await getPaymentRequest(id, session.studentNis);

    if (payment.status !== "VERIFIED") {
      return new Response(
        "Hanya pembayaran yang sudah terverifikasi dapat diunduh",
        { status: 400 },
      );
    }

    const tuitionRows = payment.tuitions
      .map(
        (t) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatPeriod(t.period)} ${t.year}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.className || "-"}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(t.amount)}</td>
      </tr>
    `,
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bukti Pembayaran - ${payment.id.slice(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .header p { color: #666; }
    .success-badge { background: #22c55e; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; font-weight: bold; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { margin-bottom: 8px; }
    .info-label { font-size: 12px; color: #666; }
    .info-value { font-size: 14px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f5f5f5; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; }
    th:last-child { text-align: right; }
    .total-row { background: #f0f9ff; }
    .total-row td { padding: 12px 8px; font-weight: bold; font-size: 16px; }
    .amount-box { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
    .amount-box .label { font-size: 12px; opacity: 0.9; }
    .amount-box .amount { font-size: 28px; font-weight: bold; margin: 5px 0; }
    .amount-box .detail { font-size: 12px; opacity: 0.8; }
    .bank-info { background: #f5f5f5; padding: 15px; border-radius: 8px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Bukti Pembayaran SPP</h1>
    <p>School Tuition System</p>
    <div class="success-badge">✓ PEMBAYARAN BERHASIL</div>
  </div>

  <div class="section">
    <div class="section-title">Informasi Transaksi</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">ID Transaksi</div>
        <div class="info-value">${payment.id}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tanggal Verifikasi</div>
        <div class="info-value">${formatDate(payment.verifiedAt!)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Informasi Siswa</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nama</div>
        <div class="info-value">${payment.student?.name || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">NIS</div>
        <div class="info-value">${payment.student?.nis || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Wali</div>
        <div class="info-value">${payment.student?.parentName || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">No. HP Wali</div>
        <div class="info-value">${payment.student?.parentPhone || "-"}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Detail Tagihan (${payment.tuitions.length} periode)</div>
    <table>
      <thead>
        <tr>
          <th>Periode</th>
          <th>Kelas</th>
          <th>Nominal</th>
        </tr>
      </thead>
      <tbody>
        ${tuitionRows}
        <tr class="total-row">
          <td colspan="2">Total</td>
          <td style="text-align: right;">${formatCurrency(payment.baseAmount)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="amount-box">
    <div class="label">TOTAL TRANSFER</div>
    <div class="amount">${formatCurrency(payment.totalAmount)}</div>
    <div class="detail">${formatCurrency(payment.baseAmount)} + kode unik ${payment.uniqueCode}</div>
  </div>

  ${
    payment.bankAccount
      ? `
  <div class="section">
    <div class="section-title">Rekening Tujuan</div>
    <div class="bank-info">
      <div class="info-item">
        <div class="info-label">Bank</div>
        <div class="info-value">${payment.bankAccount.bankName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">No. Rekening</div>
        <div class="info-value">${payment.bankAccount.accountNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Atas Nama</div>
        <div class="info-value">${payment.bankAccount.accountName}</div>
      </div>
    </div>
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>Dokumen ini dicetak secara otomatis oleh sistem.</p>
    <p>Tanggal cetak: ${formatDate(new Date())}</p>
  </div>

  <div class="no-print" style="margin-top: 20px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
      Cetak / Simpan PDF
    </button>
  </div>
</body>
</html>
`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 },
    );
  }
}
