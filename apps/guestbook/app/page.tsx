import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Digital Wedding Guestbook
          </h1>
          <p className="text-gray-600">
            Sistem buku tamu digital untuk acara pernikahan
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full btn-primary block text-center py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Login Staff
          </Link>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Silakan login untuk mengakses sistem
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>Roles yang tersedia:</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span>👤 Usher</span>
                <span>Check-in tamu</span>
              </div>
              <div className="flex justify-between">
                <span>🎁 Souvenir</span>
                <span>Kelola souvenir</span>
              </div>
              <div className="flex justify-between">
                <span>🍽️ Snack</span>
                <span>Kelola konsumsi</span>
              </div>
              <div className="flex justify-between">
                <span>⚙️ Admin</span>
                <span>Dashboard & laporan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
