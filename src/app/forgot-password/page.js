'use client';

import { useState } from "react";
import Link from 'next/link';
import { Mail, AlertCircle, Send } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Self-hosted SQLite build has no email-reset infrastructure.
        // Direct the user to contact an admin for a manual password reset.
        setInfo(true);
        setLoading(false);
    };

    if (info) {
        return (
            <AuthLayout title="Reset Password" subtitle="Hubungi admin" showBack>
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10 text-brand-500" />
                    </div>
                    <p className="text-muted-foreground mb-8">
                        Reset password otomatis belum tersedia. Silakan hubungi admin
                        untuk reset password akun{' '}
                        <strong className="text-foreground">{email}</strong>.
                    </p>
                    <Link href="/login">
                        <Button variant="primary" size="lg" className="w-full">
                            Kembali ke Login
                        </Button>
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Lupa Password?"
            subtitle="Masukkan email Anda untuk reset password"
            showBack
        >
            <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto lg:mx-0">
                <Mail className="w-7 h-7 text-brand-500" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Email Address</label>
                    <Input
                        type="email"
                        icon={Mail}
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full"
                >
                    <Send className="w-4 h-4" />
                    Kirim Link Reset
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-8">
                Ingat password Anda?{' '}
                <Link href="/login" className="text-brand-500 font-semibold hover:underline">
                    Kembali ke Login
                </Link>
            </p>
        </AuthLayout>
    );
}
