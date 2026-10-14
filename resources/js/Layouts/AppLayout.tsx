import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LiquidGlass } from '@ybouane/liquidglass';
import {
    BarChart3,
    Calendar as CalendarIcon,
    Eye,
    FolderKanban,
    Hexagon,
    LayoutDashboard,
    LogOut,
    Plus,
    Settings,
    Sparkles,
    TableProperties,
} from 'lucide-react';

interface SharedProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            preferred_currency: string;
            timezone: string;
            theme: 'dark' | 'light' | 'system';
        };
    };
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export default function AppLayout({ children }: PropsWithChildren) {
    const { auth, flash } = usePage<SharedProps>().props;
    const currentPath = window.location.pathname;
    const rootRef = useRef<HTMLDivElement>(null);
    const lgInstanceRef = useRef<any>(null);
    const [showLensOrb, setShowLensOrb] = useState(false);

    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    // Initialize @ybouane/liquidglass WebGL Shader Engine on the Root Scene
    useEffect(() => {
        let isMounted = true;

        const initWebGLLiquidGlass = async () => {
            if (!rootRef.current) return;

            try {
                if (lgInstanceRef.current) {
                    lgInstanceRef.current.destroy();
                    lgInstanceRef.current = null;
                }

                const glassNodes = rootRef.current.querySelectorAll<HTMLElement>(':scope > .yb-glass');
                if (glassNodes.length === 0) return;

                const instance = await LiquidGlass.init({
                    root: rootRef.current,
                    glassElements: glassNodes,
                    defaults: {
                        cornerRadius: 36,
                        blurAmount: 0.22,
                        refraction: 0.72,
                        chromAberration: 0.06,
                        opacity: 0.94,
                        saturation: 0.15,
                        tintStrength: 0.08,
                        brightness: 0.04,
                        shadowOpacity: 0.65,
                        bevelMode: 0,
                    },
                });

                if (isMounted) {
                    lgInstanceRef.current = instance;
                } else {
                    instance.destroy();
                }
            } catch (err) {
                console.warn('Veltrix WebGL shader fallback active:', err);
            }
        };

        const timer = setTimeout(initWebGLLiquidGlass, 120);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (lgInstanceRef.current) {
                try {
                    lgInstanceRef.current.destroy();
                } catch {}
                lgInstanceRef.current = null;
            }
        };
    }, [currentPath, showLensOrb]);

    // Interactive 3D Card Tilt & Specular Pointer Physics (Mouse + Mobile Touch)
    useEffect(() => {
        const updatePointer = (clientX: number, clientY: number) => {
            document.documentElement.style.setProperty('--mouse-x', `${clientX}px`);
            document.documentElement.style.setProperty('--mouse-y', `${clientY}px`);

            const cards = document.querySelectorAll<HTMLElement>('main .rounded-xl, main .rounded-2xl');
            cards.forEach((card) => {
                const rect = card.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                card.style.setProperty('--card-mouse-x', `${x}px`);
                card.style.setProperty('--card-mouse-y', `${y}px`);

                if (
                    clientX >= rect.left &&
                    clientX <= rect.right &&
                    clientY >= rect.top &&
                    clientY <= rect.bottom
                ) {
                    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -2.0;
                    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 2.0;
                    card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
                    card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
                } else {
                    card.style.setProperty('--tilt-x', '0deg');
                    card.style.setProperty('--tilt-y', '0deg');
                }
            });
        };

        const onMouseMove = (e: MouseEvent) => requestAnimationFrame(() => updatePointer(e.clientX, e.clientY));
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                requestAnimationFrame(() => updatePointer(t.clientX, t.clientY));
            }
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchstart', onTouchMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchstart', onTouchMove);
        };
    }, []);

    const navItems = [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Journal', href: '/trades', icon: TableProperties },
        { label: 'Analytics', href: '/analytics', icon: BarChart3 },
        { label: 'Calendar', href: '/calendar', icon: CalendarIcon },
        { label: 'Playbooks', href: '/strategies', icon: FolderKanban },
        { label: 'Settings', href: '/settings/profile', icon: Settings },
    ];

    const isItemActive = (href: string) => {
        if (href === '/trades') {
            return currentPath === '/trades' || (currentPath.startsWith('/trades/') && currentPath !== '/trades/create');
        }
        return currentPath === href || currentPath.startsWith(href);
    };

    return (
        <div
            id="veltrix-webgl-root"
            ref={rootRef}
            className="relative min-h-screen bg-[#03050a] text-zinc-100 flex flex-col selection:bg-emerald-400/30 selection:text-emerald-100"
        >
            {/* 1. SIBLING SCENE BACKGROUND (Sampled by @ybouane/liquidglass WebGL Shaders) */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div
                    className="absolute -top-28 left-1/4 h-[34rem] w-[34rem] rounded-full bg-emerald-500/25 blur-[135px]"
                    style={{ animation: 'veltrixAurora 16s ease-in-out infinite' }}
                />
                <div
                    className="absolute top-24 right-1/5 h-[30rem] w-[30rem] rounded-full bg-cyan-500/20 blur-[145px]"
                    style={{ animation: 'veltrixAurora 20s ease-in-out infinite reverse' }}
                />
                <div
                    className="absolute -bottom-32 left-1/3 h-[36rem] w-[36rem] rounded-full bg-indigo-500/20 blur-[155px]"
                    style={{ animation: 'veltrixAurora 24s ease-in-out infinite' }}
                />
                {/* High-contrast grid pattern so WebGL refraction visibly bends lines at glass edges */}
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            {/* 2. TOP HORIZONTAL APPLE WEBGL LIQUID GLASS MENU BAR (Direct child of root) */}
            <header
                className="yb-glass sticky top-4 z-50 mx-auto mt-4 w-[calc(100%-1.5rem)] max-w-7xl px-3 sm:px-5 py-2.5"
                data-config={JSON.stringify({
                    cornerRadius: 42,
                    blurAmount: 0.25,
                    refraction: 0.78,
                    chromAberration: 0.06,
                    button: false,
                    bevelMode: 0,
                })}
            >
                <div className="yb-glass-content flex items-center justify-between gap-3">
                    {/* Brand Identity: Veltrix */}
                    <Link
                        href="/dashboard"
                        className="apple-pill-btn flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 shrink-0"
                    >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-400 text-zinc-950 flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.6)]">
                            <Hexagon className="h-4 w-4 stroke-[2.5]" />
                        </div>
                        <div className="pr-1">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold tracking-tight text-white text-sm">Veltrix</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                                    Quant OS
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Center Horizontal Segmented Navigation (Apple Photos / Music Blueprint) */}
                    <nav aria-label="Veltrix Navigation" className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isItemActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`apple-pill-btn flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                                        active
                                            ? 'veltrix-active-pill text-white'
                                            : 'text-zinc-300/85 hover:text-white hover:bg-white/[0.08]'
                                    }`}
                                >
                                    <Icon className={`h-3.5 w-3.5 ${active ? 'text-emerald-300' : 'text-zinc-400'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Controls: Draggable WebGL Lens Toggle + Log Trade + User */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowLensOrb((v) => !v)}
                            className={`apple-pill-btn hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
                                showLensOrb
                                    ? 'bg-cyan-400/20 border-cyan-300/50 text-cyan-200'
                                    : 'bg-white/[0.06] border-white/15 text-zinc-300 hover:text-white'
                            }`}
                            title="Toggle Draggable WebGL Refraction Lens (ybouane demo)"
                        >
                            <Eye className="h-3.5 w-3.5 text-cyan-300" />
                            <span>Glass Lens</span>
                        </button>

                        <Link
                            href="/trades/create"
                            className="apple-pill-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-b from-emerald-300 to-emerald-500 text-zinc-950 shadow-[0_6px_20px_rgba(16,185,129,0.45),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                        >
                            <Plus className="h-3.5 w-3.5 stroke-[2.75]" />
                            <span>Log Trade</span>
                        </Link>

                        <Link
                            href="/settings/profile"
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15"
                        >
                            <Sparkles className="h-3 w-3 text-emerald-300" />
                            <span className="text-xs font-medium text-zinc-200 max-w-[100px] truncate">
                                {auth?.user?.name}
                            </span>
                        </Link>

                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="apple-pill-btn p-2 rounded-full text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25"
                            title="Sign Out"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* 3. OPTIONAL DRAGGABLE WEBGL DOME MAGNIFIER LENS (From liquid-glass.ybouane.com playground!) */}
            {showLensOrb && (
                <div
                    className="yb-glass fixed top-28 right-12 z-50 w-56 h-36 cursor-grab active:cursor-grabbing flex items-center justify-center select-none"
                    data-config={JSON.stringify({
                        floating: true,
                        button: true,
                        bevelMode: 1,
                        cornerRadius: 72,
                        blurAmount: 0.04,
                        refraction: 0.88,
                        chromAberration: 0.09,
                        tintStrength: 0.12,
                    })}
                >
                    <div className="yb-glass-content text-center pointer-events-none px-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/90 drop-shadow">
                            Veltrix Optical Lens
                        </span>
                        <span className="block text-[10px] text-emerald-200/80 mt-0.5">
                            Drag me over charts & text
                        </span>
                    </div>
                </div>
            )}

            {/* 4. MAIN SCENE WORKSPACE (Marked data-dynamic so WebGL glass refracts live page content) */}
            <main data-dynamic="true" className="relative z-10 flex-1 flex flex-col min-w-0 pt-6 pb-32 md:pb-16">
                {flash?.success && (
                    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 mb-4">
                        <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/40 px-5 py-3.5 text-sm font-medium text-emerald-200 flex items-center gap-2.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                            {flash.success}
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 mb-4">
                        <div className="rounded-2xl bg-rose-500/15 border border-rose-400/40 px-5 py-3.5 text-sm font-medium text-rose-200 flex items-center gap-2.5">
                            <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_10px_#fb7185]" />
                            {flash.error}
                        </div>
                    </div>
                )}

                <div className="px-4 sm:px-6 md:px-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8">
                    {children}
                </div>
            </main>

            {/* 5. MOBILE HORIZONTAL WEBGL LIQUID GLASS PILL BAR (Direct child of root) */}
            <nav
                aria-label="Mobile Navigation"
                className="yb-glass md:hidden fixed bottom-4 inset-x-3 z-50 p-1.5"
                data-config={JSON.stringify({
                    cornerRadius: 40,
                    blurAmount: 0.25,
                    refraction: 0.75,
                    chromAberration: 0.06,
                    bevelMode: 0,
                })}
            >
                <div className="yb-glass-content flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`apple-pill-btn flex-1 min-w-[54px] flex flex-col items-center justify-center py-2 px-2 rounded-full transition-all duration-300 ${
                                    active
                                        ? 'veltrix-active-pill text-white scale-105'
                                        : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                <Icon className={`h-4 w-4 ${active ? 'text-emerald-300' : ''}`} />
                                <span className="text-[10px] font-semibold mt-0.5 tracking-tight">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}