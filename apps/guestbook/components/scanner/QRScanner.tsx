'use client';

/**
 * QR Scanner Component - Placeholder for FASE R3
 * 
 * This will be implemented in FASE R3 with html5-qrcode library
 * For now, this is just a placeholder component
 */

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            QR Scanner
          </h3>
          <p className="text-sm text-gray-600">
            Will be implemented in FASE R3
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Using html5-qrcode library
          </p>
        </div>
      </div>
    </div>
  );
}
