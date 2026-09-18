"use client";

import { useState, useEffect } from "react";
import { Coffee, X, QrCode, Heart, Loader2 } from "lucide-react";

const TRAKTEER_URL = "https://trakteer.id/perpus_opera";

export default function TrakteerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeSrc, setQrCodeSrc] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<number>(6000);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  const amounts = [6000, 10000, 15000, 20000, 25000, 30000, 50000, 100000];

  const generateQrCode = async (amount: number) => {
    setIsLoadingQr(true);
    try {
      const res = await fetch(`/api/trakteer-qr?amount=${amount}`);
      const data = await res.json();
      if (data.qrCode) {
        setQrCodeSrc(data.qrCode);
      }
    } catch (e) {
      console.error("Failed to generate QR:", e);
    } finally {
      setIsLoadingQr(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedAmount) {
      generateQrCode(selectedAmount);
    }
  }, [isOpen, selectedAmount]);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-xl transition-all duration-300 ${
          isOpen
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105"
        }`}
        aria-label={isOpen ? "Tutup traktiran" : "Buka traktiran"}
      >
        <Coffee className="w-5 h-5" />
        <span className="hidden sm:block font-medium text-sm">
          {isOpen ? "Tutup" : "Traktir Kopi"}
        </span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Traktir Kopi ☕</p>
                  <p className="text-xs text-amber-100">Web app ini gratis & bebas iklan</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <p className="text-slate-600 text-sm text-center">
              Kopi kecil, server tetap jalan. Dukunganmu berarti banget! 💛
            </p>

            {/* Amount Selection */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Pilih Nominal</p>
              <div className="grid grid-cols-4 gap-2">
                {amounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      selectedAmount === amount
                        ? "bg-amber-500 text-white shadow-md"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {formatRupiah(amount)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Atau Custom</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="6000"
                  step="1000"
                  value={selectedAmount}
                  onChange={(e) => setSelectedAmount(parseInt(e.target.value) || 6000)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Minimal 6000"
                />
                <button
                  onClick={() => generateQrCode(selectedAmount)}
                  disabled={isLoadingQr}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-60 transition-colors"
                >
                  {isLoadingQr ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate QR"}
                </button>
              </div>
            </div>

            {/* QR Code Display */}
            {qrCodeSrc && (
              <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                  QRIS {formatRupiah(selectedAmount)}
                </p>
                <div className="inline-block bg-white p-3 rounded-lg shadow-inner">
                  <img src={qrCodeSrc} alt={`QRIS ${formatRupiah(selectedAmount)}`} className="w-48 h-48" />
                </div>
                <p className="text-xs text-slate-400 mt-2">Scan dengan aplikasi e-wallet/banking</p>
                <a
                  href={`${TRAKTEER_URL}?amount=${selectedAmount}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Heart className="w-3 h-3" /> Buka di Trakteer
                </a>
              </div>
            )}

            {!qrCodeSrc && !isLoadingQr && (
              <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-100">
                <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Pilih nominal & klik "Generate QR"</p>
                <p className="text-xs text-slate-400 mt-1">QR Code akan muncul di sini</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100">
              <a
                href={TRAKTEER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors"
              >
                <Heart className="w-4 h-4 text-red-500" />
                Lihat halaman Trakteer penuh
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </>
  );
}