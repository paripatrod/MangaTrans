"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import { translateApi, authApi } from "@/lib/api";
import {
    Link2,
    ArrowRight,
    Sparkles,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Zap,
    Globe,
    Upload,
    Image as ImageIcon,
    Clock,
    X
} from "lucide-react";
import { Page } from "@/lib/api";

const LANGUAGES = [
    { code: "ko", name: "เกาหลี", flag: "🇰🇷", label: "Manhwa" },
    { code: "ja", name: "ญี่ปุ่น", flag: "🇯🇵", label: "Manga" },
    { code: "zh", name: "จีน", flag: "🇨🇳", label: "Manhua" },
    { code: "en", name: "อังกฤษ", flag: "🇺🇸", label: "Comic" },
];

// Estimated time per page in seconds
const SECONDS_PER_PAGE = 8;

export default function TranslatePage() {
    const { data: session } = useSession();
    const [url, setUrl] = useState("");
    const [sourceLang, setSourceLang] = useState("ko");
    const [jobId, setJobId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("idle");
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [pages, setPages] = useState<Page[]>([]);
    const [error, setError] = useState("");

    // Upload states
    const [inputMode, setInputMode] = useState<"url" | "upload">("url");
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ETA states
    const [startTime, setStartTime] = useState<number | null>(null);
    const [estimatedTotal, setEstimatedTotal] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    useEffect(() => {
        if (session?.user?.email) {
            authApi.syncUser({
                email: session.user.email,
                name: session.user.name || undefined,
                image: session.user.image || undefined,
                provider: 'google'
            }).catch(console.error);
        }
    }, [session]);

    // ETA countdown timer
    useEffect(() => {
        if (!startTime || status !== "processing") return;

        const interval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const remaining = Math.max(0, estimatedTotal - elapsed);
            setTimeRemaining(Math.ceil(remaining));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, estimatedTotal, status]);

    useEffect(() => {
        if (!jobId || status === "completed" || status === "error") return;

        const interval = setInterval(async () => {
            try {
                const result = await translateApi.getStatus(jobId);
                setStatus(result.status);
                setProgress(result.progress || 0);

                let displayMsg = result.message || "";
                if (result.status === "processing") {
                    if (progress < 30) displayMsg = "กำลังเชื่อมต่อต้นฉบับ...";
                    else if (progress < 60) displayMsg = "กำลังแกะตัวอักษร...";
                    else displayMsg = "กำลังจัดวางคำบรรยายไทย...";
                }

                setMessage(displayMsg);

                if (result.status === "completed") {
                    const resultPages = result.pages as Page[] || [];
                    setPages(resultPages);

                    const { saveTranslation, extractTitleFromUrl } = await import("@/lib/storage");
                    saveTranslation({
                        title: extractTitleFromUrl(url),
                        sourceUrl: url,
                        sourceLang,
                        targetLang: "th",
                        pageCount: resultPages.length,
                        pages: resultPages.map(p => ({
                            pageNumber: p.pageNumber,
                            originalUrl: p.originalUrl,
                            translatedUrl: p.translatedUrl || ""
                        }))
                    });
                }
                if (result.status === "error") {
                    setError(result.message || "เกิดข้อผิดพลาด");
                }
            } catch {
                setError("ไม่สามารถเชื่อมต่อได้");
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, status, progress, url, sourceLang]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        setUploadedFiles(prev => [...prev, ...imageFiles]);

        // Generate previews
        imageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadPreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setUploadPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session) {
            window.location.href = "/login?redirect=/translate";
            return;
        }

        setError("");
        setStatus("starting");
        setPages([]);

        // Calculate estimated time
        let pageCount = 10; // Default estimate for URL
        if (inputMode === "upload") {
            pageCount = uploadedFiles.length;
        }
        const totalSeconds = pageCount * SECONDS_PER_PAGE + 5; // +5 for initial setup
        setEstimatedTotal(totalSeconds);
        setStartTime(Date.now());
        setTimeRemaining(totalSeconds);

        try {
            if (inputMode === "url") {
                const result = await translateApi.start({
                    url,
                    sourceLang,
                    targetLang: "th",
                });
                setJobId(result.jobId);
                setStatus("processing");
            } else {
                // Upload mode - use upload API
                const result = await translateApi.uploadImages(
                    uploadedFiles,
                    sourceLang,
                    "th"
                );
                setJobId(result.jobId);
                setStatus("processing");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
            setError(errorMessage);
            setStatus("idle");
        }
    };

    const handleReset = () => {
        setUrl("");
        setJobId(null);
        setStatus("idle");
        setProgress(0);
        setMessage("");
        setPages([]);
        setError("");
        setUploadedFiles([]);
        setUploadPreviews([]);
        setStartTime(null);
        setTimeRemaining(0);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins} นาที ${secs} วินาที`;
        }
        return `${secs} วินาที`;
    };

    return (
        <main className="min-h-screen relative overflow-hidden bg-black text-white">
            {/* Dynamic Background */}
            <div className="fixed inset-0 -z-10 bg-black">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-900/10 to-transparent opacity-50" />
                <motion.div
                    animate={{ y: [0, 30, 0], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-20 left-10 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ y: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[100px]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <Navbar />

            <div className="pt-24 lg:pt-32 pb-12 px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-medium text-white/80">ห้องอ่านการ์ตูนส่วนตัว</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                            เริ่มอ่าน<span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">มังงะ</span>เลย
                        </h1>
                        <p className="text-white/50 text-lg sm:text-xl font-light">วางลิงก์หรืออัพโหลดรูปภาพ แล้วเริ่มสนุกได้เลยในไม่กี่วินาที</p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {/* Input Form */}
                        {status === "idle" && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="glass-card p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-32 bg-violet-500/10 blur-[80px] rounded-full" />

                                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                    {/* Input Mode Toggle */}
                                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setInputMode("url")}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${inputMode === "url"
                                                ? "bg-violet-500 text-white shadow-lg"
                                                : "text-white/60 hover:text-white"
                                                }`}
                                        >
                                            <Link2 className="w-4 h-4" />
                                            <span>URL</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInputMode("upload")}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${inputMode === "upload"
                                                ? "bg-violet-500 text-white shadow-lg"
                                                : "text-white/60 hover:text-white"
                                                }`}
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>อัพโหลด</span>
                                        </button>
                                    </div>

                                    {/* URL Input */}
                                    {inputMode === "url" && (
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-2 text-sm font-medium text-white/80 uppercase tracking-wider">
                                                <Link2 className="w-4 h-4 text-violet-400" />
                                                URL ต้นฉบับ
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                                <input
                                                    type="url"
                                                    value={url}
                                                    onChange={(e) => setUrl(e.target.value)}
                                                    className="premium-input bg-[#0f0f13] relative z-10 text-lg placeholder:text-white/20"
                                                    placeholder="วางลิงก์มังงะที่นี่... (เช่น https://example.com/chapter-1)"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload Input */}
                                    {inputMode === "upload" && (
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-2 text-sm font-medium text-white/80 uppercase tracking-wider">
                                                <ImageIcon className="w-4 h-4 text-violet-400" />
                                                อัพโหลดรูปภาพ
                                            </label>

                                            {/* Drop zone */}
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-white/20 hover:border-violet-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-violet-500/5"
                                            >
                                                <Upload className="w-12 h-12 mx-auto mb-4 text-white/40" />
                                                <p className="text-white/60 mb-2">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</p>
                                                <p className="text-white/40 text-sm">รองรับ JPG, PNG, WEBP</p>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                            </div>

                                            {/* Preview */}
                                            {uploadPreviews.length > 0 && (
                                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                                    {uploadPreviews.map((preview, index) => (
                                                        <div key={index} className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-white/5">
                                                            <img
                                                                src={preview}
                                                                alt={`Preview ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(index)}
                                                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-1 text-xs">
                                                                {index + 1}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Language Select */}
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-sm font-medium text-white/80 uppercase tracking-wider">
                                            <Globe className="w-4 h-4 text-fuchsia-400" />
                                            ภาษาของต้นฉบับ
                                        </label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {LANGUAGES.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    type="button"
                                                    onClick={() => setSourceLang(lang.code)}
                                                    className={`relative group p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${sourceLang === lang.code
                                                        ? 'bg-violet-500/20 border-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                                                        : 'bg-white/[0.03] border-white/5 text-white/50 hover:bg-white/[0.08] hover:border-white/20 hover:text-white'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2 relative z-10">
                                                        <span className="text-3xl filter drop-shadow-lg">{lang.flag}</span>
                                                        <span className="font-semibold">{lang.name}</span>
                                                        <span className="text-xs opacity-60 uppercase tracking-widest">{lang.label}</span>
                                                    </div>
                                                    {sourceLang === lang.code && (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-transparent" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
                                        >
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        type="submit"
                                        disabled={inputMode === "url" ? !url : uploadedFiles.length === 0}
                                        className="w-full premium-btn premium-btn-primary py-5 text-lg font-bold shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Zap className="w-6 h-6 fill-white" />
                                        <span>เริ่มอ่านเดี๋ยวนี้</span>
                                        <ArrowRight className="w-5 h-5 opacity-60" />
                                    </motion.button>
                                </form>
                            </motion.div>
                        )}

                        {/* Processing with ETA */}
                        {(status === "starting" || status === "processing") && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-12 text-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-fuchsia-600/5" />

                                <div className="relative w-32 h-32 mx-auto mb-10">
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-2xl opacity-40 animate-pulse" />
                                    <div className="relative w-full h-full rounded-full border-4 border-white/10 border-t-violet-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-10 h-10 text-white animate-pulse" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold mb-4">กำลังเตรียมห้องอ่าน...</h3>
                                <p className="text-white/40 mb-8 text-lg">{message || "กำลังเชื่อมต่อต้นฉบับ"}</p>

                                <div className="max-w-sm mx-auto">
                                    <div className="progress-bar mb-3 h-3 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="progress-fill h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm font-mono mb-6">
                                        <span className="text-white/40">Loading</span>
                                        <span className="text-white/60">{progress}%</span>
                                    </div>

                                    {/* ETA Countdown */}
                                    <div className="flex items-center justify-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                        <Clock className="w-5 h-5 text-violet-400" />
                                        <span className="text-white/60">เวลาโดยประมาณ:</span>
                                        <span className="text-white font-bold text-lg">
                                            {timeRemaining > 0 ? formatTime(timeRemaining) : "กำลังเสร็จแล้ว..."}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Error */}
                        {status === "error" && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-12 text-center"
                            >
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-red-400">เกิดข้อผิดพลาด</h3>
                                <p className="text-white/60 mb-8 max-w-md mx-auto">{error}</p>
                                <button
                                    onClick={handleReset}
                                    className="premium-btn premium-btn-secondary inline-flex items-center gap-2 px-8"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    ลองใหม่อีกครั้ง
                                </button>
                            </motion.div>
                        )}

                        {/* Completed */}
                        {status === "completed" && (
                            <motion.div
                                key="completed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Success Header */}
                                <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-green-500/20 bg-green-500/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 animate-bounce">
                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-green-400">พร้อมอ่านแล้ว!</h3>
                                            <p className="text-white/40 text-sm">ทั้งหมด {pages.length} หน้า</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
                                        >
                                            กลับไปด้านบน
                                        </button>
                                        <button
                                            onClick={handleReset}
                                            className="flex-1 sm:flex-none premium-btn-primary px-6 py-3 rounded-xl text-white text-sm font-medium shadow-lg shadow-violet-500/20"
                                        >
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4" />
                                                <span>อ่านเรื่องถัดไป</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Results Grid */}
                                <div className="flex flex-col gap-0 max-w-3xl mx-auto bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                    {pages.filter(page => page.translatedUrl).map((page, index) => (
                                        <div key={index} className="relative group min-h-[200px] bg-[#111]">
                                            <img
                                                src={page.translatedUrl!.startsWith('http') ? page.translatedUrl! : `https://mangatrans.onrender.com${page.translatedUrl}`}
                                                alt={`หน้า ${index + 1}`}
                                                className="w-full h-auto block"
                                                loading="lazy"
                                            />
                                            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-3 py-1 rounded-full text-xs font-mono border border-white/10 backdrop-blur-sm">
                                                Page {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
