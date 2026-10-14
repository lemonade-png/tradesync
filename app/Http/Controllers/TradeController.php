<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTradeRequest;
use App\Models\MistakeTag;
use App\Models\Trade;
use App\Services\FinancialCalculatorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TradeController extends Controller
{
    public function index(Request $request, FinancialCalculatorService $calculator): Response
    {
        $user = $request->user();
        $query = $this->buildFilteredQuery($request);

        $sortField = in_array($request->query('sort'), ['entry_time', 'symbol', 'quantity', 'status'], true)
            ? $request->query('sort')
            : 'entry_time';
        $sortDir = $request->query('direction_sort') === 'asc' ? 'asc' : 'desc';

        $paginated = $query->orderBy($sortField, $sortDir)
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Trades/Index', [
            'trades' => $paginated,
            'strategies' => $user->strategies()->orderBy('name')->get(['id', 'name']),
            'mistakeTags' => $user->mistakeTags()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only([
                'search', 'date_from', 'date_to', 'market_type',
                'direction', 'status', 'outcome', 'strategy_id', 'mistake_tag_id',
                'sort', 'direction_sort',
            ]),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Trades/Create', [
            'strategies' => $user->strategies()->orderBy('name')->get(['id', 'name']),
            'mistakeTags' => $user->mistakeTags()->orderBy('name')->get(['id', 'name']),
            'prefillDate' => $request->query('date'),
        ]);
    }

    public function store(StoreTradeRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $trade = DB::transaction(function () use ($user, $validated, $request) {
            $screenshotPath = null;
            if ($request->hasFile('screenshot')) {
                $file = $request->file('screenshot');
                $filename = Str::uuid()->toString().'.'.$file->guessExtension();
                $screenshotPath = $file->storeAs('trade-screenshots/'.$user->id, $filename, 'local');
            }

            $trade = $user->trades()->create([
                'strategy_id' => $validated['strategy_id'] ?? null,
                'symbol' => strtoupper(trim($validated['symbol'])),
                'market_type' => $validated['market_type'],
                'direction' => $validated['direction'],
                'status' => $validated['status'],
                'entry_price' => $validated['entry_price'],
                'exit_price' => $validated['status'] === 'closed' ? ($validated['exit_price'] ?? null) : null,
                'mark_price' => $validated['status'] === 'open' ? ($validated['mark_price'] ?? null) : null,
                'quantity' => $validated['quantity'],
                'contract_multiplier' => $validated['contract_multiplier'] ?? 1.00000000,
                'stop_loss' => $validated['stop_loss'] ?? null,
                'take_profit' => $validated['take_profit'] ?? null,
                'fees' => $validated['fees'] ?? 0,
                'funding_costs' => $validated['funding_costs'] ?? 0,
                'entry_time' => $validated['entry_time'],
                'exit_time' => $validated['status'] === 'closed' ? ($validated['exit_time'] ?? null) : null,
                'setup_description' => $validated['setup_description'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'screenshot_path' => $screenshotPath,
            ]);

            if (! empty($validated['mistake_tags'])) {
                $tagIds = collect($validated['mistake_tags'])
                    ->map(fn (string $tagName) => trim($tagName))
                    ->filter()
                    ->unique()
                    ->map(function (string $tagName) use ($user) {
                        return MistakeTag::firstOrCreate([
                            'user_id' => $user->id,
                            'name' => $tagName,
                        ])->id;
                    });
                $trade->mistakeTags()->sync($tagIds);
            }

            return $trade;
        });

        return redirect()->route('trades.show', $trade)
            ->with('success', 'Trade recorded in journal.');
    }

    public function show(Trade $trade): Response
    {
        Gate::authorize('view', $trade);
        $trade->load(['strategy', 'mistakeTags']);

        return Inertia::render('Trades/Show', [
            'trade' => $trade,
        ]);
    }

    public function edit(Request $request, Trade $trade): Response
    {
        Gate::authorize('update', $trade);
        $trade->load(['strategy', 'mistakeTags']);
        $user = $request->user();

        return Inertia::render('Trades/Edit', [
            'trade' => $trade,
            'strategies' => $user->strategies()->orderBy('name')->get(['id', 'name']),
            'mistakeTags' => $user->mistakeTags()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(StoreTradeRequest $request, Trade $trade): RedirectResponse
    {
        Gate::authorize('update', $trade);
        $user = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($user, $trade, $validated, $request) {
            $screenshotPath = $trade->screenshot_path;

            if ($request->hasFile('screenshot')) {
                if ($screenshotPath && Storage::disk('local')->exists($screenshotPath)) {
                    Storage::disk('local')->delete($screenshotPath);
                }
                $file = $request->file('screenshot');
                $filename = Str::uuid()->toString().'.'.$file->guessExtension();
                $screenshotPath = $file->storeAs('trade-screenshots/'.$user->id, $filename, 'local');
            }

            $trade->update([
                'strategy_id' => $validated['strategy_id'] ?? null,
                'symbol' => strtoupper(trim($validated['symbol'])),
                'market_type' => $validated['market_type'],
                'direction' => $validated['direction'],
                'status' => $validated['status'],
                'entry_price' => $validated['entry_price'],
                'exit_price' => $validated['status'] === 'closed' ? ($validated['exit_price'] ?? null) : null,
                'mark_price' => $validated['status'] === 'open' ? ($validated['mark_price'] ?? null) : null,
                'quantity' => $validated['quantity'],
                'contract_multiplier' => $validated['contract_multiplier'] ?? 1.00000000,
                'stop_loss' => $validated['stop_loss'] ?? null,
                'take_profit' => $validated['take_profit'] ?? null,
                'fees' => $validated['fees'] ?? 0,
                'funding_costs' => $validated['funding_costs'] ?? 0,
                'entry_time' => $validated['entry_time'],
                'exit_time' => $validated['status'] === 'closed' ? ($validated['exit_time'] ?? null) : null,
                'setup_description' => $validated['setup_description'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'screenshot_path' => $screenshotPath,
            ]);

            $tagNames = $validated['mistake_tags'] ?? [];
            $tagIds = collect($tagNames)
                ->map(fn (string $tagName) => trim($tagName))
                ->filter()
                ->unique()
                ->map(function (string $tagName) use ($user) {
                    return MistakeTag::firstOrCreate([
                        'user_id' => $user->id,
                        'name' => $tagName,
                    ])->id;
                });
            $trade->mistakeTags()->sync($tagIds);
        });

        return redirect()->route('trades.show', $trade)
            ->with('success', 'Trade updated.');
    }

    public function destroy(Trade $trade): RedirectResponse
    {
        Gate::authorize('delete', $trade);

        if ($trade->screenshot_path && Storage::disk('local')->exists($trade->screenshot_path)) {
            Storage::disk('local')->delete($trade->screenshot_path);
        }

        $trade->delete();

        return redirect()->route('trades.index')
            ->with('success', 'Trade deleted.');
    }

    public function screenshot(Trade $trade)
    {
        Gate::authorize('view', $trade);

        if (! $trade->screenshot_path || ! Storage::disk('local')->exists($trade->screenshot_path)) {
            abort(404, 'Screenshot attachment not found.');
        }

        return Storage::disk('local')->response($trade->screenshot_path, null, [
            'Content-Security-Policy' => "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $trades = $this->buildFilteredQuery($request)
            ->orderByDesc('entry_time')
            ->get();

        $filename = 'veltrix-export-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($trades) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'ID', 'Entry Time', 'Exit Time', 'Symbol', 'Market Type',
                'Direction', 'Status', 'Entry Price', 'Exit Price', 'Quantity',
                'Fees', 'Funding Costs', 'Gross P/L', 'Net P/L', 'Strategy',
                'Mistake Tags', 'Setup Description', 'Notes',
            ]);

            foreach ($trades as $trade) {
                fputcsv($handle, [
                    $trade->id,
                    $trade->entry_time?->format('Y-m-d H:i:s'),
                    $trade->exit_time?->format('Y-m-d H:i:s') ?? '',
                    $this->sanitizeCsvCell($trade->symbol),
                    $trade->market_type,
                    $trade->direction,
                    $trade->status,
                    number_format((float) $trade->entry_price, 4, '.', ''),
                    $trade->exit_price !== null ? number_format((float) $trade->exit_price, 4, '.', '') : '',
                    number_format((float) $trade->quantity, 4, '.', ''),
                    number_format((float) $trade->fees, 2, '.', ''),
                    number_format((float) $trade->funding_costs, 2, '.', ''),
                    $trade->gross_pnl !== null ? number_format($trade->gross_pnl, 2, '.', '') : '',
                    $trade->net_pnl !== null ? number_format($trade->net_pnl, 2, '.', '') : '',
                    $this->sanitizeCsvCell($trade->strategy?->name ?? ''),
                    $this->sanitizeCsvCell($trade->mistakeTags->pluck('name')->implode(', ')),
                    $this->sanitizeCsvCell($trade->setup_description ?? ''),
                    $this->sanitizeCsvCell($trade->notes ?? ''),
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Neutralize spreadsheet formula injection in untrusted text fields.
     */
    private function sanitizeCsvCell(?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        $firstChar = substr($value, 0, 1);
        if (in_array($firstChar, ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }

    private function buildFilteredQuery(Request $request)
    {
        $user = $request->user();
        $query = $user->trades()->with(['strategy', 'mistakeTags']);

        if ($search = $request->query('search')) {
            $query->where('symbol', 'like', '%'.trim($search).'%');
        }
        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('entry_time', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('entry_time', '<=', $dateTo);
        }
        if ($marketType = $request->query('market_type')) {
            $query->where('market_type', $marketType);
        }
        if ($direction = $request->query('direction')) {
            $query->where('direction', $direction);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($strategyId = $request->query('strategy_id')) {
            $query->where('strategy_id', $strategyId);
        }
        if ($mistakeTagId = $request->query('mistake_tag_id')) {
            $query->whereHas('mistakeTags', fn ($q) => $q->where('mistake_tags.id', $mistakeTagId));
        }
        if ($outcome = $request->query('outcome')) {
            $netSql = '(CASE WHEN direction = "long" THEN (exit_price - entry_price) ELSE (entry_price - exit_price) END * quantity * contract_multiplier) - fees - funding_costs';
            $query->where('status', 'closed')->whereNotNull('exit_price');
            if ($outcome === 'winning') {
                $query->whereRaw("$netSql > 0");
            } elseif ($outcome === 'losing') {
                $query->whereRaw("$netSql < 0");
            }
        }

        return $query;
    }
public function importBrokerCsv(Request $request): RedirectResponse
    {
        $request->validate([
            'broker' => ['required', 'in:ninjatrader,tradovate,generic'],
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            'strategy_id' => ['nullable', 'exists:strategies,id'],
        ]);

        $user = $request->user();
        $file = $request->file('csv_file');
        $rows = array_map('str_getcsv', file($file->getRealPath()));

        if (count($rows) < 2) {
            return back()->with('error', 'The uploaded CSV file is empty.');
        }

        // Normalize header names
        $headers = array_map(fn ($h) => strtolower(trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h))), array_shift($rows));

        $multipliers = [
            'ES' => 50, 'MES' => 5,
            'NQ' => 20, 'MNQ' => 2,
            'YM' => 5,  'MYM' => 0.5,
            'RTY' => 50, 'M2K' => 5,
            'CL' => 1000, 'MCL' => 100,
            'GC' => 100, 'MGC' => 10,
        ];

        $importedCount = 0;

        DB::transaction(function () use ($rows, $headers, $user, $request, $multipliers, &$importedCount) {
            foreach ($rows as $row) {
                if (count($row) < count($headers)) {
                    continue;
                }
                $data = array_combine($headers, $row);

                // Map NinjaTrader 8 ("Instrument", "Market pos.", "Qty", "Entry price", "Exit price", "Entry time", "Exit time", "Commission")
                // or Tradovate ("Contract" / "Symbol", "B/S" / "Side", "Qty", "Entry Price", "Exit Price")
                $rawSymbol = $data['instrument'] ?? $data['symbol'] ?? $data['contract'] ?? null;
                if (! $rawSymbol) {
                    continue;
                }

                // Strip futures expiry codes (e.g. "NQ 12-26" or "NQZ6" -> "NQ") for multiplier lookup
                $cleanSymbol = strtoupper(trim(explode(' ', $rawSymbol)[0]));
                $rootSymbol = preg_replace('/[FGHJKMNQUVXZ]\d{1,2}$/', '', $cleanSymbol) ?: $cleanSymbol;
                $multiplier = $multipliers[$rootSymbol] ?? (float) ($data['contract_multiplier'] ?? 1);

                $rawDir = strtolower(trim($data['market pos.'] ?? $data['market position'] ?? $data['direction'] ?? $data['side'] ?? $data['b/s'] ?? 'long'));
                $direction = (str_contains($rawDir, 'short') || str_contains($rawDir, 'sell') || $rawDir === 's') ? 'short' : 'long';

                $qty = (float) ($data['qty'] ?? $data['quantity'] ?? 1);
                $entryPrice = (float) str_replace([',', '$'], '', $data['entry price'] ?? $data['entry_price'] ?? $data['buy price'] ?? 0);
                $exitPrice = (float) str_replace([',', '$'], '', $data['exit price'] ?? $data['exit_price'] ?? $data['sell price'] ?? 0);

                if ($entryPrice <= 0) {
                    continue;
                }

                $fees = (float) str_replace([',', '$'], '', $data['commission'] ?? $data['fees'] ?? 0);
                $entryTime = ! empty($data['entry time'] ?? $data['entry_time'])
                    ? date('Y-m-d H:i:s', strtotime($data['entry time'] ?? $data['entry_time']))
                    : now()->format('Y-m-d H:i:s');
                $exitTime = ! empty($data['exit time'] ?? $data['exit_time'])
                    ? date('Y-m-d H:i:s', strtotime($data['exit time'] ?? $data['exit_time']))
                    : now()->format('Y-m-d H:i:s');

                $user->trades()->create([
                    'strategy_id' => $request->input('strategy_id') ?: null,
                    'symbol' => strtoupper(trim($rawSymbol)),
                    'market_type' => isset($multipliers[$rootSymbol]) ? 'commodities' : 'stocks',
                    'direction' => $direction,
                    'status' => $exitPrice > 0 ? 'closed' : 'open',
                    'entry_price' => $entryPrice,
                    'exit_price' => $exitPrice > 0 ? $exitPrice : null,
                    'quantity' => max(1, $qty),
                    'contract_multiplier' => $multiplier,
                    'fees' => $fees,
                    'funding_costs' => 0,
                    'entry_time' => $entryTime,
                    'exit_time' => $exitPrice > 0 ? $exitTime : null,
                    'notes' => 'Imported via '.strtoupper($request->input('broker')).' CSV Sync',
                ]);

                $importedCount++;
            }
        });

        return redirect()->route('trades.index')
            ->with('success', "Successfully imported {$importedCount} trades from ".ucfirst($request->input('broker')).'!');
    }
}
