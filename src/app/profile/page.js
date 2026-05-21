'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { User, Mail, Phone, Lock, Save, ArrowLeft, UserCog, Shield, KeyRound, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { AnimatedBg } from '@/components/ui/animated-bg';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', whatsapp: '', password: '', confirmPassword: ''
    });

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                name: session.user.name || '',
                email: session.user.email || '',
            }));

            const fetchUserData = async () => {
                try {
                    const userRef = doc(db, 'users', session.user.id);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setFormData(prev => ({ ...prev, whatsapp: userSnap.data().whatsapp || '' }));
                    }
                } catch (error) {}
            };
            fetchUserData();
        }
    }, [session, status, router]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Konfirmasi password tidak cocok.');
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
                toast.success('Profil berhasil diperbarui!');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error(data.message || 'Gagal memperbarui profil');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan sistem.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="spinner text-brand-500" />
            </div>
        );
    }

    const userName = formData.name || formData.email?.split('@')[0] || 'User';
    const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="pt-28 pb-20 relative">
                <AnimatedBg variant="orbs" className="opacity-30" />
                <Container size="sm">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight">
                                Edit <span className="gradient-text">Profil</span>
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">Kelola informasi akun kamu</p>
                        </div>
                    </div>

                    {/* Profile Header Card */}
                    <Card variant="glass" padding="lg" className="mb-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="relative flex items-center gap-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-display font-black text-2xl shadow-glow-md">
                                    {initials}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-display font-bold">{userName}</h2>
                                <p className="text-sm text-muted-foreground truncate">{formData.email}</p>
                                <Badge variant="success" className="mt-2">
                                    <Shield className="w-3 h-3" />
                                    Verified Account
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info */}
                        <Card variant="default" padding="lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                    <UserCog className="w-5 h-5 text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-lg">Informasi Pribadi</h3>
                                    <p className="text-xs text-muted-foreground">Data akun yang ditampilkan</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Nama Lengkap</label>
                                    <Input
                                        type="text"
                                        name="name"
                                        icon={User}
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nama lengkap kamu"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Email</label>
                                    <Input
                                        type="email"
                                        name="email"
                                        icon={Mail}
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="name@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">WhatsApp</label>
                                    <Input
                                        type="tel"
                                        name="whatsapp"
                                        icon={Phone}
                                        value={formData.whatsapp}
                                        onChange={handleChange}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Password Section */}
                        <Card variant="default" padding="lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                                    <KeyRound className="w-5 h-5 text-brand-500" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-lg">Ubah Password</h3>
                                    <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin diubah</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Password Baru</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            icon={Lock}
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
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
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Konfirmasi Password Baru</label>
                                    <Input
                                        type="password"
                                        name="confirmPassword"
                                        icon={Lock}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        error={formData.confirmPassword && formData.password !== formData.confirmPassword ? "Password tidak cocok" : null}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={loading}
                            className="w-full group"
                        >
                            <Save className="w-4 h-4" />
                            Simpan Perubahan
                        </Button>
                    </form>
                </Container>
            </main>
            <Footer />
        </div>
    );
}
