import React, { FormEvent, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { MistakeTag, Strategy, Trade } from '@/types/tradesync';
import { Download, PlusCircle, Trash2, Eye } from 'lucide-react';

interface PaginatedTrades {
    data: Trade[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    trades: PaginatedTrades;
    strategies: Strategy[];
    mistakeTags: MistakeTag[];
    filters: Record<string, string | undefined>;
}

export default function TradesIndex({ trades, strategies = [], filters = {} }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [direction, setDirection] = useState(filters.direction || '');
    const [strategyId, setStrategyId] = useState(filters.strategy_id || '');

    const handleFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get('/trades', {
            search: search || undefined,
            status: status || undefined,
            direction: direction || undefined,
            strategy_id: strategyId || undefined,
        }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this trade from your journal?')) {
            router.delete(`/trades/${id}`);
        }
    };

    return (
        <AppLayout>
            <Head title="Trade History" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Trade History</h1>
                    <p className="text-sm text-zinc-400">Filter, audit, and export your historical executions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/trades/export/csv"
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </a>
                    <Link
                        href="/trades/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Add Trade
                    </Link>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleFilter} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
                <input
                    type="text"
                    placeholder="Search symbol (e.g. BTCUSDT)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
                />
                <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
                >
                    <option value="">All Directions</option>
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
                >
                    <option value="">All Statuses</option>
                    <option value="closed">Closed</option>
                    <option value="open">Open</option>
                </select>
                <select
                    value={strategyId}
                    onChange={(e) => setStrategyId(e.target.value)}
                    className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
                >
                    <option value="">All Strategies</option>
                    {strategies.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-medium text-sm px-4 py-2 hover:bg-emerald-500/30 transition-colors"
                >
                    Filter Trades
                </button>
            </form>

            {/* Table */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/90 border-b border-zinc-800">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Symbol</th>
                                <th className="px-4 py-3">Market</th>
                                <th className="px-4 py-3">Side</th>
                                <th className="px-4 py-3">Entry / Exit</th>
                                <th className="px-4 py-3">Strategy</th>
                                <th className="px-4 py-3 text-right">Net P&L</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {trades.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                                        No trades match your criteria.
                                    </td>
                                </tr>
                            ) : (
                                trades.data.map((t) => {
                                    const pnl = Number(t.net_pnl ?? 0);
                                    return (
                                        <tr key={t.id} className="hover:bg-zinc-800/30">
                                            <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                                                {new Date(t.entry_time).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-white">{t.symbol}</td>
                                            <td className="px-4 py-3 uppercase text-xs text-zinc-400">{t.market_type}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                                                    t.direction === 'long' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                                                }`}>
                                                    {t.direction}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-300">
                                                ${Number(t.entry_price).toFixed(2)} → {t.exit_price ? `$${Number(t.exit_price).toFixed(2)}` : 'Open'}
                                            </td>
                                            <td className="px-4 py-3 text-zinc-400">{t.strategy?.name || '—'}</td>
                                            <td className={`px-4 py-3 text-right font-semibold ${
                                                t.status === 'open' ? 'text-amber-400' : pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                                {t.status === 'open' ? 'OPEN' : `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Link
                                                    href={`/trades/${t.id}`}
                                                    className="inline-flex items-center p-1.5 text-zinc-400 hover:text-white"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(t.id)}
                                                    className="inline-flex items-center p-1.5 text-zinc-400 hover:text-rose-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}