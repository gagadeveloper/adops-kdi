'use client';

// components/ManageClients.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2, Eye, Plus } from 'lucide-react';

const ManageClientsShipment = ({ clients: initialClients }) => {
  const [clients, setClients] = useState(initialClients || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Jika initialClients tidak diberikan, fetch data clients
    if (!initialClients) {
      fetchClients();
    }
  }, [initialClients]);

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/clients_shipment');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const response = await fetch(`/api/clients_shipment/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete client');
        }

        // Hapus client dari state setelah berhasil dihapus
        setClients(clients.filter(client => client.id !== id));
      } catch (err) {
        console.error('Error deleting client:', err);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <div className="text-center p-6">Loading clients...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-6">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Clients Shipment</h1>
        <Link href="/dashboard/manage-clients/client_shipment/add" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add New Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="text-center p-6 bg-gray-100 rounded-md">
          No clients found. Add a new client to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => router.push(`/dashboard/manage-clients/client_shipment/${client.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/manage-clients/client_shipment/edit?id=${client.id}`)}
                      className="text-yellow-600 hover:text-yellow-800"
                      title="Edit Client"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Client"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageClientsShipment;