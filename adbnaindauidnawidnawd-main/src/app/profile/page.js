'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { UserCog } from 'lucide-react';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name || '',
                email: session.user.email || '',
            }));

            // Fetch WhatsApp from Firestore
            const fetchUserData = async () => {
                try {
                    const userRef = doc(db, 'users', session.user.id);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setFormData(prev => ({
                            ...prev,
                            whatsapp: userSnap.data().whatsapp || ''
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            };

            fetchUserData();
        }
    }, [session, status, router]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            alert('Konfirmasi password tidak cocok.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    whatsapp: formData.whatsapp,
                    password: formData.password || undefined
                })
            });

            const data = await res.json();

            if (data.success) {
                alert('Profil berhasil diperbarui!');
                window.location.reload();
            } else {
                alert(data.message || 'Gagal memperbarui profil');
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan sistem.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[var(--body-bg)] flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--body-bg)] flex flex-col">
            <Navbar />

            <div className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full">
                <div className="bg-[var(--card-bg)] text-[var(--card-text)] rounded-xl shadow-lg p-8 border border-gray-700">
                    <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                        <UserCog className="w-8 h-8 text-[var(--primary-color)]" />
                        Edit Profil
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-200 mb-2">Nama Lengkap</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <div>
                                <label className="block text-sm font-bold text-gray-200 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* WhatsApp */}
                        <div>
                            <div>
                                <label className="block text-sm font-bold text-gray-200 mb-2">WhatsApp</label>
                                <input
                                    type="text"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4 mt-6">
                            <p className="text-sm text-gray-400 mb-4 italic">Biarkan kosong jika tidak ingin mengubah password.</p>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-bold text-gray-200 mb-2">Password Baru</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none placeholder-gray-500"
                                    placeholder="********"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="mt-4">
                                <label className="block text-sm font-bold text-gray-200 mb-2">Konfirmasi Password Baru</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none placeholder-gray-500"
                                    placeholder="********"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--primary-color)] text-white font-bold py-3 rounded-lg hover:bg-[var(--secondary-color)] transition shadow-md mt-6 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
