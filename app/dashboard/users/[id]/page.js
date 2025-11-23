'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function UserDetailPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams(); // Ambil ID dari URL

  useEffect(() => {
    if (!id) return;

    const fetchUserDetail = async () => {
      try {
        const response = await fetch(`/api/users/${id}`); // API fetch user detail
        if (!response.ok) throw new Error('User not found');
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [id]);

  if (loading) return <p>Loading user details...</p>;
  if (!user) return <p>User not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">User Detail</h1>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Department:</strong> {user.department}</p>
      <p><strong>Position:</strong> {user.position}</p>
      <p><strong>Role ID:</strong> {user.roleId}</p>
      <p><strong>Status:</strong> {user.status}</p>
      <button onClick={() => router.back()} className="mt-4 bg-gray-600 text-white py-2 px-4 rounded">
        Back
      </button>
    </div>
  );
}
