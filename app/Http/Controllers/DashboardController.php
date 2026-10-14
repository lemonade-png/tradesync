<?php

namespace App\Http\Controllers;

use App\Services\FinancialCalculatorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, FinancialCalculatorService $calculator): Response
    {
        $user = $request->user();
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        $query = $user->trades()->with(['strategy', 'mistakeTags']);

        if ($dateFrom) {
            $query->whereDate('entry_time', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('entry_time', '<=', $dateTo);
        }

        $trades = $query->get();
        $metrics = $calculator->buildPortfolioMetrics($trades, $user->timezone ?? 'UTC');

        // Strategy performance summary
        $strategySummary = $user->strategies()->with(['trades' => function ($q) use ($dateFrom, $dateTo) {
            if ($dateFrom) {
                $q->whereDate('entry_time', '>=', $dateFrom);
            }
            if ($dateTo) {
                $q->whereDate('entry_time', '<=', $dateTo);
            }
        }])->get()->map(function ($strategy) use ($calculator, $user) {
            $stats = $calculator->buildPortfolioMetrics($strategy->trades, $user->timezone ?? 'UTC');
            return [
                'id' => $strategy->id,
                'name' => $strategy->name,
                'closed_trades_count' => $stats['closed_trades_count'],
                'net_pnl' => $stats['total_realized_net_pnl'],
                'win_rate' => $stats['win_rate'],
                'profit_factor' => $stats['profit_factor'],
            ];
        })->values();

        $recentTrades = $trades->sortByDesc('entry_time')->take(6)->values();

        return Inertia::render('Dashboard', [
            'metrics' => $metrics,
            'strategySummary' => $strategySummary,
            'recentTrades' => $recentTrades,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }
}