'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    // Client-side validation
    const validateForm = () => {
        const { name, email, password, confirmPassword } = formData;

        if (!name.trim() || !email.trim() || !password) {
            return 'Semua field wajib diisi.';
        }

        if (name.trim().length < 2 || name.trim().length > 50) {
            return 'Nama harus 2-50 karakter.';
        }

        if (!/^[a-zA-Z0-9\s]+$/.test(name.trim())) {
            return 'Nama hanya boleh huruf, angka, dan spasi.';
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) {
            return 'Format email tidak valid.';
        }

        if (password.length < 8) {
            return 'Password minimal 8 karakter.';
        }

        if (!/[A-Z]/.test(password)) {
            return 'Password harus mengandung huruf besar.';
        }

        if (!/[0-9]/.test(password)) {
            return 'Password harus mengandung angka.';
        }

        if (password !== confirmPassword) {
            return 'Konfirmasi password tidak cocok.';
        }

        if (formData.whatsapp) {
            const waClean = formData.whatsapp.replace(/\D/g, '');
            if (waClean.length < 10 || waClean.length > 15) {
                return 'Nomor WhatsApp tidak valid.';
            }
        }

        return null;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    whatsapp: formData.whatsapp
                })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('Akun berhasil dibuat! Mengalihkan ke halaman login...');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                setError(data.message || 'Gagal membuat akun.');
            }
        } catch (err) {
            console.error(err);
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = () => {
        const { password } = formData;
        if (!password) return { level: 0, text: '', color: '' };

        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 1) return { level: 1, text: 'Lemah', color: '#ef4444' };
        if (score === 2) return { level: 2, text: 'Sedang', color: '#f59e0b' };
        if (score === 3) return { level: 3, text: 'Kuat', color: '#22c55e' };
        return { level: 4, text: 'Sangat Kuat', color: '#10b981' };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="min-h-screen bg-[var(--body-bg)] flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="dynamic-card p-8 rounded-xl shadow-lg w-full max-w-md bg-[var(--card-bg)] text-[var(--card-text)]">
                    <h2 className="text-3xl font-bold mb-6 text-center text-[var(--primary-color)]">Buat Akun</h2>
                    <p className="text-center opacity-70 mb-8 text-sm">Daftar untuk mulai berbelanja di KingBlox.</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded mb-4 text-sm text-center">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleRegister}>
                        {/* Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1 text-gray-100">Nama Lengkap</label>
                            <input
                                type="text"
                                name="name"
                                required
                                maxLength={50}
                                className="w-full border border-gray-600 bg-black/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition placeholder-gray-500"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Email */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1 text-gray-100">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full border border-gray-600 bg-black/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition placeholder-gray-500"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* WhatsApp */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1 text-gray-100">
                                WhatsApp <span className="text-gray-500 font-normal">(opsional)</span>
                            </label>
                            <input
                                type="text"
                                name="whatsapp"
                                className="w-full border border-gray-600 bg-black/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition placeholder-gray-500"
                                placeholder="08123456789"
                                value={formData.whatsapp}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-2">
                            <label className="block text-sm font-bold mb-1 text-gray-100">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full border border-gray-600 bg-black/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition placeholder-gray-500"
                                placeholder="Min. 8 karakter, huruf besar & angka"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            {/* Password Strength Bar */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className="h-1 flex-1 rounded-full transition-all"
                                                style={{
                                                    backgroundColor: i <= passwordStrength.level ? passwordStrength.color : '#333'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: passwordStrength.color }}>
                                        {passwordStrength.text}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-1 text-gray-100">Konfirmasi Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                className="w-full border border-gray-600 bg-black/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition placeholder-gray-500"
                                placeholder="Ulangi password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <span className="text-xs text-red-500 mt-1">Password tidak cocok</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--primary-color)] text-white font-bold py-3 rounded-lg hover:bg-[var(--secondary-color)] transition shadow-lg btn-animate disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Memproses...' : 'Daftar Sekarang'}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-700 pt-6 text-center text-sm text-gray-100">
                        Sudah punya akun? <Link href="/login" className="text-[var(--primary-color)] font-bold hover:underline">
                            Login disini
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
