"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { getHistory, TranslationHistory } from "@/lib/storage";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, BookOpen } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ReadPage() {
    const params = useParams();
    const router = useRouter();
    const [translation, setTranslation] = useState<TranslationHistory | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = params.id as string;
        const history = getHistory();
        const found = history.find(t => t.id === id);

        if (found) {
            setTranslation(found);
        }
        setLoading(false);
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="spinner" />
            </div>
        );
    }

    if (!translation) {
        return (
            <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
                <Navbar />
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">ไม่พบข้อมูล</h1>
                    <p className="text-white/50 mb-8">การแปลนี้อาจถูกลบไปแล้ว</p>
                    <Link href="/history">
                        <button className="premium-btn premium-btn-primary px-6 py-3">
                            กลับไปประวัติ
                        </button>
                    </Link>
                </div>
            </main>
        );
    }

    const pages = translation.pages || [];
    const currentPageData = pages[currentPage];

    const goToPrev = () => setCurrentPage(p => Math.max(0, p - 1));
    const goToNext = () => setCurrentPage(p => Math.min(pages.length - 1, p + 1));

    // Build image URL
    const getImageUrl = (url: string) => {
        if (url.startsWith('/output')) {
            return `${API_BASE_URL}${url}`;
        }
        return url;
    };

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Background */}
            <div className="fixed inset-0 -z-10 bg-black">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-900/5 to-transparent" />
            </div>

            <Navbar />

            <div className="pt-20 pb-24">
                {/* Header */}
                <div className="max-w-4xl mx-auto px-4 mb-6">
                    <Link href="/history" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>กลับไปประวัติ</span>
                    </Link>
                    <h1 className="text-2xl font-bold truncate">{translation.title}</h1>
                    <p className="text-white/40 text-sm mt-1">
                        {translation.pageCount} หน้า • แปลเมื่อ {new Date(translation.createdAt).toLocaleDateString("th-TH")}
                    </p>
                </div>

                {/* Image Viewer */}
                <div className="max-w-4xl mx-auto px-4">
                    {currentPageData && (
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative"
                        >
                            <img
                                src={getImageUrl(currentPageData.translatedUrl)}
                                alt={`Page ${currentPage + 1}`}
                                className="w-full rounded-lg shadow-2xl"
                            />
                        </motion.div>
                    )}
                </div>

                {/* Navigation Controls */}
                <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 p-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <button
                            onClick={goToPrev}
                            disabled={currentPage === 0}
                            className="premium-btn px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4">
                            <span className="text-white/60">
                                หน้า {currentPage + 1} / {pages.length}
                            </span>

                            {/* Page dots */}
                            <div className="hidden sm:flex gap-1">
                                {pages.slice(0, 10).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-2 h-2 rounded-full transition-all ${i === currentPage
                                                ? 'bg-violet-400 w-6'
                                                : 'bg-white/20 hover:bg-white/40'
                                            }`}
                                    />
                                ))}
                                {pages.length > 10 && (
                                    <span className="text-white/30">...</span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={goToNext}
                            disabled={currentPage === pages.length - 1}
                            className="premium-btn px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
