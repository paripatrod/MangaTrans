"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import { authApi, UserProfile } from "@/lib/api";
import { getHistory, TranslationHistory } from "@/lib/storage";
import {
    Languages,
    History,
    Sparkles,
    FileText,
    Clock,
    Calendar,
    TrendingUp,
    Crown,
    ArrowRight,
    Zap,
    BookOpen,
    Eye
} from "lucide-react";

// Recent Activity Component
function RecentActivity() {
    const [recent, setRecent] = useState<TranslationHistory[]>([]);

    useEffect(() => {
        const history = getHistory();
        setRecent(history.slice(0, 5)); // Show last 5
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return "เมื่อกี้";
        if (hours < 24) return `${hours} ชม.ที่แล้ว`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} วันที่แล้ว`;
        return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    };

    if (recent.length === 0) {
        return (
            <div className="space-y-4 sm:space-y-6">
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg sm:text-xl font-bold flex items-center gap-3"
                >
                    <div className="w-1 h-6 sm:h-8 rounded-full bg-gray-700/50" />
                    <Clock className="w-5 h-5 text-gray-400" />
                    กิจกรรมล่าสุด
                </motion.h2>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-card p-6 sm:p-8 min-h-[200px] flex flex-col items-center justify-center"
                >
                    <FileText className="w-10 h-10 text-white/20 mb-4" />
                    <p className="text-white/40">ยังไม่มีประวัติการอ่าน</p>
                    <Link href="/translate" className="mt-4">
                        <button className="premium-btn premium-btn-primary px-6 py-2 text-sm">
                            เริ่มอ่านเลย
                        </button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg sm:text-xl font-bold flex items-center gap-3"
            >
                <div className="w-1 h-6 sm:h-8 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                <Clock className="w-5 h-5 text-violet-400" />
                กิจกรรมล่าสุด
            </motion.h2>
            <div className="space-y-3">
                {recent.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                    >
                        <Link href={`/read/${item.id}`}>
                            <div className="glass-card p-4 hover:bg-white/5 transition-all group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold truncate group-hover:text-violet-300 transition-colors">
                                            {item.title}
                                        </h4>
                                        <p className="text-sm text-white/40">
                                            {item.pageCount} หน้า • {formatDate(item.createdAt)}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500 transition-colors ml-4">
                                        <Eye className="w-4 h-4 text-white/40 group-hover:text-white" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
            {recent.length > 0 && (
                <Link href="/history" className="block">
                    <button className="w-full py-3 text-sm text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2">
                        ดูประวัติทั้งหมด
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [localCount, setLocalCount] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user?.email) {
            loadProfile();
        }
    }, [session]);

    useEffect(() => {
        import("@/lib/storage").then(({ getTotalCount }) => {
            setLocalCount(getTotalCount());
        });
    }, []);

    const loadProfile = async () => {
        if (!session?.user?.email) return;
        try {
            await authApi.syncUser({
                email: session.user.email,
                name: session.user.name || undefined,
                image: session.user.image || undefined,
                provider: 'google'
            });
            const data = await authApi.getProfile(session.user.email);
            setProfile(data);
        } catch (err) {
            console.error("Failed to load profile:", err);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    if (!session) return null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const remainingTranslations = Math.max(0, 10 - localCount);

    const stats = [
        {
            label: "สถานะ",
            value: profile?.isMember ? (profile.membershipType === '7days' ? '7 วัน' : profile.membershipType === '30days' ? '30 วัน' : 'Admin') : 'Free',
            sub: profile?.isMember ? `เหลือ ${profile.remainingDays} วัน` : `เหลือ ${remainingTranslations}/10 ครั้ง`,
            icon: Crown,
            color: "purple"
        },
        {
            label: "อ่านไปแล้ว",
            value: localCount,
            sub: "เรื่อง",
            icon: BookOpen,
            color: "amber"
        },
        {
            label: "สมาชิกตั้งแต่",
            value: profile?.createdAt ? formatDate(profile.createdAt) : '-',
            icon: Calendar,
            color: "green"
        },
        {
            label: "ล็อกอินล่าสุด",
            value: profile?.lastLogin ? formatDate(profile.lastLogin) : '-',
            icon: Clock,
            color: "blue"
        }
    ];

    return (
        <main className="min-h-screen relative overflow-hidden">
            {/* Background Effects */}
            <div className="page-bg" />
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-600/10 to-transparent pointer-events-none" />
            <div className="fixed -top-24 -right-24 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px] animate-pulse" />
            <div className="fixed top-1/3 -left-24 w-72 h-72 bg-violet-600/20 rounded-full blur-[128px] animate-float" />

            <Navbar />

            {/* Adjusted padding for mobile */}
            <div className="pt-24 sm:pt-28 lg:pt-32 pb-12 px-4 sm:px-6 relative z-10">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row items-center justify-between gap-6 glass-card p-6 sm:p-8 md:p-10 relative overflow-hidden group text-center md:text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 relative z-10 w-full">
                            <div className="relative shrink-0">
                                {session.user?.image ? (
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden ring-4 ring-white/10 shadow-2xl">
                                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-4xl shadow-2xl ring-4 ring-white/10">
                                        👋
                                    </div>
                                )}
                                <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-[#0f0f13] w-6 h-6 rounded-full" />
                            </div>

                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                                    สวัสดี, <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{session.user?.name?.split(' ')[0] || "นักอ่าน"}</span>
                                </h1>
                                <p className="text-white/40 text-sm sm:text-base md:text-lg flex items-center justify-center md:justify-start gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    วันนี้จะอ่านเรื่องไหนดี?
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 w-full md:w-auto mt-4 md:mt-0">
                            <Link href="/translate" className="block w-full md:w-auto">
                                <button className="w-full md:w-auto premium-btn premium-btn-primary px-8 py-3 sm:py-4 text-base sm:text-lg shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 transform hover:-translate-y-1 transition-all flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 mr-2" />
                                    เริ่มอ่านทันที
                                </button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Stats Grid - Responsive Text */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.05 }}
                                className={`glass-card p-4 sm:p-6 relative overflow-hidden group hover:bg-white/5 transition-colors ${stat.label === 'สถานะ' && profile?.membershipType === 'admin' ? 'border-amber-500/30 bg-amber-500/5' : ''}`}
                            >
                                <div className={`absolute -right-4 -top-4 w-20 h-20 sm:w-24 sm:h-24 bg-${stat.color}-500/10 rounded-full blur-2xl group-hover:bg-${stat.color}-500/20 transition-colors`} />

                                <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-400 group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    {stat.label === 'สถานะ' && !profile?.isMember && (
                                        <Link href="/pricing" className="text-[10px] sm:text-xs font-bold bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 rounded-full transition-colors cursor-pointer">
                                            อัปเกรด
                                        </Link>
                                    )}
                                </div>

                                <div className="relative z-10">
                                    <p className="text-white/40 text-xs sm:text-sm font-medium mb-1">{stat.label}</p>
                                    <div className="flex flex-wrap items-baseline gap-x-2">
                                        <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${stat.color === 'purple' && profile?.isMember ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent' : 'text-white'}`}>
                                            {stat.value}
                                        </h3>
                                        {stat.sub && <span className="text-[10px] sm:text-xs font-medium text-white/30 truncate">{stat.sub}</span>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick Actions & Promo Grid */}
                    <div className="space-y-4 sm:space-y-6">
                        <motion.h2
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-lg sm:text-xl font-bold flex items-center gap-3"
                        >
                            <div className="w-1 h-6 sm:h-8 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                            เมนูด่วน
                        </motion.h2>

                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 ${!profile?.isMember ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <Link href="/translate" className="group block h-full">
                                    <div className="glass-card p-5 sm:p-6 h-full hover:bg-violet-600/10 transition-all border border-white/5 hover:border-violet-500/30 relative overflow-hidden flex flex-col">
                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-4 relative z-10 mb-4">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform shrink-0">
                                                <Languages className="w-6 h-6 sm:w-7 sm:h-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-base sm:text-lg font-bold mb-1 group-hover:text-violet-300 transition-colors">อ่านเรื่องใหม่</h3>
                                                <p className="text-xs sm:text-sm text-white/40">รองรับภาษาเกาหลี ญี่ปุ่น จีน</p>
                                            </div>
                                        </div>
                                        <div className="mt-auto relative z-10 flex items-center justify-between border-t border-white/5 pt-4">
                                            <span className="text-[10px] sm:text-xs font-medium text-white/40 uppercase tracking-wider">Read New Chapter</span>
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors">
                                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Link href="/history" className="group block h-full">
                                    <div className="glass-card p-5 sm:p-6 h-full hover:bg-fuchsia-600/10 transition-all border border-white/5 hover:border-fuchsia-500/30 relative overflow-hidden flex flex-col">
                                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-4 relative z-10 mb-4">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform shrink-0">
                                                <History className="w-6 h-6 sm:w-7 sm:h-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-base sm:text-lg font-bold mb-1 group-hover:text-fuchsia-300 transition-colors">ประวัติการอ่าน</h3>
                                                <p className="text-xs sm:text-sm text-white/40">ดูเรื่องที่เคยอ่าน</p>
                                            </div>
                                        </div>
                                        <div className="mt-auto relative z-10 flex items-center justify-between border-t border-white/5 pt-4">
                                            <span className="text-[10px] sm:text-xs font-medium text-white/40 uppercase tracking-wider">Your Library</span>
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-fuchsia-500 group-hover:text-white transition-colors">
                                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>

                            {!profile?.isMember && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="sm:col-span-2 lg:col-span-1"
                                >
                                    <Link href="/pricing" className="group block h-full">
                                        <div className="glass-card p-1 relative overflow-hidden group h-full">
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 opacity-50 group-hover:opacity-70 transition-opacity" />
                                            <div className="bg-[#0f0f13]/90 backdrop-blur-xl rounded-[1.25rem] p-5 sm:p-6 h-full relative z-10 flex flex-col">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 animate-pulse-slow shrink-0">
                                                        <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-bold mb-1 bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">อัปเกรดเป็น PRO</h3>
                                                        <p className="text-xs sm:text-sm text-white/40">เริ่มต้น ฿30</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-6 flex-1">
                                                    {[
                                                        "อ่านได้ไม่จำกัด",
                                                        "ภาพชัดระดับ Original",
                                                        "รองรับทุกเว็บ"
                                                    ].map((feature, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                                                            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 shrink-0" />
                                                            <span className="truncate">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs sm:text-sm">
                                                    ดูแพ็กเกจ
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity Section */}
                    <RecentActivity />
                </div>
            </div>
        </main>
    );
}
