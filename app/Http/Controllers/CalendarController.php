<?php

namespace App\Http\Controllers;

use App\Services\FinancialCalculatorService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __invoke(Request $request, FinancialCalculatorService $calculator): Response
    {
        $user = $request->user();
        $tz = $user->timezone ?? 'UTC';

        $year = (int) $request->query('year', Carbon::now($tz)->year);
        $month = (int) $request->query('month', Carbon::now($tz)->month);

        $startOfMonth = Carbon::createFromDate($year, $month, 1, $tz)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        $closedTrades = $user->trades()
            ->with('strategy')
            ->where('status', 'closed')
            ->whereNotNull('exit_price')
            ->whereNotNull('exit_time')
            ->whereBetween('exit_time', [
                $startOfMonth->copy()->setTimezone('UTC'),
                $endOfMonth->copy()->setTimezone('UTC'),
            ])
            ->get();

        $days = $closedTrades->groupBy(function ($trade) use ($tz) {
            return Carbon::parse($trade->exit_time)->setTimezone($tz)->format('Y-m-d');
        })->map(function ($dayTrades, $date) use ($calculator) {
            $netPnl = round($dayTrades->sum(fn ($t) => $calculator->calculateNetPnl($t) ?? 0), 2);
            return [
                'date' => $date,
                'net_pnl' => $netPnl,
                'trades_count' => $dayTrades->count(),
                'trades' => $dayTrades->map(fn ($t) => [
                    'id' => $t->id,
                    'symbol' => $t->symbol,
                    'direction' => $t->direction,
                    'net_pnl' => $calculator->calculateNetPnl($t),
                    'strategy_name' => $t->strategy?->name,
                ])->values(),
            ];
        });

        return Inertia::render('Calendar/Index', [
            'year' => $year,
            'month' => $month,
            'monthLabel' => $startOfMonth->format('F Y'),
            'daysInMonth' => $startOfMonth->daysInMonth,
            'firstDayOfWeek' => $startOfMonth->dayOfWeek, // 0 (Sun) - 6 (Sat)
            'dailyRecords' => $days,
        ]);
    }
}