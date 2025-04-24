// app/dashboard/manage-clients/client_hantaran/[id]/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

export default function ClientDetailPage({ params }) {
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const clientId = params.id;

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const response = await fetch(`/api/clients_shipment/${clientId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch client details');
        }
        const data = await response.json();
        setClient(data);
      } catch (err) {
        console.error('Error fetching client details:', err);
        setError('Failed to load client details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const response = await fetch(`/api/clients_shipment/${clientId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete client');
        }

        // Redirect to client list after successful deletion
        router.push('/dashboard/manage-clients/client_shipment');
      } catch (err) {
        console.error('Error deleting client:', err);
        alert('Failed to delete client. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading client details...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
        <div className="mt-4">
          <Link href="/dashboard/manage-clients/client_shipment" className="text-blue-600 hover:text-blue-800">
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto p-4">
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">Client not found</div>
        <div className="mt-4">
          <Link href="/dashboard/manage-clients/client_shipment" className="text-blue-600 hover:text-blue-800">
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href="/dashboard/manage-clients/client_shipment" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Link>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-md shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Client Details</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/dashboard/manage-clients/client_shipment/edit?id=${clientId}`)}
              className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-3">
            <div className="text-sm text-gray-500">Company Name</div>
            <div className="text-lg font-medium">{client.name}</div>
          </div>

          <div className="border-b pb-3">
            <div className="text-sm text-gray-500">Phone Number</div>
            <div className="text-lg">{client.phone}</div>
          </div>

          <div className="border-b pb-3">
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-lg">{client.email}</div>
          </div>

          <div className="border-b pb-3">
            <div className="text-sm text-gray-500">Address</div>
            <div className="text-lg">{client.address}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Created At</div>
              <div className="text-md">{new Date(client.created_at).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="text-md">{new Date(client.updated_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}