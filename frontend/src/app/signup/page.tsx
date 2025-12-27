"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const passwordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strength = passwordStrength(password);
    const strengthColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-500"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน");
            return;
        }

        if (password.length < 6) {
            setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("ไม่สามารถสร้างบัญชีได้");
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        await signIn("google", { callbackUrl: "/dashboard" });
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-8 relative">
            {/* Background */}
            <div className="page-bg" />

            {/* Floating Orbs */}
            <div className="fixed top-1/3 right-1/4 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-[128px] animate-float" />
            <div className="fixed bottom-1/3 left-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-[128px] animate-float" style={{ animationDelay: '3s' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm">กลับหน้าหลัก</span>
                </Link>

                <div className="glass-card p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                                <img src="/icon-192.png" alt="MangaTrans" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">MangaTrans</span>
                        </Link>
                        <h1 className="text-2xl font-bold mb-2">สร้างบัญชีใหม่</h1>
                        <p className="text-white/40">เริ่มอ่านมังงะฟรีวันนี้</p>
                    </div>

                    {/* Google Signup */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        สมัครด้วย Google
                    </motion.button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-sm">หรือ</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                                <User className="w-4 h-4" />
                                ชื่อแสดง
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="premium-input"
                                placeholder="ชื่อของคุณ"
                                required
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                                <Mail className="w-4 h-4" />
                                อีเมล
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="premium-input"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                                <Lock className="w-4 h-4" />
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="premium-input pr-14"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {password && (
                                <div className="mt-3">
                                    <div className="flex gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : "bg-white/10"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-white/60 mb-2">
                                <Check className="w-4 h-4" />
                                ยืนยันรหัสผ่าน
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`premium-input ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : confirmPassword && password === confirmPassword ? 'border-green-500/50' : ''}`}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-xl"
                            >
                                {error}
                            </motion.p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full premium-btn premium-btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    สมัครสมาชิก
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Login link */}
                    <p className="text-center mt-6 text-white/40">
                        มีบัญชีอยู่แล้ว?{" "}
                        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                            เข้าสู่ระบบ
                        </Link>
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
