'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Search, Users, Package, Coffee, Crown, LogOut } from 'lucide-react';

interface Staff {
  id: string;
  username: string;
  full_name: string;
  can_checkin: boolean;
  can_redeem_souvenir: boolean;
  can_redeem_snack: boolean;
  can_access_vip_lounge: boolean;
  permissions: string[];
}

export default function StaffDashboard() {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('guestbook_token');
    const userType = localStorage.getItem('guestbook_user_type');
    const staffData = localStorage.getItem('guestbook_staff');

    if (!token || userType !== 'staff' || !staffData) {
      router.push('/login');
      return;
    }

    setStaff(JSON.parse(staffData));
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('guestbook_token');
    localStorage.removeItem('guestbook_user_type');
    localStorage.removeItem('guestbook_staff');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Staff</h1>
              <p className="text-sm text-gray-600">Selamat datang, {staff?.full_name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Permission Info */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Akses Anda</h3>
            <div className="flex flex-wrap gap-2">
              {staff?.permissions.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Check-in Card */}
            {staff?.can_checkin && (
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <QrCode className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Check-in Tamu</h3>
                      <p className="text-sm text-gray-500">Scan QR atau cari manual</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guest Search Card */}
            {staff?.can_checkin && (
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Search className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Cari Tamu</h3>
                      <p className="text-sm text-gray-500">Pencarian manual tamu</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Souvenir Card */}
            {staff?.can_redeem_souvenir && (
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Package className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Souvenir</h3>
                      <p className="text-sm text-gray-500">Kelola pembagian souvenir</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Snack Card */}
            {staff?.can_redeem_snack && (
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Coffee className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">Snack</h3>
                      <p className="text-sm text-gray-500">Kelola pembagian snack</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIP Lounge Card */}
            {staff?.can_access_vip_lounge && (
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Crown className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">VIP Lounge</h3>
                      <p className="text-sm text-gray-500">Kelola akses VIP lounge</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guest List Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Daftar Tamu</h3>
                    <p className="text-sm text-gray-500">Lihat semua tamu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistik Hari Ini</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">-</div>
                <div className="text-sm text-gray-500">Total Check-in</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">-</div>
                <div className="text-sm text-gray-500">Souvenir Dibagikan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">-</div>
                <div className="text-sm text-gray-500">Snack Dibagikan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">-</div>
                <div className="text-sm text-gray-500">VIP Lounge Access</div>
              </div>
            </div>
          </div>

          {/* No Permissions Message */}
          {(!staff?.can_checkin && !staff?.can_redeem_souvenir && !staff?.can_redeem_snack && !staff?.can_access_vip_lounge) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Tidak Ada Permission
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Anda belum memiliki permission untuk mengakses fitur guestbook. 
                      Silakan hubungi client owner untuk mengatur permission Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
