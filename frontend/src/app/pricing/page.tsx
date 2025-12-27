"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import {
    Check,
    Sparkles,
    Zap,
    Shield,
    Crown,
    Star,
    ArrowRight,
    ChevronDown,
    Infinity,
    Headphones,
    Gem
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleUpgrade = (planId: string) => {
        if (!session) {
            router.push("/login");
            return;
        }
        router.push(`/payment?plan=${planId}`);
    };

    const plans = [
        {
            id: "7days",
            name: "Starter",
            price: "30",
            period: "/ 7 วัน",
            description: "เริ่มต้นสัมผัสประสบการณ์ใหม่",
            features: [
                "อ่านไม่จำกัด 7 วัน",
                "เข้าถึงเรื่องฮิตจากเกาหลี/ญี่ปุ่น",
                "ไม่มีโฆษณาแทรก",
                "เก็บ eBook ส่วนตัว"
            ],
            popular: false,
            color: "blue"
        },
        {
            id: "30days",
            name: "Pro Reader",
            price: "60",
            period: "/ 30 วัน",
            description: "สำหรับนักอ่านตัวยง คุ้มที่สุด",
            features: [
                "ทุกอย่างในแพ็กเกจ Starter",
                "โหลดหน้าเว็บเร็ว x2 (Priority Queue)",
                "ภาพคมชัดระดับ HD (Original Quality)",
                "ทีม Support ดูแล 24 ชม."
            ],
            popular: true,
            color: "violet"
        }
    ];

    const faqs = [
        {
            q: "ชำระเงินช่องทางไหนได้บ้าง?",
            a: "เรารองรับการชำระเงินผ่าน PromptPay (สแกน QR Code), บัตรเครดิต/เดบิต และ TrueMoney Wallet เพื่อความสะดวกที่สุดของคุณ"
        },
        {
            q: "มีการต่ออายุอัตโนมัติไหม?",
            a: "ไม่มีครับ เราใช้ระบบ 'เติมวัน' เมื่อวันหมดคุณสามารถเลือกเติมแพ็กเกจเดิมหรือเปลี่ยนแพ็กเกจใหม่ได้ตามใจชอบ ไม่มีการตัดบัตรอัตโนมัติ"
        },
        {
            q: "ถ้าอ่านแล้วไม่ชอบ ขอเงินคืนได้ไหม?",
            a: "เรามั่นใจในคุณภาพการแปลของเรามาก แต่หากคุณพบปัญหาการใช้งานร้ายแรง เรายินดีคืนเงินเต็มจำนวนภายใน 7 วันแรกครับ"
        },
        {
            q: "จำกัดจำนวนหน้าต่อวันหรือไม่?",
            a: "ไม่จำกัดครับ! เมื่อคุณสมัครสมาชิก คุณสามารถอ่านกี่เรื่อง กี่ตอนก็ได้ตามใจชอบ เพลิดเพลินได้เต็มที่"
        }
    ];

    return (
        <main className="min-h-screen relative bg-black text-white selection:bg-fuchsia-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 -z-10 bg-black">
                <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <Navbar />

            <div className="pt-28 lg:pt-36 pb-20 px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400/10 to-orange-400/10 border border-amber-400/20 mb-6">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold text-amber-200 uppercase tracking-widest">Premium Member</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
                            ปลดล็อก<span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">ขีดจำกัด</span>การอ่าน
                        </h1>
                        <p className="text-white/40 text-lg sm:text-xl max-w-2xl mx-auto font-light">
                            ลงทุนเพียงวันละ 5 บาท แลกกับการอ่านมังงะภาษาไทยได้ทุกเรื่องในโลก<br className="hidden sm:block" />
                            อ่านลื่นไหล ภาพสวย ไม่ต้องรอนาน
                        </p>
                    </motion.div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto mb-24 items-center">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.1 }}
                                className={`relative rounded-[32px] p-8 lg:p-10 ${plan.popular
                                    ? 'bg-[#1a1a20] border-2 border-violet-500/50 shadow-2xl shadow-violet-500/20 scale-105 z-10'
                                    : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                                        <span className="px-6 py-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-bold flex items-center gap-2 shadow-lg shadow-fuchsia-500/40">
                                            <Sparkles className="w-4 h-4 fill-white" />
                                            ขายดีที่สุด
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-white/80'}`}>{plan.name}</h3>
                                    <p className="text-white/40 text-sm mb-6">{plan.description}</p>
                                    <div className="flex items-end justify-center gap-1">
                                        <span className="text-2xl text-white/40 font-medium mb-2">฿</span>
                                        <span className="text-6xl font-bold text-white tracking-tighter">{plan.price}</span>
                                        <span className="text-white/40 mb-2 font-medium">{plan.period}</span>
                                    </div>
                                </div>

                                <div className="h-px bg-white/5 w-full mb-8" />

                                <ul className="space-y-4 mb-10">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-start gap-4 text-white/70">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.popular ? 'bg-violet-500/20 text-violet-400' : 'bg-white/10 text-white/60'}`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-base">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleUpgrade(plan.id)}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${plan.popular
                                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-lg hover:shadow-violet-500/25 text-white'
                                        : 'bg-white text-black hover:bg-gray-100'
                                        }`}
                                >
                                    เลือกแพ็กเกจนี้
                                    {plan.popular && <ArrowRight className="w-5 h-5" />}
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Features Grid */}
                    <div className="mb-24">
                        <h2 className="text-2xl font-bold text-center mb-12">สิทธิพิเศษสำหรับ <span className="text-violet-400">PRO Member</span></h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: Infinity, title: "อ่านได้ไม่อั้น", desc: "ไม่จำกัดจำนวนตอน หรือหน้าต่อวัน", color: "blue" },
                                { icon: Zap, title: "Fast Lane", desc: "เซิร์ฟเวอร์พิเศษ โหลดเร็วกว่าปกติ x2", color: "amber" },
                                { icon: Gem, title: "High Quality", desc: "โหมดความละเอียดสูง ภาพคมชัด", color: "fuchsia" },
                                { icon: Shield, title: "Ad-free", desc: "ไร้โฆษณา 100% อ่านลื่นไม่สะดุด", color: "green" }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className="glass-card p-8 text-center"
                                >
                                    <div className={`w-14 h-14 mx-auto mb-6 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center`}>
                                        <item.icon className={`w-7 h-7 text-${item.color}-400`} />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                    <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-10">คำถามที่พบบ่อย</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="glass-card overflow-hidden"
                                >
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                                    >
                                        <span className="font-semibold text-lg">{faq.q}</span>
                                        <ChevronDown className={`w-5 h-5 text-white/40 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                                        <p className="px-6 pb-6 text-white/50 leading-relaxed border-t border-white/5 pt-4">
                                            {faq.a}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
