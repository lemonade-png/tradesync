<?php

namespace App\Services;

use App\Models\Trade;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FinancialCalculatorService
{
    /**
     * Financial Calculation Rules & Instrument Assumptions:
     * - Long Gross P/L  = (Exit Price - Entry Price) * Quantity * Contract Multiplier
     * - Short Gross P/L = (Entry Price - Exit Price) * Quantity * Contract Multiplier
     * - Net P/L         = Gross P/L - Fees - Funding Costs
     * - Contract Multiplier defaults to 1.0 (spot crypto, equities, standard units)
     *   and can be explicitly set for standard Forex lots (e.g., 100,000) or futures.
     * - Internal calculations retain 8 decimal places via BCMath and round to 2 decimals
     *   at the presentation boundary using half-up rounding.
     */
    public function calculateGrossPnl(Trade $trade): ?float
    {
        if ($trade->status !== 'closed' || $trade->exit_price === null) {
            return null;
        }

        return $this->computeDirectionalGross(
            direction: $trade->direction,
            entryPrice: (string) $trade->entry_price,
            referencePrice: (string) $trade->exit_price,
            quantity: (string) $trade->quantity,
            multiplier: (string) ($trade->contract_multiplier ?? '1.00000000')
        );
    }

    public function calculateNetPnl(Trade $trade): ?float
    {
        if ($trade->status !== 'closed' || $trade->exit_price === null) {
            return null;
        }

        $gross = $this->computeDirectionalGrossRaw(
            direction: $trade->direction,
            entryPrice: (string) $trade->entry_price,
            referencePrice: (string) $trade->exit_price,
            quantity: (string) $trade->quantity,
            multiplier: (string) ($trade->contract_multiplier ?? '1.00000000')
        );

        $fees = (string) ($trade->fees ?? '0.00000000');
        $funding = (string) ($trade->funding_costs ?? '0.00000000');

        $afterFees = bcsub($gross, $fees, 8);
        $net = bcsub($afterFees, $funding, 8);

        return round((float) $net, 2);
    }

    /**
     * Unrealized P/L is strictly calculated ONLY when an open trade has an explicit mark_price.
     */
    public function calculateUnrealizedPnl(Trade $trade): ?float
    {
        if ($trade->status !== 'open' || $trade->mark_price === null) {
            return null;
        }

        $gross = $this->computeDirectionalGrossRaw(
            direction: $trade->direction,
            entryPrice: (string) $trade->entry_price,
            referencePrice: (string) $trade->mark_price,
            quantity: (string) $trade->quantity,
            multiplier: (string) ($trade->contract_multiplier ?? '1.00000000')
        );

        $fees = (string) ($trade->fees ?? '0.00000000');
        $funding = (string) ($trade->funding_costs ?? '0.00000000');

        $net = bcsub(bcsub($gross, $fees, 8), $funding, 8);

        return round((float) $net, 2);
    }

    private function computeDirectionalGross(
        string $direction,
        string $entryPrice,
        string $referencePrice,
        string $quantity,
        string $multiplier = '1.00000000'
    ): float {
        $raw = $this->computeDirectionalGrossRaw($direction, $entryPrice, $referencePrice, $quantity, $multiplier);
        return round((float) $raw, 2);
    }

    private function computeDirectionalGrossRaw(
        string $direction,
        string $entryPrice,
        string $referencePrice,
        string $quantity,
        string $multiplier = '1.00000000'
    ): string {
        $priceDiff = $direction === 'long'
            ? bcsub($referencePrice, $entryPrice, 8)
            : bcsub($entryPrice, $referencePrice, 8);

        $sized = bcmul($priceDiff, $quantity, 8);
        return bcmul($sized, $multiplier, 8);
    }

    /**
     * Aggregate comprehensive portfolio metrics from a collection of Trade models.
     */
    public function buildPortfolioMetrics(Collection $trades, string $timezone = 'UTC'): array
    {
        $closedTrades = $trades->filter(
            fn (Trade $t) => $t->status === 'closed' && $t->exit_price !== null
        )->sortBy(fn (Trade $t) => $t->exit_time ?? $t->entry_time)->values();

        $openTradesWithMark = $trades->filter(
            fn (Trade $t) => $t->status === 'open' && $t->mark_price !== null
        );

        $totalClosedCount = $closedTrades->count();
        $unrealizedPnl = $openTradesWithMark->isEmpty()
            ? null
            : round($openTradesWithMark->sum(fn (Trade $t) => $this->calculateUnrealizedPnl($t) ?? 0), 2);

        if ($totalClosedCount === 0) {
            return [
                'total_realized_net_pnl' => 0.0,
                'unrealized_pnl' => $unrealizedPnl,
                'closed_trades_count' => 0,
                'open_trades_count' => $trades->where('status', 'open')->count(),
                'win_rate' => 0.0,
                'profit_factor' => null,
                'expectancy' => 0.0,
                'average_win' => 0.0,
                'average_loss' => 0.0,
                'largest_win' => 0.0,
                'largest_loss' => 0.0,
                'winning_trades_count' => 0,
                'losing_trades_count' => 0,
                'breakeven_trades_count' => 0,
                'best_day' => null,
                'worst_day' => null,
                'equity_curve' => [],
                'monthly_pnl' => [],
                'weekly_pnl' => [],
                'daily_pnl_distribution' => [],
                'market_comparison' => [],
                'direction_comparison' => [
                    'long' => ['count' => 0, 'net_pnl' => 0.0, 'win_rate' => 0.0],
                    'short' => ['count' => 0, 'net_pnl' => 0.0, 'win_rate' => 0.0],
                ],
            ];
        }

        $pnls = $closedTrades->map(fn (Trade $t) => [
            'trade' => $t,
            'net_pnl' => $this->calculateNetPnl($t) ?? 0.0,
        ]);

        $wins = $pnls->filter(fn ($item) => $item['net_pnl'] > 0);
        $losses = $pnls->filter(fn ($item) => $item['net_pnl'] < 0);
        $breakevens = $pnls->filter(fn ($item) => $item['net_pnl'] == 0.0);

        $totalNetPnl = round($pnls->sum('net_pnl'), 2);
        $grossProfit = round($wins->sum('net_pnl'), 2);
        $grossLossAbs = round(abs($losses->sum('net_pnl')), 2);

        $winRate = round(($wins->count() / $totalClosedCount) * 100, 2);
        $profitFactor = $grossLossAbs > 0
            ? round($grossProfit / $grossLossAbs, 2)
            : null; // Avoid misleading infinity when denominator is 0

        $expectancy = round($totalNetPnl / $totalClosedCount, 2);
        $averageWin = $wins->isNotEmpty() ? round($grossProfit / $wins->count(), 2) : 0.0;
        $averageLoss = $losses->isNotEmpty() ? round($losses->sum('net_pnl') / $losses->count(), 2) : 0.0;
        $largestWin = $wins->isNotEmpty() ? round((float) $wins->max('net_pnl'), 2) : 0.0;
        $largestLoss = $losses->isNotEmpty() ? round((float) $losses->min('net_pnl'), 2) : 0.0;

        // Build cumulative equity curve
        $cumulative = 0.0;
        $equityCurve = $pnls->map(function ($item, $idx) use (&$cumulative, $timezone) {
            $cumulative = round($cumulative + $item['net_pnl'], 2);
            /** @var Trade $trade */
            $trade = $item['trade'];
            $date = Carbon::parse($trade->exit_time ?? $trade->entry_time)->setTimezone($timezone);

            return [
                'trade_number' => $idx + 1,
                'date' => $date->format('Y-m-d'),
                'symbol' => $trade->symbol,
                'trade_pnl' => $item['net_pnl'],
                'cumulative_pnl' => $cumulative,
            ];
        })->values()->all();

        // Group by local day for Best/Worst trading days & Daily distribution
        $byDay = $pnls->groupBy(function ($item) use ($timezone) {
            /** @var Trade $trade */
            $trade = $item['trade'];
            return Carbon::parse($trade->exit_time ?? $trade->entry_time)
                ->setTimezone($timezone)
                ->format('Y-m-d');
        })->map(function (Collection $dayItems, string $date) {
            return [
                'date' => $date,
                'net_pnl' => round($dayItems->sum('net_pnl'), 2),
                'trades_count' => $dayItems->count(),
            ];
        })->values();

        $bestDay = $byDay->sortByDesc('net_pnl')->first();
        $worstDay = $byDay->sortBy('net_pnl')->first();

        // Monthly P/L
        $monthlyPnl = $pnls->groupBy(function ($item) use ($timezone) {
            /** @var Trade $trade */
            $trade = $item['trade'];
            return Carbon::parse($trade->exit_time ?? $trade->entry_time)
                ->setTimezone($timezone)
                ->format('Y-m');
        })->map(fn (Collection $items, string $month) => [
            'month' => $month,
            'net_pnl' => round($items->sum('net_pnl'), 2),
            'trades_count' => $items->count(),
        ])->sortKeys()->values()->all();

        // Weekly P/L
        $weeklyPnl = $pnls->groupBy(function ($item) use ($timezone) {
            /** @var Trade $trade */
            $trade = $item['trade'];
            return Carbon::parse($trade->exit_time ?? $trade->entry_time)
                ->setTimezone($timezone)
                ->startOfWeek()
                ->format('Y-m-d');
        })->map(fn (Collection $items, string $weekStart) => [
            'week' => $weekStart,
            'net_pnl' => round($items->sum('net_pnl'), 2),
            'trades_count' => $items->count(),
        ])->sortKeys()->values()->all();

        // Market Type Comparison
        $marketComparison = $pnls->groupBy(fn ($item) => $item['trade']->market_type)
            ->map(function (Collection $items, string $market) {
                $count = $items->count();
                $winsCount = $items->filter(fn ($i) => $i['net_pnl'] > 0)->count();
                return [
                    'market_type' => $market,
                    'trades_count' => $count,
                    'net_pnl' => round($items->sum('net_pnl'), 2),
                    'win_rate' => $count > 0 ? round(($winsCount / $count) * 100, 2) : 0.0,
                ];
            })->values()->all();

        // Direction Comparison
        $directionComparison = ['long' => null, 'short' => null];
        foreach (['long', 'short'] as $dir) {
            $dirItems = $pnls->filter(fn ($i) => $i['trade']->direction === $dir);
            $dirCount = $dirItems->count();
            $dirWins = $dirItems->filter(fn ($i) => $i['net_pnl'] > 0)->count();
            $directionComparison[$dir] = [
                'count' => $dirCount,
                'net_pnl' => round($dirItems->sum('net_pnl'), 2),
                'win_rate' => $dirCount > 0 ? round(($dirWins / $dirCount) * 100, 2) : 0.0,
            ];
        }

        return [
            'total_realized_net_pnl' => $totalNetPnl,
            'unrealized_pnl' => $unrealizedPnl,
            'closed_trades_count' => $totalClosedCount,
            'open_trades_count' => $trades->where('status', 'open')->count(),
            'win_rate' => $winRate,
            'profit_factor' => $profitFactor,
            'expectancy' => $expectancy,
            'average_win' => $averageWin,
            'average_loss' => $averageLoss,
            'largest_win' => $largestWin,
            'largest_loss' => $largestLoss,
            'winning_trades_count' => $wins->count(),
            'losing_trades_count' => $losses->count(),
            'breakeven_trades_count' => $breakevens->count(),
            'best_day' => $bestDay,
            'worst_day' => $worstDay,
            'equity_curve' => $equityCurve,
            'monthly_pnl' => $monthlyPnl,
            'weekly_pnl' => $weeklyPnl,
            'daily_pnl_distribution' => $byDay->all(),
            'market_comparison' => $marketComparison,
            'direction_comparison' => $directionComparison,
        ];
    }
}