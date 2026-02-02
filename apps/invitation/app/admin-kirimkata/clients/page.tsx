```javascript
'use client';

import { useCallback, useEffect, useState } from 'react';
import QuotaEditModal from './components/QuotaEditModal';
import { API_ENDPOINTS } from '@/lib/api-config';

interface Client {
    id: string;
    username: string;
    email: string | null;
    slug: string | null;
    quota_photos: number;
    quota_music: number;
    quota_videos: number;
    created_at: string;
    updated_at: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [availableSlugs, setAvailableSlugs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQuotaModal, setShowQuotaModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editingQuotaClient, setEditingQuotaClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        slug: '',
    });
    const [error, setError] = useState('');

    const getAuthHeaders = () => {
        const token = localStorage.getItem('admin_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ token } `,
        };
    };

    const fetchClients = useCallback(async () => {
        try {
            const response = await fetch(API_ENDPOINTS.admin.clients, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setClients(data.clients);
            }
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAvailableSlugs = useCallback(async () => {
        try {
            const response = await fetch(API_ENDPOINTS.admin.slugs, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setAvailableSlugs(data.slugs);
            }
        } catch (err) {
            console.error('Error fetching slugs:', err);
        }
    }, []);

    useEffect(() => {
        fetchClients();
        fetchAvailableSlugs();
    }, [fetchClients, fetchAvailableSlugs]);

    const handleOpenModal = (client?: Client) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                username: client.username,
                password: '',
                email: client.email || '',
                slug: client.slug || '',
            });
        } else {
            setEditingClient(null);
            setFormData({
                username: '',
                password: '',
                email: '',
                slug: '',
            });
        }
        setError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingClient(null);
        setFormData({
            username: '',
            password: '',
            email: '',
            slug: '',
        });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const url = API_ENDPOINTS.admin.clients;
            const method = editingClient ? 'PUT' : 'POST';
            const body = editingClient
                ? { id: editingClient.id, ...formData }
                : formData;

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Operation failed');
                return;
            }

            handleCloseModal();
            fetchClients();
            fetchAvailableSlugs();
        } catch (err) {
            setError('An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this client?')) {
            return;
        }

        try {
            const response = await fetch(`${ API_ENDPOINTS.admin.clients }?id = ${ id } `, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (data.success) {
                fetchClients();
                fetchAvailableSlugs();
            }
        } catch (err) {
            console.error('Error deleting client:', err);
        }
    };

    const handleOpenQuotaModal = (client: Client) => {
        setEditingQuotaClient(client);
        setShowQuotaModal(true);
    };

    const handleCloseQuotaModal = () => {
        setShowQuotaModal(false);
        setEditingQuotaClient(null);
    };

    const handleQuotaSuccess = () => {
        fetchClients();
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                Loading...
            </div>
        );
    }

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
            }}>
                <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: 0,
                }}>
                    Client Management
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontFamily: 'Segoe UI, sans-serif',
                    }}
                >
                    + Add Client
                </button>
            </div>

            {/* Clients Table */}
            <div className="table-container">
                <table className="clients-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Slug</th>
                            <th>📸 Photos</th>
                            <th>🎵 Music</th>
                            <th>🎬 Videos</th>
                            <th>Created</th>
                            <th className="actions-col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="empty-state">
                                    No clients found. Click &ldquo;Add Client&rdquo; to create one.
                                </td>
                            </tr>
                        ) : (
                            clients.map((client) => (
                                <tr key={client.id}>
                                    <td className="username-col">{client.username}</td>
                                    <td className="email-col">{client.email || '-'}</td>
                                    <td className="slug-col">{client.slug || '-'}</td>
                                    <td className="quota-col">{client.quota_photos || 0}</td>
                                    <td className="quota-col">{client.quota_music || 0}</td>
                                    <td className="quota-col">{client.quota_videos || 0}</td>
                                    <td className="date-col">
                                        {new Date(client.created_at).toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: '2-digit'
                                        })}
                                    </td>
                                    <td className="actions-col">
                                        <button
                                            onClick={() => handleOpenQuotaModal(client)}
                                            className="btn-quota"
                                            title="Edit Quota"
                                        >
                                            Quota
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(client)}
                                            className="btn-edit"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client.id)}
                                            className="btn-delete"
                                        >
                                            Del
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
    .table - container {
    background - color: white;
    border - radius: 0.5rem;
    box - shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow - x: auto;
    -webkit - overflow - scrolling: touch;
}

                .clients - table {
    width: 100 %;
    border - collapse: collapse;
    min - width: 600px;
}

                .clients - table thead {
    background - color: #f9fafb;
}

                .clients - table th {
    padding: 1rem;
    text - align: left;
    font - weight: 600;
    color: #374151;
    white - space: nowrap;
}

                .clients - table th.actions - col {
    text - align: right;
}

                .clients - table td {
    padding: 1rem;
    color: #6b7280;
    border - top: 1px solid #e5e7eb;
}

                .clients - table td.username - col {
    color: #111827;
    font - weight: 500;
}

                .clients - table td.empty - state {
    padding: 2rem;
    text - align: center;
    color: #6b7280;
}

                .clients - table td.actions - col {
    text - align: right;
    white - space: nowrap;
}

                .quota - col {
    text - align: center;
    font - weight: 600;
    color: #3b82f6;
}

                .btn - quota,
                .btn - edit,
                .btn - delete {
        padding: 0.5rem 1rem;
        color: white;
        border: none;
        border- radius: 0.25rem;
cursor: pointer;
font - family: 'Segoe UI', sans - serif;
font - size: 0.875rem;
transition: all 0.2s ease;
                }

                .btn - quota {
    background - color: #10b981;
    margin - right: 0.5rem;
}

                .btn - quota:hover {
    background - color: #059669;
}

                .btn - edit {
    background - color: #3b82f6;
    margin - right: 0.5rem;
}

                .btn - edit:hover {
    background - color: #2563eb;
}

                .btn - delete {
    background- color: #dc2626;
                }

                .btn - delete:hover {
    background - color: #b91c1c;
}

/* Mobile Responsive */
@media(max - width: 767px) {
                    .clients - table {
        min - width: 100 %;
        font - size: 0.75rem;
    }

                    .clients - table th,
                    .clients - table td {
        padding: 0.5rem 0.375rem;
    }

                    .clients - table th {
        font - size: 0.7rem;
    }

                    .username - col {
        max - width: 80px;
        overflow: hidden;
        text - overflow: ellipsis;
        white - space: nowrap;
    }

                    .email - col {
        max - width: 100px;
        overflow: hidden;
        text - overflow: ellipsis;
        white - space: nowrap;
    }

                    .slug - col {
        max - width: 80px;
        overflow: hidden;
        text - overflow: ellipsis;
        white - space: nowrap;
    }

                    .date - col {
        font - size: 0.7rem;
    }

                    .btn - quota,
                    .btn - edit,
                    .btn - delete {
            padding: 0.375rem 0.5rem;
            font- size: 0.7rem;
    margin - right: 0.25rem;
}

                    .btn - delete {
    margin- right: 0;
                    }
                }

/* Tablet */
@media(min - width: 768px) and(max - width: 1023px) {
                    .clients - table {
        font - size: 0.875rem;
    }

                    .clients - table th,
                    .clients - table td {
        padding: 0.75rem 0.5rem;
    }
}
`}</style>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '1.5rem',
                            color: '#111827',
                        }}>
                            {editingClient ? 'Edit Client' : 'Add New Client'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '0.5rem',
                                }}>
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '0.5rem',
                                }}>
                                    Password {editingClient ? '(leave blank to keep current)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingClient}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '0.5rem',
                                }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#374151',
                                    marginBottom: '0.5rem',
                                }}>
                                    Assign Slug
                                </label>
                                <select
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    <option value="">-- No Slug --</option>
                                    {editingClient?.slug && !availableSlugs.includes(editingClient.slug) && (
                                        <option value={editingClient.slug}>{editingClient.slug} (current)</option>
                                    )}
                                    {availableSlugs.map((slug) => (
                                        <option key={slug} value={slug}>{slug}</option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    marginBottom: '1rem',
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: '#e5e7eb',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    {editingClient ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quota Edit Modal */}
            <QuotaEditModal
                isOpen={showQuotaModal}
                onClose={handleCloseQuotaModal}
                client={editingQuotaClient}
                onSuccess={handleQuotaSuccess}
            />
        </div>
    );
}
