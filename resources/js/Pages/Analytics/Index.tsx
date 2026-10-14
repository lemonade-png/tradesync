import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PortfolioMetrics } from '@/types/tradesync';

interface StrategyComparison {
    id: number;
    name: string;
    closed_trades_count: number;
    net_pnl: number;
    win_rate: number;
    profit_factor: number | null;
    expectancy: number;
}

interface MistakeAnalysis {
    id: number;
    name: string;
    occurrences: number;
    total_pnl_impact: number;
}

interface Props {
    metrics: PortfolioMetrics;
    strategyComparison: StrategyComparison[];
    mistakeTagAnalysis: MistakeAnalysis[];
}

export default function AnalyticsIndex({ metrics, strategyComparison = [], mistakeTagAnalysis = [] }: Props) {
    return (
        <AppLayout>
            <Head title="Analytics" />

            <div>
                <h1 className="text-2xl font-bold text-white">Deep Performance Analytics</h1>
                <p className="text-sm text-zinc-400">Directional edge, asset class breakdown, and psychological mistake cost analysis.</p>
            </div>

            {/* Direction Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">Long Positions</h3>
                    <div className="text-2xl font-bold text-emerald-400">
                        ${Number(metrics?.direction_comparison?.long?.net_pnl ?? 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                        Win Rate: {Number(metrics?.direction_comparison?.long?.win_rate ?? 0).toFixed(1)}% ({metrics?.direction_comparison?.long?.count ?? 0} trades)
                    </p>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">Short Positions</h3>
                    <div className="text-2xl font-bold text-rose-400">
                        ${Number(metrics?.direction_comparison?.short?.net_pnl ?? 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                        Win Rate: {Number(metrics?.direction_comparison?.short?.win_rate ?? 0).toFixed(1)}% ({metrics?.direction_comparison?.short?.count ?? 0} trades)
                    </p>
                </div>
            </div>

            {/* Strategy Comparison */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-4">Strategy Edge Comparison</h2>
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800">
                        <tr>
                            <th className="py-2.5">Strategy</th>
                            <th className="py-2.5 text-right">Closed Trades</th>
                            <th className="py-2.5 text-right">Win Rate</th>
                            <th className="py-2.5 text-right">Profit Factor</th>
                            <th className="py-2.5 text-right">Expectancy</th>
                            <th className="py-2.5 text-right">Net P&L</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                        {strategyComparison.map((s) => (
                            <tr key={s.id}>
                                <td className="py-3 font-medium text-white">{s.name}</td>
                                <td className="py-3 text-right text-zinc-400">{s.closed_trades_count}</td>
                                <td className="py-3 text-right text-zinc-300">{Number(s.win_rate).toFixed(1)}%</td>
                                <td className="py-3 text-right text-zinc-300">{s.profit_factor ?? 'N/A'}</td>
                                <td className="py-3 text-right text-zinc-300">${Number(s.expectancy).toFixed(2)}</td>
                                <td className={`py-3 text-right font-semibold ${s.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ${Number(s.net_pnl).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mistake Tag Analysis */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-4">Psychological Mistake Impact</h2>
                {mistakeTagAnalysis.length === 0 ? (
                    <p className="text-sm text-zinc-500">No mistake tags recorded on closed trades yet.</p>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800">
                            <tr>
                                <th className="py-2.5">Mistake Tag</th>
                                <th className="py-2.5 text-right">Occurrences</th>
                                <th className="py-2.5 text-right">Total P&L Impact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {mistakeTagAnalysis.map((tag) => (
                                <tr key={tag.id}>
                                    <td className="py-3 font-medium text-zinc-200">{tag.name}</td>
                                    <td className="py-3 text-right text-zinc-400">{tag.occurrences}</td>
                                    <td className={`py-3 text-right font-semibold ${tag.total_pnl_impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        ${Number(tag.total_pnl_impact).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AppLayout>
    );
}