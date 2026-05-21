'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, AlertCircle, CheckCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '', email: '', whatsapp: '', password: '', confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validateForm = () => {
        const { name, email, password, confirmPassword } = formData;
        if (!name.trim() || !email.trim() || !password) return 'Semua field wajib diisi.';
        if (name.trim().length < 2 || name.trim().length > 50) return 'Nama harus 2-50 karakter.';
        if (!/^[a-zA-Z0-9\s]+$/.test(name.trim())) return 'Nama hanya boleh huruf, angka, dan spasi.';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) return 'Format email tidak valid.';
        if (password.length < 8) return 'Password minimal 8 karakter.';
        if (!/[A-Z]/.test(password)) return 'Password harus mengandung huruf besar.';
        if (!/[0-9]/.test(password)) return 'Password harus mengandung angka.';
        if (password !== confirmPassword) return 'Konfirmasi password tidak cocok.';
        if (formData.whatsapp) {
            const waClean = formData.whatsapp.replace(/\D/g, '');
            if (waClean.length < 10 || waClean.length > 15) return 'Nomor WhatsApp tidak valid.';
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
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = () => {
        const { password } = formData;
        if (!password) return { level: 0, text: '', color: 'bg-muted' };
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        if (score <= 1) return { level: 1, text: 'Lemah', color: 'bg-red-500', textColor: 'text-red-500' };
        if (score === 2) return { level: 2, text: 'Sedang', color: 'bg-amber-500', textColor: 'text-amber-500' };
        if (score === 3) return { level: 3, text: 'Kuat', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
        return { level: 4, text: 'Sangat Kuat', color: 'bg-emerald-400', textColor: 'text-emerald-400' };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <AuthLayout
            title="Buat Akun Baru"
            subtitle="Daftar gratis untuk mulai berbelanja di KingBlox"
        >
            {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            )}

            {success && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6 animate-fade-in">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-500">{success}</p>
                </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Nama Lengkap</label>
                    <Input
                        type="text"
                        name="name"
                        icon={User}
                        required
                        maxLength={50}
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <Input
                        type="email"
                        name="email"
                        icon={Mail}
                        required
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">
                        WhatsApp <span className="text-muted-foreground font-normal">(opsional)</span>
                    </label>
                    <Input
                        type="tel"
                        name="whatsapp"
                        icon={Phone}
                        placeholder="08123456789"
                        value={formData.whatsapp}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Password</label>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            icon={Lock}
                            required
                            placeholder="Min. 8 karakter"
                            value={formData.password}
                            onChange={handleChange}
                            className="pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {formData.password && (
                        <div className="mt-3 space-y-1.5 animate-fade-in">
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4].map(i => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1.5 flex-1 rounded-full transition-all duration-300",
                                            i <= passwordStrength.level ? passwordStrength.color : "bg-muted"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className={cn("text-xs font-semibold", passwordStrength.textColor)}>
                                {passwordStrength.text}
                            </span>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Konfirmasi Password</label>
                    <Input
                        type="password"
                        name="confirmPassword"
                        icon={Lock}
                        required
                        placeholder="Ulangi password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={formData.confirmPassword && formData.password !== formData.confirmPassword ? "Password tidak cocok" : null}
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full mt-6 group"
                >
                    Daftar Sekarang
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-8">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-brand-500 font-semibold hover:underline">
                    Login di sini
                </Link>
            </p>
        </AuthLayout>
    );
}
