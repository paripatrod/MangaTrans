"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import {
  Sparkles,
  Globe,
  Zap,
  Shield,
  ArrowRight,
  Star,
  CheckCircle,
  Play,
  BookOpen,
  Wand2,
  Cpu,
  Crown
} from "lucide-react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white selection:bg-violet-500/30">
      <Navbar />

      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-black">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-900/20 to-transparent opacity-50" />

        {/* Animated Orbs */}
        <motion.div
          animate={{
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 right-0 w-[500px] h-[500px] bg-fuchsia-600/30 rounded-full blur-[128px]"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[128px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-8 hover:bg-white/10 transition-colors shadow-2xl shadow-violet-500/10 cursor-default"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm font-medium text-white/80">Global Reading Engine V2.0</span>
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold tracking-wider">NEW</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]"
          >
            <span className="text-white drop-shadow-2xl">อ่านมังงะ</span>
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x"> ทั่วโลก</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white/80 to-white/40 text-4xl sm:text-5xl lg:text-7xl font-semibold mt-2 block">
              เป็นไทยใน 1 วินาที
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            เปิดประสบการณ์อ่านไร้ขีดจำกัด เข้าถึงต้นฉบับเกาหลี ญี่ปุ่น จีน ได้ทันที
            <br className="hidden sm:block" />
            เหมือนมีทีมแปลส่วนตัว พร้อมระบบคลีนภาพเนียนกริบ ไม่เสียอรรถรส
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center"
          >
            {session ? (
              <Link href="/translate">
                <button className="premium-btn premium-btn-primary px-8 py-4 text-lg shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 group">
                  <Zap className="w-5 h-5 fill-current" />
                  เริ่มอ่านเลย
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            ) : (
              <Link href="/signup">
                <button className="premium-btn premium-btn-primary px-8 py-4 text-lg shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 group">
                  <Sparkles className="w-5 h-5 fill-current" />
                  ทดลองอ่านฟรี
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            )}

            <Link href="/pricing">
              <button className="premium-btn bg-white/5 border border-white/10 hover:bg-white/10 text-white w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                ดูแพ็กเกจ
              </button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 text-white/40 text-sm font-medium"
          >
            {[
              "นักอ่าน 10,000+ คน",
              "Smart Core Engine",
              "ปลอดภัย ไม่เก็บข้อมูล",
              "พร้อมอ่าน < 60 วินาที"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Grid with Glassmorphism */}
      <section className="relative py-24 lg:py-32 px-4 sm:px-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px] -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              ทำไมต้องเลือก <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">MangaTrans</span>?
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto text-lg">
              เราไม่ได้แค่แปล แต่เราสร้างห้องสมุดส่วนตัวที่ให้คุณอ่านทุกเรื่องในโลกได้ทันใจ
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Globe,
                title: "ปลดล็อก 4 ภาษา",
                desc: "เข้าถึงจักรวาลมังงะจาก เกาหลี (Manhwa), ญี่ปุ่น (Manga), จีน (Manhua) และอังกฤษ ได้แบบไร้กำแพงภาษา",
                color: "blue"
              },
              {
                icon: Wand2,
                title: "เทคโนโลยีล่องหน",
                desc: "ระบบอัตโนมัติที่ลบตัวอักษรเดิมและวางคำแปลไทยลงไปอย่างแนบเนียน เหมือนอ่านจากต้นฉบับจริงๆ",
                color: "violet"
              },
              {
                icon: Cpu,
                title: "อัจฉริยะทางภาษา",
                desc: "เข้าใจบริบท ตัวละคร และคำแสลงของแต่ละเรื่อง ทำให้การอ่านของคุณสนุกและอินกว่าที่เคย",
                color: "fuchsia"
              },
              {
                icon: BookOpen,
                title: "อ่านแบบ Long Strip",
                desc: "หน้าเว็บออกแบบมาเพื่อการอ่านการ์ตูนโดยเฉพาะ เลื่อนอ่านยาวๆ ไม่มีสะดุด รองรับมือถือเต็มรูปแบบ",
                color: "pink"
              },
              {
                icon: Zap,
                title: "เร็วแรง ไม่มีโฆษณา",
                desc: "เซิร์ฟเวอร์ความเร็วสูง ประมวลผลภาพในไม่กี่วินาที และที่สำคัญ หน้าเว็บสะอาด ไม่มีโฆษณากวนใจ",
                color: "amber"
              },
              {
                icon: Shield,
                title: "Privacy First",
                desc: "เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ ระบบจะล้างข้อมูลอัตโนมัติหลังอ่านจบ ปลอดภัยแน่นอน",
                color: "green"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-card p-8 group hover:bg-white/5 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center text-${feature.color}-400 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-violet-200 transition-colors">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="relative py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 blur-[80px] opacity-20" />
              <div className="relative glass-card p-2 rounded-3xl overflow-hidden border-white/10 shadow-2xl">
                <div className="bg-[#0f0f13] rounded-2xl p-6 lg:p-10 text-center">
                  <div className="w-20 h-20 mx-auto bg-violet-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Sparkles className="w-10 h-10 text-violet-400" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-white/10 rounded-full w-3/4 mx-auto" />
                    <div className="h-4 bg-white/10 rounded-full w-1/2 mx-auto" />
                    <div className="h-32 bg-white/5 rounded-2xl w-full mt-8 border border-white/5 flex items-center justify-center">
                      <span className="text-white/20 text-sm">Preview UI</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">เริ่มอ่านได้ใน <span className="text-violet-400">3 ขั้นตอน</span></h2>
                <div className="space-y-8">
                  {[
                    { step: "01", title: "วางลิงก์", desc: "Copy URL หน้าเว็บมังงะต้นฉบับที่คุณต้องการ" },
                    { step: "02", title: "เลือกภาษา", desc: "เลือกภาษาของต้นฉบับ (เช่น เกาหลี หรือ ญี่ปุ่น)" },
                    { step: "03", title: "รอรับผล", desc: "ระบบจะทำการเปลี่ยนภาษาให้คุณพร้อมอ่านใน 1 นาที" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg text-white/60">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-white/40">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 text-center">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 lg:p-20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-fuchsia-600/20" />

            <h2 className="text-4xl sm:text-5xl font-bold mb-6 relative z-10">
              พร้อมสัมผัสประสบการณ์<br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">ระดับ God Tier</span> หรือยัง?
            </h2>
            <p className="text-white/50 text-lg mb-10 max-w-2xl mx-auto relative z-10">
              สมัครสมาชิกวันนี้ เริ่มต้นเพียง 59 บาท/สัปดาห์<br />
              ปลดล็อกทุกเรื่อง อ่านได้ทั่วโลก ไม่มีกั๊ก
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link href="/signup">
                <button className="premium-btn premium-btn-primary px-10 py-4 text-lg shadow-2xl shadow-violet-500/30 hover:scale-105 transition-transform w-full sm:w-auto">
                  สมัครสมาชิกเลย
                </button>
              </Link>
              <Link href="/pricing">
                <button className="premium-btn bg-white/5 text-white hover:bg-white/10 w-full sm:w-auto">
                  ดูตารางราคา
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">MangaTrans</span>
          </div>

          <div className="text-white/30 text-sm">
            &copy; 2024 MangaTrans. Global Manga Reader.
          </div>

          <div className="flex gap-6">
            <Link href="#" className="text-white/40 hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="text-white/40 hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="text-white/40 hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
