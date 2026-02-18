'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InvitationAPI } from '@/lib/api/client';

interface DashboardStats {
    totalOrders: number;
    pendingOrders: number;
    activeInvitations: number;
    unpaidInvoices: number;
}

interface RecentOrder {
    id: string;
    orderNumber: string;
    title: string;
    totalAmount: number;
    orderStatus: string;
    createdAt: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalOrders: 0,
        pendingOrders: 0,
        activeInvitations: 0,
        unpaidInvoices: 0,
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const token = localStorage.getItem('token') || '';

            // Load orders
            const ordersRes = await InvitationAPI.getOrders(token);
            if (ordersRes.success) {
                const orders = ordersRes.data;
                setRecentOrders(orders.slice(0, 5)); // Show 5 most recent

                setStats(prev => ({
                    ...prev,
                    totalOrders: orders.length,
                    pendingOrders: orders.filter((o: any) => o.orderStatus === 'pending').length,
                }));
            }

            // Load invoices
            const invoicesRes = await InvitationAPI.getInvoices(token);
            if (invoicesRes.success) {
                const unpaid = invoicesRes.data.filter((inv: any) => inv.paymentStatus === 'unpaid');
                setStats(prev => ({ ...prev, unpaidInvoices: unpaid.length }));
            }

            // Load invitations (existing endpoint)
            const invitationsRes = await InvitationAPI.getEvents(token);
            if (invitationsRes.success) {
                setStats(prev => ({
                    ...prev,
                    activeInvitations: invitationsRes.data?.length || 0
                }));
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'text-yellow-600',
            verified: 'text-green-600',
            rejected: 'text-red-600',
            cancelled: 'text-gray-600',
        };
        return colors[status] || 'text-gray-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link href="/admin-kirimkata/pesanan">
                    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Pesanan</p>
                                <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/admin-kirimkata/pesanan">
                    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Pesanan Pending</p>
                                <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.pendingOrders}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Undangan Aktif</p>
                            <p className="text-3xl font-bold mt-2 text-green-600">{stats.activeInvitations}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <Link href="/admin-kirimkata/invoice?status=unpaid">
                    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Invoice Belum Dibayar</p>
                                <p className="text-3xl font-bold mt-2 text-red-600">{stats.unpaidInvoices}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/admin-kirimkata/pesanan/buat">
                        <button className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Buat Pesanan Baru
                        </button>
                    </Link>

                    <Link href="/admin-kirimkata/pesanan">
                        <button className="w-full px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Lihat Semua Pesanan
                        </button>
                    </Link>

                    <Link href="/admin-kirimkata/invoice">
                        <button className="w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Lihat Invoice
                        </button>
                    </Link>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Pesanan Terbaru</h2>
                    <Link href="/admin-kirimkata/pesanan" className="text-blue-600 hover:text-blue-800 text-sm">
                        Lihat Semua →
                    </Link>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>Belum ada pesanan</p>
                        <Link href="/admin-kirimkata/pesanan/buat">
                            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Buat Pesanan Pertama
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentOrders.map((order) => (
                            <Link key={order.id} href={`/admin-kirimkata/pesanan/${order.id}`}>
                                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <div>
                                        <p className="font-medium">{order.title}</p>
                                        <p className="text-sm text-gray-500">#{order.orderNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                                        <p className={`text-sm ${getStatusColor(order.orderStatus)}`}>
                                            {order.orderStatus}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
