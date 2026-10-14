import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface DayRecord {
    date: string;
    net_pnl: number;
    trades_count: number;
    trades: Array<{
        id: number;
        symbol: string;
        direction: string;
        net_pnl: number;
        strategy_name?: string | null;
    }>;
}

interface Props {
    year: number;
    month: number;
    monthLabel: string;
    daysInMonth: number;
    firstDayOfWeek: number;
    dailyRecords: Record<string, DayRecord>;
}

export default function TradingCalendar({
    year,
    month,
    monthLabel,
    daysInMonth,
    firstDayOfWeek,
    dailyRecords,
}: Props) {
    const [selectedDay, setSelectedDay] = useState<DayRecord | null>(null);

    const navigateMonth = (delta: number) => {
        let nextMonth = month + delta;
        let nextYear = year;
        if (nextMonth < 1) {
            nextMonth = 12;
            nextYear -= 1;
        } else if (nextMonth > 12) {
            nextMonth = 1;
            nextYear += 1;
        }
        router.get('/calendar', { year: nextYear, month: nextMonth });
    };

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, dateStr, record: dailyRecords[dateStr] || null });
    }

    return (
        <AppLayout>
            <Head title="Trading Calendar — TradeSync" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Trading Calendar</h1>
                    <p className="text-sm text-zinc-400">Daily realized net P/L grouped by your local timezone.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm font-semibold text-white min-w-36 text-center">{monthLabel}</span>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                    >
                        Next →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-zinc-400 py-1">
                        {d}
                    </div>
                ))}

                {cells.map((cell, idx) => {
                    if (!cell) {
                        return <div key={`empty-${idx}`} className="h-28 rounded-xl bg-zinc-900/20" />;
                    }

                    const rec = cell.record;
                    const bgClass = !rec
                        ? 'bg-zinc-900/70 border-zinc-800/80'
                        : rec.net_pnl > 0
                          ? 'bg-emerald-500/15 border-emerald-500/40'
                          : rec.net_pnl < 0
                            ? 'bg-rose-500/15 border-rose-500/40'
                            : 'bg-zinc-800/70 border-zinc-700';

                    return (
                        <div
                            key={cell.dateStr}
                            onClick={() => rec && setSelectedDay(rec)}
                            className={`h-28 p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition hover:border-zinc-500 ${bgClass}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-300">{cell.day}</span>
                                <Link
                                    href={`/trades/create?date=${cell.dateStr}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] text-zinc-400 hover:text-white"
                                    title="Add trade on this day"
                                >
                                    +
                                </Link>
                            </div>

                            {rec ? (
                                <div>
                                    <p
                                        className={`text-sm font-bold ${
                                            rec.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                        }`}
                                    >
                                        {rec.net_pnl >= 0 ? '+' : ''}
                                        {rec.net_pnl.toFixed(2)}
                                    </p>
                                    <p className="text-[11px] text-zinc-400">{rec.trades_count} closed</p>
                                </div>
                            ) : (
                                <span className="text-[11px] text-zinc-600">No trades</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedDay && (
                <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">
                            Closed Trades on {selectedDay.date}
                        </h3>
                        <button onClick={() => setSelectedDay(null)} className="text-xs text-zinc-400">
                            Close
                        </button>
                    </div>
                    <div className="space-y-2">
                        {selectedDay.trades.map((t) => (
                            <Link
                                key={t.id}
                                href={`/trades/${t.id}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800"
                            >
                                <span className="text-sm font-medium text-white">
                                    {t.symbol} ({t.direction.toUpperCase()})
                                </span>
                                <span
                                    className={`text-sm font-semibold ${
                                        t.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                >
                                    {t.net_pnl >= 0 ? '+' : ''}
                                    {t.net_pnl.toFixed(2)}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}