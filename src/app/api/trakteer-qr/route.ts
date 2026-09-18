import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const amount = searchParams.get("amount") || "6000";

  try {
    const trakteerUrl = `https://trakteer.id/perpus_opera/tip?amount=${amount}&quantity=1&step=2`;

    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(trakteerUrl)}`;

    return NextResponse.json({
      qrCode: qrApiUrl,
      url: trakteerUrl,
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Gagal generate QR code" },
      { status: 500 }
    );
  }
}