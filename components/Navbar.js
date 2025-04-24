'use client';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = 'token=; Max-Age=0; path=/';
        router.push('/login');
    };

    return (
        <nav className="bg-blue-600 p-4 text-white flex justify-between">
            <h1 className="text-xl">SIIS</h1>
            <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded">Logout</button>
        </nav>
    );
}
