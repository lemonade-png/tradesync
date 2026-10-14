import React, { FormEvent, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CheckCircle2, UploadCloud, Shield, User as UserIcon, Link2 } from 'lucide-react';

export default function EditProfile({ status }: { mustVerifyEmail?: boolean; status?: string }) {
    const { auth } = usePage<any>().props;
    const user = auth.user;

    // Profile Form
    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
    });

    // Password Form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // NinjaTrader / Tradovate CSV Import State
    const [broker, setBroker] = useState<'ninjatrader' | 'tradovate'>('ninjatrader');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const submitProfile = (e: FormEvent) => {
        e.preventDefault();
        profileForm.patch('/profile');
    };

    const submitPassword = (e: FormEvent) => {
        e.preventDefault();
        passwordForm.put('/password', {
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handleBrokerImport = (e: FormEvent) => {
        e.preventDefault();
        if (!csvFile) return;
        setImporting(true);
        router.post(
            '/trades/import/csv',
            { broker, csv_file: csvFile },
            {
                forceFormData: true,
                onFinish: () => setImporting(false),
            }
        );
    };

    return (
        <AppLayout>
            <Head title="Settings & Broker Sync" />

            <div>
                <h1 className="text-2xl font-bold text-white">Settings & Broker Integrations</h1>
                <p className="text-sm text-zinc-400">
                    Manage your account preferences and sync trade history from NinjaTrader 8 or Tradovate.
                </p>
            </div>

            {/* Broker Sync Section (NinjaTrader & Tradovate) */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Link2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-white">NinjaTrader 8 & Tradovate Trade Sync</h2>
                        <p className="text-xs text-zinc-400">
                            Automatically parse futures executions, commissions, and contract multipliers (NQ, ES, MNQ, MES, GC, CL).
                        </p>
                    </div>
                </div>

                <form onSubmit={handleBrokerImport} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Select Platform</label>
                        <select
                            value={broker}
                            onChange={(e) => setBroker(e.target.value as 'ninjatrader' | 'tradovate')}
                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="ninjatrader">NinjaTrader 8 (Trade Performance CSV)</option>
                            <option value="tradovate">Tradovate (Orders / Performance CSV)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Upload Exported CSV File</label>
                        <input
                            type="file"
                            accept=".csv,.txt"
                            required
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-xs file:font-medium file:text-emerald-400"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={importing || !csvFile}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                        >
                            <UploadCloud className="h-4 w-4" />
                            {importing ? 'Importing Executions...' : 'Sync Trades Now'}
                        </button>
                    </div>
                </form>

                <div className="rounded-lg bg-zinc-950/80 border border-zinc-800/80 p-4 text-xs text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-300">How to export from your platform:</p>
                    <p>• <span className="text-emerald-400">NinjaTrader 8:</span> Open Control Center → Trade Performance → Trades tab → Right-click grid → Export → Save as CSV.</p>
                    <p>• <span className="text-emerald-400">Tradovate:</span> Open Application Settings → Reports → Performance / Orders → Download CSV.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Information */}
                <form onSubmit={submitProfile} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <UserIcon className="h-4 w-4 text-emerald-400" />
                        <h2 className="text-base font-semibold text-white">Profile Information</h2>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Trader Name</label>
                        <input
                            type="text"
                            value={profileForm.data.name}
                            onChange={(e) => profileForm.setData('name', e.target.value)}
                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={profileForm.data.email}
                            onChange={(e) => profileForm.setData('email', e.target.value)}
                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={profileForm.processing}
                            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
                        >
                            Save Changes
                        </button>
                        {profileForm.recentlySuccessful && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                            </span>
                        )}
                    </div>
                </form>

                {/* Update Password */}
                <form onSubmit={submitPassword} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <h2 className="text-base font-semibold text-white">Update Password</h2>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Current Password</label>
                        <input
                            type="password"
                            value={passwordForm.data.current_password}
                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">New Password</label>
                        <input
                            type="password"
                            value={passwordForm.data.password}
                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={passwordForm.data.password_confirmation}
                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={passwordForm.processing}
                            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}