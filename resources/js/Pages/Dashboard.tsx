import React, { FormEvent, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PortfolioMetrics, Trade } from '@/types/tradesync';
import { ArrowUpRight, ArrowDownRight, PlusCircle, TrendingUp, Award, Layers, Activity } from 'lucide-react';

interface StrategySummaryItem {
    id: number;
    name: string;
    closed_trades_count: number;
    net_pnl: number;
    win_rate: number;
    profit_factor: number | null;
}

interface Props {
    metrics: PortfolioMetrics;
    strategySummary: StrategySummaryItem[];
    recentTrades: Trade[];
    filters: {
        date_from?: string | null;
        date_to?: string | null;
    };
}

export default function Dashboard({ metrics, strategySummary = [], recentTrades = [], filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');

    const handleFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get('/dashboard', {
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setDateFrom('');
        setDateTo('');
        router.get('/dashboard');
    };

    const totalPnl = Number(metrics?.total_realized_net_pnl ?? 0);

    return (
        <AppLayout>
            <Head title="Dashboard" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Performance Dashboard</h1>
                    <p className="text-sm text-zinc-400">Real-time overview of your trading journal and execution metrics.</p>
                </div>
                <Link
                    href="/trades/create"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
                >
                    <PlusCircle className="h-4 w-4" />
                    Log New Trade
                </Link>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleFilter} className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 flex flex-wrap items-end gap-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">From Date</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">To Date</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors"
                >
                    Apply Filter
                </button>
                {(dateFrom || dateTo) && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        Reset
                    </button>
                )}
            </form>

            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                        <span>Realized Net P&L</span>
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className={`mt-2 text-2xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                        Expectancy: ${Number(metrics?.expectancy ?? 0).toFixed(2)} / trade
                    </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                        <span>Win Rate</span>
                        <Award className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">
                        {Number(metrics?.win_rate ?? 0).toFixed(1)}%
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                        {metrics?.winning_trades_count ?? 0}W / {metrics?.losing_trades_count ?? 0}L ({metrics?.closed_trades_count ?? 0} closed)
                    </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                        <span>Profit Factor</span>
                        <Activity className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">
                        {metrics?.profit_factor !== null && metrics?.profit_factor !== undefined
                            ? Number(metrics.profit_factor).toFixed(2)
                            : 'N/A'}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                        Avg Win: ${Number(metrics?.average_win ?? 0).toFixed(2)} | Avg Loss: ${Number(metrics?.average_loss ?? 0).toFixed(2)}
                    </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                        <span>Open Positions</span>
                        <Layers className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">
                        {metrics?.open_trades_count ?? 0}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                        Unrealized: ${Number(metrics?.unrealized_pnl ?? 0).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Strategy Summary & Recent Trades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strategy Performance */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-white">Strategy Performance</h2>
                        <Link href="/strategies" className="text-xs text-emerald-400 hover:underline">
                            Manage Strategies →
                        </Link>
                    </div>
                    {strategySummary.length === 0 ? (
                        <p className="text-sm text-zinc-500 py-6 text-center">No strategies created yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800">
                                    <tr>
                                        <th className="py-2.5">Strategy</th>
                                        <th className="py-2.5 text-right">Trades</th>
                                        <th className="py-2.5 text-right">Win Rate</th>
                                        <th className="py-2.5 text-right">Net P&L</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                    {strategySummary.map((s) => {
                                        const pnl = Number(s.net_pnl ?? 0);
                                        return (
                                            <tr key={s.id} className="hover:bg-zinc-800/30">
                                                <td className="py-3 font-medium text-zinc-200">{s.name}</td>
                                                <td className="py-3 text-right text-zinc-400">{s.closed_trades_count}</td>
                                                <td className="py-3 text-right text-zinc-300">{Number(s.win_rate ?? 0).toFixed(1)}%</td>
                                                <td className={`py-3 text-right font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Trades */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-white">Recent Trades</h2>
                        <Link href="/trades" className="text-xs text-emerald-400 hover:underline">
                            View All →
                        </Link>
                    </div>
                    {recentTrades.length === 0 ? (
                        <p className="text-sm text-zinc-500 py-6 text-center">No trades logged yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800">
                                    <tr>
                                        <th className="py-2.5">Symbol</th>
                                        <th className="py-2.5">Direction</th>
                                        <th className="py-2.5">Strategy</th>
                                        <th className="py-2.5 text-right">Net P&L</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                    {recentTrades.map((t) => {
                                        const pnl = Number(t.net_pnl ?? 0);
                                        return (
                                            <tr key={t.id} className="hover:bg-zinc-800/30">
                                                <td className="py-3 font-semibold text-white">
                                                    <Link href={`/trades/${t.id}`} className="hover:text-emerald-400">
                                                        {t.symbol}
                                                    </Link>
                                                </td>
                                                <td className="py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium uppercase ${
                                                        t.direction === 'long' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                                                    }`}>
                                                        {t.direction === 'long' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                        {t.direction}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-zinc-400">{t.strategy?.name || '—'}</td>
                                                <td className={`py-3 text-right font-semibold ${
                                                    t.status === 'open' ? 'text-amber-400' : pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                    {t.status === 'open' ? 'OPEN' : `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}