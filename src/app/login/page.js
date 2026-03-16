'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!auth) {
            setError("Authentication service not configured (missing env vars).");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            const result = await signIn("credentials", {
                redirect: false,
                idToken,
            });

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError("Email atau Password salah!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--body-bg)] flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="dynamic-card p-8 rounded-xl shadow-lg w-full max-w-md bg-[var(--card-bg)] text-[var(--card-text)]">
                    <h2 className="text-3xl font-bold mb-6 text-center text-[var(--primary-color)]">Selamat Datang</h2>
                    <p className="text-center opacity-70 mb-8 text-sm">Silakan login untuk mengakses akun Anda.</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1 text-gray-100">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full border border-gray-600 bg-black/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition placeholder-gray-500"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="mb-2">
                            <label className="block text-sm font-bold mb-1 text-gray-100">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full border border-gray-600 bg-black/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] outline-none transition placeholder-gray-500"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="text-right mb-6">
                            <Link href="/forgot-password" className="text-xs text-[var(--primary-color)] font-bold hover:underline">
                                Lupa Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--primary-color)] text-white font-bold py-3 rounded-lg hover:bg-[var(--secondary-color)] transition shadow-lg btn-animate disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Memproses..." : "Masuk Sekarang"}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-gray-700 pt-6 text-center text-sm text-gray-100">
                        Belum punya akun? <Link href="/register" className="text-[var(--primary-color)] font-bold hover:underline">
                            Daftar disini
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
