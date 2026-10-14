<?php

namespace App\Http\Controllers;

use App\Services\FinancialCalculatorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function __invoke(Request $request, FinancialCalculatorService $calculator): Response
    {
        $user = $request->user();
        $trades = $user->trades()->with(['strategy', 'mistakeTags'])->get();
        $metrics = $calculator->buildPortfolioMetrics($trades, $user->timezone ?? 'UTC');

        $strategyComparison = $user->strategies()->with('trades')->get()->map(function ($strategy) use ($calculator, $user) {
            $stats = $calculator->buildPortfolioMetrics($strategy->trades, $user->timezone ?? 'UTC');
            return [
                'id' => $strategy->id,
                'name' => $strategy->name,
                'closed_trades_count' => $stats['closed_trades_count'],
                'net_pnl' => $stats['total_realized_net_pnl'],
                'win_rate' => $stats['win_rate'],
                'profit_factor' => $stats['profit_factor'],
                'expectancy' => $stats['expectancy'],
            ];
        })->values();

        $mistakeTagAnalysis = $user->mistakeTags()->with('trades')->get()->map(function ($tag) use ($calculator) {
            $closed = $tag->trades->filter(fn ($t) => $t->status === 'closed' && $t->exit_price !== null);
            $netPnl = round($closed->sum(fn ($t) => $calculator->calculateNetPnl($t) ?? 0), 2);
            return [
                'id' => $tag->id,
                'name' => $tag->name,
                'occurrences' => $closed->count(),
                'total_pnl_impact' => $netPnl,
            ];
        })->sortBy('total_pnl_impact')->values();

        return Inertia::render('Analytics/Index', [
            'metrics' => $metrics,
            'strategyComparison' => $strategyComparison,
            'mistakeTagAnalysis' => $mistakeTagAnalysis,
        ]);
    }
}