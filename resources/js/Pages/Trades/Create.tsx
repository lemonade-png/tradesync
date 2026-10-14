import React, { useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { MistakeTag, Strategy } from '@/types/tradesync';

interface Props {
    strategies: Strategy[];
    mistakeTags: MistakeTag[];
    prefillDate?: string | null;
}

export default function CreateTrade({ strategies, mistakeTags, prefillDate }: Props) {
    const [customTagInput, setCustomTagInput] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        symbol: '',
        market_type: 'crypto',
        direction: 'long',
        status: 'closed',
        entry_price: '',
        exit_price: '',
        mark_price: '',
        quantity: '',
        contract_multiplier: '1',
        stop_loss: '',
        take_profit: '',
        fees: '0',
        funding_costs: '0',
        entry_time: prefillDate ? `${prefillDate}T09:00` : '',
        exit_time: prefillDate ? `${prefillDate}T15:00` : '',
        strategy_id: '',
        setup_description: '',
        notes: '',
        mistake_tags: [] as string[],
        screenshot: null as File | null,
    });

    // Live Client-Side P/L Estimate Preview (Authoritative calculation runs on server)
    const livePreview = useMemo(() => {
        const entry = parseFloat(data.entry_price);
        const refPrice = data.status === 'closed' ? parseFloat(data.exit_price) : parseFloat(data.mark_price);
        const qty = parseFloat(data.quantity);
        const mult = parseFloat(data.contract_multiplier || '1');
        const fees = parseFloat(data.fees || '0');
        const funding = parseFloat(data.funding_costs || '0');

        if (isNaN(entry) || isNaN(refPrice) || isNaN(qty) || entry <= 0 || refPrice <= 0 || qty <= 0) {
            return null;
        }

        const gross =
            data.direction === 'long'
                ? (refPrice - entry) * qty * mult
                : (entry - refPrice) * qty * mult;
        const net = gross - (isNaN(fees) ? 0 : fees) - (isNaN(funding) ? 0 : funding);

        return {
            gross: gross.toFixed(2),
            net: net.toFixed(2),
            isEstimate: true,
        };
    }, [data]);

    const toggleTag = (name: string) => {
        if (data.mistake_tags.includes(name)) {
            setData('mistake_tags', data.mistake_tags.filter((t) => t !== name));
        } else {
            setData('mistake_tags', [...data.mistake_tags, name]);
        }
    };

    const addCustomTag = () => {
        const trimmed = customTagInput.trim();
        if (trimmed && !data.mistake_tags.includes(trimmed)) {
            setData('mistake_tags', [...data.mistake_tags, trimmed]);
            setCustomTagInput('');
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/trades', { forceFormData: true });
    };

    return (
        <AppLayout>
            <Head title="Log Trade — TradeSync" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Record Trade</h1>
                    <p className="text-sm text-zinc-400">
                        Enter execution details, costs, and post-trade review notes.
                    </p>
                </div>

                {livePreview && (
                    <div className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-right">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                            Live P/L Preview (Estimate)
                        </span>
                        <span
                            className={`text-lg font-bold ${
                                parseFloat(livePreview.net) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                        >
                            Net: {livePreview.net} (Gross: {livePreview.gross})
                        </span>
                    </div>
                )}
            </div>

            <form onSubmit={submit} className="space-y-6 bg-zinc-900/90 border border-zinc-800 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Symbol *</label>
                        <input
                            type="text"
                            placeholder="BTCUSDT / XAUUSD"
                            value={data.symbol}
                            onChange={(e) => setData('symbol', e.target.value.toUpperCase())}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        {errors.symbol && <p className="text-xs text-rose-400 mt-1">{errors.symbol}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Market Type *</label>
                        <select
                            value={data.market_type}
                            onChange={(e) => setData('market_type', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        >
                            <option value="crypto">Crypto</option>
                            <option value="forex">Forex</option>
                            <option value="stocks">Stocks</option>
                            <option value="commodities">Commodities</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Direction *</label>
                        <select
                            value={data.direction}
                            onChange={(e) => setData('direction', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        >
                            <option value="long">Long</option>
                            <option value="short">Short</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Status *</label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        >
                            <option value="closed">Closed</option>
                            <option value="open">Open</option>
                        </select>
                    </div>
                </div>

                {/* Prices & Quantities */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Entry Price *</label>
                        <input
                            type="number"
                            step="any"
                            value={data.entry_price}
                            onChange={(e) => setData('entry_price', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        {errors.entry_price && <p className="text-xs text-rose-400 mt-1">{errors.entry_price}</p>}
                    </div>

                    {data.status === 'closed' ? (
                        <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">Exit Price *</label>
                            <input
                                type="number"
                                step="any"
                                value={data.exit_price}
                                onChange={(e) => setData('exit_price', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                            />
                            {errors.exit_price && <p className="text-xs text-rose-400 mt-1">{errors.exit_price}</p>}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">
                                Current Mark Price (Optional)
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={data.mark_price}
                                onChange={(e) => setData('mark_price', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Quantity / Size *</label>
                        <input
                            type="number"
                            step="any"
                            value={data.quantity}
                            onChange={(e) => setData('quantity', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        {errors.quantity && <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Strategy</label>
                        <select
                            value={data.strategy_id}
                            onChange={(e) => setData('strategy_id', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        >
                            <option value="">— Unassigned —</option>
                            {strategies.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Risk, Costs, Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Stop Loss</label>
                        <input
                            type="number"
                            step="any"
                            value={data.stop_loss}
                            onChange={(e) => setData('stop_loss', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Take Profit</label>
                        <input
                            type="number"
                            step="any"
                            value={data.take_profit}
                            onChange={(e) => setData('take_profit', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Trading Fees</label>
                        <input
                            type="number"
                            step="any"
                            value={data.fees}
                            onChange={(e) => setData('fees', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Funding Costs</label>
                        <input
                            type="number"
                            step="any"
                            value={data.funding_costs}
                            onChange={(e) => setData('funding_costs', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Entry Date &amp; Time *</label>
                        <input
                            type="datetime-local"
                            value={data.entry_time}
                            onChange={(e) => setData('entry_time', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        {errors.entry_time && <p className="text-xs text-rose-400 mt-1">{errors.entry_time}</p>}
                    </div>

                    {data.status === 'closed' && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1">
                                Exit Date &amp; Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={data.exit_time}
                                onChange={(e) => setData('exit_time', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                            />
                            {errors.exit_time && <p className="text-xs text-rose-400 mt-1">{errors.exit_time}</p>}
                        </div>
                    )}
                </div>

                {/* Mistake Tags */}
                <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-2">Mistake Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {mistakeTags.map((tag) => {
                            const selected = data.mistake_tags.includes(tag.name);
                            return (
                                <button
                                    type="button"
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.name)}
                                    className={`px-3 py-1 rounded-full text-xs border transition ${
                                        selected
                                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                                    }`}
                                >
                                    {tag.name}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Add custom mistake tag (e.g., FOMO, Moved Stop-Loss)"
                            value={customTagInput}
                            onChange={(e) => setCustomTagInput(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white w-72"
                        />
                        <button
                            type="button"
                            onClick={addCustomTag}
                            className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs text-zinc-200"
                        >
                            + Add Tag
                        </button>
                    </div>
                </div>

                {/* Notes & Screenshot */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Setup Description</label>
                        <textarea
                            rows={3}
                            value={data.setup_description}
                            onChange={(e) => setData('setup_description', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Personal Review Notes</label>
                        <textarea
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Chart Screenshot (PNG/JPG/WEBP, max 5MB, stored privately)
                    </label>
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => setData('screenshot', e.target.files ? e.target.files[0] : null)}
                        className="text-xs text-zinc-400"
                    />
                    {errors.screenshot && <p className="text-xs text-rose-400 mt-1">{errors.screenshot}</p>}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm"
                    >
                        {processing ? 'Saving...' : 'Save Trade to Journal'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}