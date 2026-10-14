<?php

namespace App\Http\Controllers;

use App\Models\Strategy;
use App\Services\FinancialCalculatorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StrategyController extends Controller
{
    public function index(Request $request, FinancialCalculatorService $calculator): Response
    {
        $user = $request->user();
        $strategies = $user->strategies()->with('trades')->orderBy('name')->get()->map(function (Strategy $strategy) use ($calculator, $user) {
            $stats = $calculator->buildPortfolioMetrics($strategy->trades, $user->timezone ?? 'UTC');
            return [
                'id' => $strategy->id,
                'name' => $strategy->name,
                'description' => $strategy->description,
                'closed_trades_count' => $stats['closed_trades_count'],
                'net_pnl' => $stats['total_realized_net_pnl'],
                'win_rate' => $stats['win_rate'],
                'average_win' => $stats['average_win'],
                'average_loss' => $stats['average_loss'],
                'profit_factor' => $stats['profit_factor'],
                'expectancy' => $stats['expectancy'],
                'equity_curve' => $stats['equity_curve'],
            ];
        });

        return Inertia::render('Strategies/Index', [
            'strategies' => $strategies,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('strategies', 'name')->where('user_id', $user->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $user->strategies()->create($validated);

        return back()->with('success', 'Strategy created.');
    }

    public function update(Request $request, Strategy $strategy): RedirectResponse
    {
        Gate::authorize('update', $strategy);
        $user = $request->user();

        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('strategies', 'name')->where('user_id', $user->id)->ignore($strategy->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $strategy->update($validated);

        return back()->with('success', 'Strategy updated.');
    }

    public function destroy(Strategy $strategy): RedirectResponse
    {
        Gate::authorize('delete', $strategy);
        // Foreign key is configured with nullOnDelete() so historical trades remain intact
        $strategy->delete();

        return back()->with('success', 'Strategy deleted. Historical trades were preserved without a strategy label.');
    }
}