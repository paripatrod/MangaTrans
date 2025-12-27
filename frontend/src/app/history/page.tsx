"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { getHistory, deleteTranslation, TranslationHistory } from "@/lib/storage";
import { Clock, Trash2, Eye, ArrowLeft, Languages, FileText, Calendar, BookOpen } from "lucide-react";

export default function HistoryPage() {
    const [translations, setTranslations] = useState<TranslationHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load from localStorage
        const history = getHistory();
        setTranslations(history);
        setLoading(false);
    }, []);

    const handleDelete = (id: string) => {
        if (!confirm("ต้องการลบงานแปลนี้?")) return;
        deleteTranslation(id);
        setTranslations(prev => prev.filter(t => t.id !== id));
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getLangName = (code: string) => {
        const langs: Record<string, string> = {
            ko: "🇰🇷 เกาหลี",
            ja: "🇯🇵 ญี่ปุ่น",
            zh: "🇨🇳 จีน",
            en: "🇺🇸 อังกฤษ"
        };
        return langs[code] || code;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <main className="min-h-screen relative bg-black text-white">
            <div className="fixed inset-0 -z-10 bg-black">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-900/10 rounded-full blur-[100px] opacity-50" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-900/10 rounded-full blur-[100px] opacity-50" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <Navbar />

            <div className="pt-24 lg:pt-32 pb-12 px-4 relative z-10">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                        <div>
                            <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-4 transition-colors group">
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm">กลับ Dashboard</span>
                            </Link>
                            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
                                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">ประวัติการแปล</span>
                                <span className="text-sm font-normal text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">{translations.length} เรื่อง</span>
                            </h1>
                        </div>

                        {translations.length > 0 && (
                            <Link href="/translate">
                                <button className="premium-btn premium-btn-primary px-6 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-violet-500/20">
                                    <Languages className="w-4 h-4" />
                                    แปลเรื่องใหม่
                                </button>
                            </Link>
                        )}
                    </div>

                    {/* List */}
                    {translations.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card p-16 text-center border-dashed"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                                <FileText className="w-10 h-10 text-white/20" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">ยังไม่มีประวัติการแปล</h3>
                            <p className="text-white/40 mb-8 max-w-md mx-auto">เริ่มแปลมังงะเรื่องแรกของคุณได้เลย เราจะเก็บประวัติไว้ที่นี่ให้คุณกลับมาอ่านได้เสมอ</p>
                            <Link href="/translate">
                                <button className="premium-btn premium-btn-primary inline-flex items-center gap-2 px-8">
                                    <Languages className="w-5 h-5" />
                                    เริ่มแปลเลย
                                </button>
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {translations.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass-card p-5 hover:border-white/20 transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Info Section */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-white truncate mb-2 group-hover:text-violet-300 transition-colors">
                                                {item.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/50">
                                                <span className="flex items-center gap-1.5">
                                                    <Languages className="w-3.5 h-3.5" />
                                                    {getLangName(item.sourceLang)} → 🇹🇭
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    {item.pageCount} หน้า
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(item.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <Link href={`/read/${item.id}`}>
                                                <button className="premium-btn premium-btn-primary px-4 py-2 text-sm flex items-center gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    <span className="hidden sm:inline">อ่าน</span>
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="premium-btn px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
