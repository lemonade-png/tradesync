import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Trade } from '@/types/tradesync';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function ShowTrade({ trade }: { trade: Trade }) {
    const pnl = Number(trade.net_pnl ?? 0);

    const handleDelete = () => {
        if (confirm('Delete this trade permanently?')) {
            router.delete(`/trades/${trade.id}`);
        }
    };

    return (
        <AppLayout>
            <Head title={`Trade ${trade.symbol}`} />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/trades" className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{trade.symbol} ({trade.direction.toUpperCase()})</h1>
                        <p className="text-sm text-zinc-400">Executed on {new Date(trade.entry_time).toLocaleString()}</p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-500/15 border border-rose-500/30 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/25"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete Trade
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase">Execution Details</h2>
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Status:</span> <span className="text-white uppercase">{trade.status}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Market:</span> <span className="text-white uppercase">{trade.market_type}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Entry Price:</span> <span className="text-white">${Number(trade.entry_price).toFixed(4)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Exit Price:</span> <span className="text-white">{trade.exit_price ? `$${Number(trade.exit_price).toFixed(4)}` : '—'}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Quantity:</span> <span className="text-white">{Number(trade.quantity)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Fees:</span> <span className="text-white">${Number(trade.fees).toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm border-t border-zinc-800 pt-2">
                        <span className="text-zinc-400 font-semibold">Net P&L:</span>
                        <span className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {trade.status === 'open' ? 'OPEN' : `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
                        </span>
                    </div>
                </div>

                <div className="md:col-span-2 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-4">
                    <div>
                        <h3 className="text-xs font-semibold uppercase text-zinc-400">Strategy</h3>
                        <p className="text-base text-white mt-1">{trade.strategy?.name || 'No strategy assigned'}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase text-zinc-400">Setup Description</h3>
                        <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{trade.setup_description || 'No setup description provided.'}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase text-zinc-400">Journal Notes</h3>
                        <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{trade.notes || 'No notes recorded.'}</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}