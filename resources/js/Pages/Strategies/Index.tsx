import React, { FormEvent, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Trash2, PlusCircle } from 'lucide-react';

interface StrategyItem {
    id: number;
    name: string;
    description: string | null;
    closed_trades_count: number;
    net_pnl: number;
    win_rate: number;
    profit_factor: number | null;
    expectancy: number;
}

export default function StrategiesIndex({ strategies = [] }: { strategies: StrategyItem[] }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = (e: FormEvent) => {
        e.preventDefault();
        router.post('/strategies', { name, description }, {
            onSuccess: () => {
                setName('');
                setDescription('');
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this strategy? Historical trades will be preserved.')) {
            router.delete(`/strategies/${id}`);
        }
    };

    return (
        <AppLayout>
            <Head title="Strategies" />

            <div>
                <h1 className="text-2xl font-bold text-white">Trading Playbooks & Strategies</h1>
                <p className="text-sm text-zinc-400">Define your setups and track quantitative edge per playbook.</p>
            </div>

            {/* New Strategy Form */}
            <form onSubmit={handleCreate} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-white">Create New Strategy</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        required
                        placeholder="Strategy Name (e.g. ICT Silver Bullet)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-white"
                    />
                    <input
                        type="text"
                        placeholder="Rules / Setup description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-white"
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Save Strategy
                    </button>
                </div>
            </form>

            {/* Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {strategies.map((s) => (
                    <div key={s.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{s.name}</h3>
                                    <p className="text-xs text-zinc-400 mt-1">{s.description || 'No description provided.'}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(s.id)}
                                    className="text-zinc-500 hover:text-rose-400 p-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-zinc-800/80 text-center">
                                <div>
                                    <span className="block text-xs text-zinc-400">Net P&L</span>
                                    <span className={`text-sm font-bold ${s.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        ${Number(s.net_pnl).toFixed(2)}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs text-zinc-400">Win Rate</span>
                                    <span className="text-sm font-bold text-white">{Number(s.win_rate).toFixed(1)}%</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-zinc-400">Trades</span>
                                    <span className="text-sm font-bold text-white">{s.closed_trades_count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}