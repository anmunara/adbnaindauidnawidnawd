'use client';

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from 'next/link';
import { Mail, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        if (!auth) {
            setError("Authentication service not configured.");
            setLoading(false);
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                setError("Email tidak ditemukan.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Format email tidak valid.");
            } else {
                setError("Terjadi kesalahan. Silakan coba lagi.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout title="Email Terkirim!" subtitle="Periksa kotak masuk Anda" showBack>
                <div className="text-center py-4">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-scale-in">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <p className="text-muted-foreground mb-8">
                        Kami telah mengirimkan link reset password ke{' '}
                        <strong className="text-foreground">{email}</strong>.
                        Cek inbox atau folder spam Anda.
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

            {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            )}

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
