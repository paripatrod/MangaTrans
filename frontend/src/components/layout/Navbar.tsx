"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi, UserProfile } from "@/lib/api";
import {
    User,
    LogOut,
    Settings,
    History,
    Sparkles,
    ChevronDown,
    Menu,
    X,
    Languages,
    Crown
} from "lucide-react";

export default function Navbar() {
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showMobile, setShowMobile] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (session?.user?.email) {
            loadProfile();
        }
    }, [session]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (showMenu && !(e.target as Element).closest('.profile-menu')) {
                setShowMenu(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [showMenu]);

    const loadProfile = async () => {
        if (!session?.user?.email) return;
        try {
            const data = await authApi.getProfile(session.user.email);
            setProfile(data);
        } catch (err) {
            console.error("Failed to load profile:", err);
        }
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? 'bg-black/60 backdrop-blur-xl border-b border-white/5 shadow-2xl'
                    : 'bg-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                                    <img src="/icon-192.png" alt="MangaTrans" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <span className="text-xl font-bold bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                                    MangaTrans
                                </span>
                                <div className="text-[10px] text-violet-400/80 font-medium tracking-wider uppercase">
                                    Unlock Manga
                                </div>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-1">
                            <NavLink href="/translate" icon={<Languages className="w-4 h-4" />}>
                                แปลมังงะ
                            </NavLink>
                            <NavLink href="/pricing" icon={<Crown className="w-4 h-4" />}>
                                สมาชิก
                            </NavLink>

                            <div className="w-px h-6 bg-white/10 mx-4" />

                            {status === "loading" ? (
                                <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
                            ) : session ? (
                                <div className="relative profile-menu">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                        className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                    >
                                        {session.user?.image ? (
                                            <img
                                                src={session.user.image}
                                                alt=""
                                                className="w-8 h-8 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                                <User className="w-4 h-4" />
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-white/80">
                                            {session.user?.name?.split(' ')[0] || 'ผู้ใช้'}
                                        </span>
                                        {profile?.isMember && (
                                            <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full text-[10px] font-medium text-violet-300 border border-violet-500/30">
                                                PRO
                                            </span>
                                        )}
                                        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 mt-3 w-64 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                                            >
                                                <div className="p-4 border-b border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        {session.user?.image ? (
                                                            <img src={session.user.image} alt="" className="w-12 h-12 rounded-xl" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                                                <User className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold truncate">{session.user?.name}</p>
                                                            <p className="text-xs text-white/40 truncate">{session.user?.email}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-2">
                                                    <DropdownLink href="/dashboard" icon={<Settings className="w-4 h-4" />} onClick={() => setShowMenu(false)}>
                                                        Dashboard
                                                    </DropdownLink>
                                                    <DropdownLink href="/history" icon={<History className="w-4 h-4" />} onClick={() => setShowMenu(false)}>
                                                        ประวัติการแปล
                                                    </DropdownLink>
                                                    {!profile?.isMember && (
                                                        <DropdownLink href="/pricing" icon={<Sparkles className="w-4 h-4" />} onClick={() => setShowMenu(false)} highlight>
                                                            อัปเกรด PRO
                                                        </DropdownLink>
                                                    )}
                                                    <div className="h-px bg-white/5 my-2" />
                                                    <button
                                                        onClick={() => signOut({ callbackUrl: "/" })}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        ออกจากระบบ
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/login"
                                        className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                                    >
                                        เข้าสู่ระบบ
                                    </Link>
                                    <Link href="/signup">
                                        <button className="relative group px-5 py-2.5 rounded-xl font-medium text-sm overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-transform group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
                                            <span className="relative">เริ่มใช้งานฟรี</span>
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobile(!showMobile)}
                            className="md:hidden w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                        >
                            {showMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {showMobile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] md:hidden"
                    >
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowMobile(false)} />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-gray-900/95 border-l border-white/10 p-6 pt-24"
                        >
                            {session ? (
                                <>
                                    <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl">
                                        {session.user?.image ? (
                                            <img src={session.user.image} alt="" className="w-14 h-14 rounded-xl" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                                <User className="w-7 h-7" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold">{session.user?.name}</p>
                                            {profile?.isMember ? (
                                                <span className="text-xs text-violet-400">PRO Member</span>
                                            ) : (
                                                <span className="text-xs text-white/40">Free</span>
                                            )}
                                        </div>
                                    </div>

                                    <nav className="space-y-2">
                                        <MobileNavLink href="/translate" icon={<Languages className="w-5 h-5" />} onClick={() => setShowMobile(false)}>
                                            แปลมังงะ
                                        </MobileNavLink>
                                        <MobileNavLink href="/dashboard" icon={<Settings className="w-5 h-5" />} onClick={() => setShowMobile(false)}>
                                            Dashboard
                                        </MobileNavLink>
                                        <MobileNavLink href="/history" icon={<History className="w-5 h-5" />} onClick={() => setShowMobile(false)}>
                                            ประวัติ
                                        </MobileNavLink>
                                        <MobileNavLink href="/pricing" icon={<Crown className="w-5 h-5" />} onClick={() => setShowMobile(false)}>
                                            สมาชิก
                                        </MobileNavLink>
                                        <div className="h-px bg-white/10 my-4" />
                                        <button
                                            onClick={() => signOut({ callbackUrl: "/" })}
                                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            ออกจากระบบ
                                        </button>
                                    </nav>
                                </>
                            ) : (
                                <>
                                    <nav className="space-y-2 mb-8">
                                        <MobileNavLink href="/translate" icon={<Languages className="w-5 h-5" />} onClick={() => setShowMobile(false)}>
                                            แปลมังงะ
                                        </MobileNavLink>
                                        <MobileNavLink href="/pricing" icon={<Crown className="w-5 h-5" />} onClick={() => setShowMobile(false)}>
                                            สมาชิก
                                        </MobileNavLink>
                                    </nav>
                                    <div className="space-y-3">
                                        <Link href="/login" onClick={() => setShowMobile(false)} className="block w-full text-center px-4 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium">
                                            เข้าสู่ระบบ
                                        </Link>
                                        <Link href="/signup" onClick={() => setShowMobile(false)} className="block w-full text-center px-4 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium">
                                            เริ่มใช้งานฟรี
                                        </Link>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
            {icon}
            {children}
        </Link>
    );
}

function DropdownLink({ href, icon, children, onClick, highlight }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void; highlight?: boolean }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm ${highlight
                ? 'text-violet-400 hover:bg-violet-500/10'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
        >
            {icon}
            {children}
        </Link>
    );
}

function MobileNavLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
            {icon}
            {children}
        </Link>
    );
}
