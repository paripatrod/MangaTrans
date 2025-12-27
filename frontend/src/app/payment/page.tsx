"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import {
    CreditCard,
    Wallet,
    Upload,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Copy,
    QrCode,
    Smartphone,
    Loader2,
    Crown
} from "lucide-react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const PLANS = {
    "7days": { name: "Starter", price: 30, days: 7 },
    "30days": { name: "Pro Reader", price: 60, days: 30 }
};

const BANK_INFO = {
    bank: "ธนาคารกรุงไทย",
    accountNumber: "8780750761",
    accountName: "ปริพัฒน์ รอดหยู่"
};

export default function PaymentPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mounted, setMounted] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<"7days" | "30days">("7days");
    const [paymentMethod, setPaymentMethod] = useState<"promptpay" | "truemoney" | "slip">("promptpay");
    const [giftLink, setGiftLink] = useState<string>("");
    const [slipImage, setSlipImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<{
        plan: string;
        days: number;
        expiry: string;
    } | null>(null);

    // PromptPay QR state
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrExpiry, setQrExpiry] = useState<Date | null>(null);
    const [countdown, setCountdown] = useState<number>(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        const plan = searchParams.get("plan");
        if (plan === "7days" || plan === "30days") {
            setSelectedPlan(plan);
        }
    }, [searchParams]);

    // Countdown timer for QR expiry
    useEffect(() => {
        if (!qrExpiry) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((qrExpiry.getTime() - Date.now()) / 1000));
            setCountdown(remaining);

            if (remaining <= 0) {
                setQrCode(null);
                setQrExpiry(null);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [qrExpiry]);

    const generateQR = async () => {
        if (!session?.user?.email) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/promptpay/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session.user.email,
                    plan: selectedPlan
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            setQrCode(data.data.qrCode);
            setQrExpiry(new Date(data.data.expiresAt));
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("ไฟล์ใหญ่เกินไป (สูงสุด 5MB)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setSlipImage(event.target?.result as string);
            setError("");
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!session?.user?.email) {
            setError("กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        setLoading(true);
        setError("");

        try {
            let response;

            if (paymentMethod === "truemoney") {
                if (!giftLink.trim()) {
                    setError("กรุณาใส่ลิงก์ซองอั่งเปา");
                    setLoading(false);
                    return;
                }

                response = await fetch(`${API_BASE_URL}/payment/truemoney`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: session.user.email,
                        plan: selectedPlan,
                        giftLink: giftLink.trim()
                    })
                });
            } else {
                if (!slipImage) {
                    setError("กรุณาอัปโหลดสลิป");
                    setLoading(false);
                    return;
                }

                response = await fetch(`${API_BASE_URL}/payment/slip`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: session.user.email,
                        plan: selectedPlan,
                        slipImage
                    })
                });
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "เกิดข้อผิดพลาด");
            }

            setSuccess(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="spinner" />
            </div>
        );
    }

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="spinner" />
            </div>
        );
    }

    const plan = PLANS[selectedPlan];

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Background */}
            <div className="fixed inset-0 -z-10 bg-black">
                <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-violet-900/10 to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <Navbar />

            <div className="pt-24 lg:pt-32 pb-12 px-4">
                <div className="max-w-xl mx-auto">
                    {/* Back Button */}
                    <Link href="/pricing" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        กลับไปหน้าราคา
                    </Link>

                    {/* Success State */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-8 text-center"
                            >
                                <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">ชำระเงินสำเร็จ!</h2>
                                <p className="text-white/60 mb-6">
                                    คุณได้อัปเกรดเป็น {success.plan} แล้ว<br />
                                    ใช้งานได้ถึง {new Date(success.expiry).toLocaleDateString("th-TH", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    })}
                                </p>
                                <Link href="/dashboard">
                                    <button className="premium-btn premium-btn-primary px-8 py-3">
                                        ไปหน้า Dashboard
                                    </button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!success && (
                        <>
                            {/* Header */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mb-8"
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
                                    <Crown className="w-4 h-4 text-violet-400" />
                                    <span className="text-sm font-medium">ชำระเงิน</span>
                                </div>
                                <h1 className="text-3xl font-bold">
                                    แพ็กเกจ {plan.name}
                                </h1>
                                <p className="text-4xl font-bold mt-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                                    ฿{plan.price}
                                </p>
                                <p className="text-white/40 mt-1">{plan.days} วัน</p>
                            </motion.div>

                            {/* Plan Selection */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="grid grid-cols-2 gap-3 mb-6"
                            >
                                {(["7days", "30days"] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setSelectedPlan(p)}
                                        className={`p-4 rounded-xl border-2 transition-all ${selectedPlan === p
                                            ? "border-violet-500 bg-violet-500/10"
                                            : "border-white/10 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="font-bold">{PLANS[p].name}</div>
                                        <div className="text-lg">฿{PLANS[p].price}</div>
                                        <div className="text-xs text-white/40">{PLANS[p].days} วัน</div>
                                    </button>
                                ))}
                            </motion.div>

                            {/* Payment Method */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card p-6 mb-6"
                            >
                                <h3 className="font-bold mb-4">เลือกช่องทางชำระเงิน</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => { setPaymentMethod("promptpay"); setQrCode(null); }}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === "promptpay"
                                            ? "border-green-500 bg-green-500/10"
                                            : "border-white/10 hover:border-white/20"
                                            }`}
                                    >
                                        <QrCode className="w-8 h-8 text-green-400" />
                                        <span className="text-sm font-medium">PromptPay</span>
                                        <span className="text-xs text-white/40">สแกน QR</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod("truemoney")}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === "truemoney"
                                            ? "border-orange-500 bg-orange-500/10"
                                            : "border-white/10 hover:border-white/20"
                                            }`}
                                    >
                                        <Wallet className="w-8 h-8 text-orange-400" />
                                        <span className="text-sm font-medium">True Money</span>
                                        <span className="text-xs text-white/40">ซองอั่งเปา</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod("slip")}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === "slip"
                                            ? "border-blue-500 bg-blue-500/10"
                                            : "border-white/10 hover:border-white/20"
                                            }`}
                                    >
                                        <CreditCard className="w-8 h-8 text-blue-400" />
                                        <span className="text-sm font-medium">โอนเงิน</span>
                                        <span className="text-xs text-white/40">สแกนสลิป</span>
                                    </button>
                                </div>
                            </motion.div>

                            {/* Payment Form */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="glass-card p-6 mb-6"
                            >
                                {paymentMethod === "promptpay" ? (
                                    <div className="space-y-4">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <QrCode className="w-5 h-5 text-green-400" />
                                            PromptPay QR Code
                                        </h3>

                                        {qrCode ? (
                                            <div className="text-center">
                                                <div className="bg-white p-4 rounded-xl inline-block mb-4">
                                                    <img src={qrCode} alt="PromptPay QR" className="w-64 h-64" />
                                                </div>
                                                <p className="text-lg font-bold text-green-400 mb-2">
                                                    ฿{plan.price}
                                                </p>
                                                <div className="flex items-center justify-center gap-2 text-sm">
                                                    <div className={`w-2 h-2 rounded-full ${countdown > 60 ? 'bg-green-500' : countdown > 30 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
                                                    <span className="text-white/60">
                                                        หมดอายุใน {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} นาที
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/40 mt-2">
                                                    สแกน QR แล้วโอนเงิน จากนั้นอัปโหลดสลิปด้านล่าง
                                                </p>
                                                <button
                                                    onClick={() => setPaymentMethod("slip")}
                                                    className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    อัปโหลดสลิป
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                                                    <QrCode className="w-10 h-10 text-green-400" />
                                                </div>
                                                <p className="text-white/60 mb-4">สร้าง QR Code สำหรับโอนเงิน ฿{plan.price}</p>
                                                <button
                                                    onClick={generateQR}
                                                    disabled={loading}
                                                    className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-bold transition-colors disabled:opacity-50"
                                                >
                                                    {loading ? "กำลังสร้าง..." : "สร้าง QR Code"}
                                                </button>
                                                <p className="text-xs text-white/30 mt-4">QR มีอายุ 5 นาที</p>
                                            </div>
                                        )}
                                    </div>
                                ) : paymentMethod === "truemoney" ? (
                                    <div className="space-y-4">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <Wallet className="w-5 h-5 text-orange-400" />
                                            True Money Wallet
                                        </h3>
                                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-sm">
                                            <p className="font-medium mb-2">วิธีชำระเงิน:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-white/70">
                                                <li>เปิดแอป TrueMoney Wallet</li>
                                                <li>กด &quot;ซองอั่งเปา&quot; → &quot;สร้างซอง&quot;</li>
                                                <li>ใส่ยอดเงิน ฿{plan.price} (หรือมากกว่า)</li>
                                                <li>แชร์ลิงก์มาวางด้านล่าง</li>
                                            </ol>
                                        </div>
                                        <div>
                                            <label className="text-sm text-white/60 block mb-2">
                                                ลิงก์ซองอั่งเปา
                                            </label>
                                            <input
                                                key="giftlink-input"
                                                type="text"
                                                value={giftLink}
                                                onChange={(e) => setGiftLink(e.target.value || "")}
                                                placeholder="https://gift.truemoney.com/campaign/?v=..."
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-blue-400" />
                                            โอนเงินธนาคาร
                                        </h3>
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <div className="text-white/40">ธนาคาร</div>
                                                    <div className="font-medium">{BANK_INFO.bank}</div>
                                                </div>
                                                <div>
                                                    <div className="text-white/40">ยอดเงิน</div>
                                                    <div className="font-bold text-lg text-blue-400">฿{plan.price}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="text-white/40">เลขบัญชี</div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-lg">{BANK_INFO.accountNumber}</span>
                                                        <button
                                                            onClick={() => copyToClipboard(BANK_INFO.accountNumber)}
                                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="text-white/40">ชื่อบัญชี</div>
                                                    <div className="font-medium">{BANK_INFO.accountName}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-white/60 block mb-2">
                                                อัปโหลดสลิป
                                            </label>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                            {slipImage ? (
                                                <div className="relative">
                                                    <img
                                                        src={slipImage}
                                                        alt="Slip"
                                                        className="w-full max-h-64 object-contain rounded-lg border border-white/10"
                                                    />
                                                    <button
                                                        onClick={() => setSlipImage(null)}
                                                        className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg text-white text-sm"
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full py-8 border-2 border-dashed border-white/20 rounded-lg hover:border-white/40 transition-colors flex flex-col items-center gap-2"
                                                >
                                                    <Upload className="w-8 h-8 text-white/40" />
                                                    <span className="text-white/60">คลิกเพื่ออัปโหลดสลิป</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full premium-btn premium-btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        กำลังตรวจสอบ...
                                    </>
                                ) : (
                                    <>
                                        ยืนยันการชำระเงิน ฿{plan.price}
                                    </>
                                )}
                            </motion.button>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
