<?php

namespace Database\Seeders;

use App\Models\MistakeTag;
use App\Models\Strategy;
use App\Models\Trade;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure the Demo Trader account exists
        $userData = [
            'name' => 'Demo Trader',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ];

        if (Schema::hasColumn('users', 'preferred_currency')) {
            $userData['preferred_currency'] = 'USD';
        }
        if (Schema::hasColumn('users', 'timezone')) {
            $userData['timezone'] = 'UTC';
        }
        if (Schema::hasColumn('users', 'theme')) {
            $userData['theme'] = 'dark';
        }

        $demoUser = User::updateOrCreate(
            ['email' => 'demo@tradesync.local'],
            $userData
        );

        // Seed 100 trades for every user in the database (so whichever account you are logged into gets the data)
        $users = User::all();

        foreach ($users as $user) {
            $this->seedForUser($user);
        }
    }

    private function seedForUser(User $user): void
    {
        // Clear old trades for a clean 100-trade set
        $user->trades()->delete();

        // 2. Create Playbook Strategies
        $strategyData = [
            ['name' => 'ICT Silver Bullet', 'description' => 'NY AM Session liquidity sweep into 10am-11am FVG'],
            ['name' => 'ORB (Opening Range Breakout)', 'description' => 'First 15-minute range breakout with volume confirmation'],
            ['name' => 'HTF Break & Retest', 'description' => '4H/Daily key support and resistance flip'],
            ['name' => 'VWAP Mean Reversion', 'description' => 'Fade 2SD extension back to session VWAP'],
            ['name' => 'London Session Judas Swing', 'description' => 'Fakeout above Asian high/low followed by displacement'],
        ];

        $strategies = collect($strategyData)->map(function ($s) use ($user) {
            return Strategy::firstOrCreate(
                ['user_id' => $user->id, 'name' => $s['name']],
                ['description' => $s['description']]
            );
        });

        // 3. Create Psychological Mistake Tags
        $tagNames = [
            'FOMO Entry',
            'Moved Stop Loss',
            'Closed Early',
            'Overleveraged',
            'Revenge Trade',
            'Chased Candle',
        ];

        $mistakeTags = collect($tagNames)->map(function ($name) use ($user) {
            return MistakeTag::firstOrCreate([
                'user_id' => $user->id,
                'name' => $name,
            ]);
        });

        // 4. Market Instruments Catalog
        $instruments = [
            ['symbol' => 'BTCUSDT', 'market_type' => 'crypto', 'base_price' => 64000, 'volatility' => 1400, 'qty_range' => [0.1, 1.5], 'multiplier' => 1],
            ['symbol' => 'ETHUSDT', 'market_type' => 'crypto', 'base_price' => 3100, 'volatility' => 95, 'qty_range' => [1, 12], 'multiplier' => 1],
            ['symbol' => 'SOLUSDT', 'market_type' => 'crypto', 'base_price' => 155, 'volatility' => 8, 'qty_range' => [15, 120], 'multiplier' => 1],
            ['symbol' => 'EURUSD', 'market_type' => 'forex', 'base_price' => 1.0850, 'volatility' => 0.0065, 'qty_range' => [10000, 100000], 'multiplier' => 1],
            ['symbol' => 'GBPUSD', 'market_type' => 'forex', 'base_price' => 1.2720, 'volatility' => 0.0080, 'qty_range' => [10000, 100000], 'multiplier' => 1],
            ['symbol' => 'NVDA', 'market_type' => 'stocks', 'base_price' => 125, 'volatility' => 5.5, 'qty_range' => [20, 150], 'multiplier' => 1],
            ['symbol' => 'TSLA', 'market_type' => 'stocks', 'base_price' => 230, 'volatility' => 9.0, 'qty_range' => [10, 80], 'multiplier' => 1],
            ['symbol' => 'AAPL', 'market_type' => 'stocks', 'base_price' => 220, 'volatility' => 3.8, 'qty_range' => [25, 120], 'multiplier' => 1],
            ['symbol' => 'XAUUSD', 'market_type' => 'commodities', 'base_price' => 2620, 'volatility' => 28, 'qty_range' => [1, 10], 'multiplier' => 1],
            ['symbol' => 'USOIL', 'market_type' => 'commodities', 'base_price' => 72.50, 'volatility' => 2.1, 'qty_range' => [20, 150], 'multiplier' => 1],
        ];

        $setups = [
            'Clean liquidity sweep of previous session high/low followed by market structure shift.',
            'Strong volume breakout above consolidation zone with tight invalidation level.',
            'Price tapped 4H order block and rejected with strong displacement candle.',
            'Retest of broken VWAP band aligned with higher timeframe trend.',
            'Key psychological level defense during NY open volatility.',
        ];

        $winNotes = [
            'Followed trading plan to the letter. Waited for candle closure before entering.',
            'Great patience on entry. Scaled out at 2R target smoothly.',
            'Clean execution with zero hesitation. Let winners run to target.',
        ];

        $lossNotes = [
            'Stopped out as market swept deeper liquidity before reversing.',
            'Entered slightly early before confirmation candle closed.',
            'Choppy session price action triggered stop loss.',
        ];

        // 5. Generate 100 Sample Trades across the last 90 days
        for ($i = 1; $i <= 100; $i++) {
            $inst = $instruments[array_rand($instruments)];
            $direction = rand(1, 100) <= 58 ? 'long' : 'short';
            $isOpen = $i > 95; // Make the last 5 trades open positions
            $status = $isOpen ? 'open' : 'closed';

            // ~62% win rate for realistic profitable curve
            $isWin = rand(1, 100) <= 62;

            $daysAgo = (int) floor(((100 - $i) / 100) * 85);
            $entryTime = Carbon::now()->subDays($daysAgo)->setTime(rand(8, 19), rand(0, 59), 0);
            $exitTime = $isOpen ? null : (clone $entryTime)->addMinutes(rand(25, 480));

            // Randomize entry price slightly around base_price
            $priceJitter = (rand(-100, 100) / 100) * ($inst['volatility'] * 1.5);
            $decimals = $inst['market_type'] === 'forex' ? 4 : 2;
            $entryPrice = round(max(0.01, $inst['base_price'] + $priceJitter), $decimals);

            // Calculate price move
            $moveMagnitude = (rand(25, 130) / 100) * $inst['volatility'];
            if (!$isWin) {
                // Losses are slightly smaller on average (good Risk-to-Reward)
                $moveMagnitude = (rand(20, 75) / 100) * $inst['volatility'];
            }

            if ($direction === 'long') {
                $exitPrice = $isWin ? $entryPrice + $moveMagnitude : $entryPrice - $moveMagnitude;
                $stopLoss = round($entryPrice - ($inst['volatility'] * 0.7), $decimals);
                $takeProfit = round($entryPrice + ($inst['volatility'] * 1.6), $decimals);
            } else {
                $exitPrice = $isWin ? $entryPrice - $moveMagnitude : $entryPrice + $moveMagnitude;
                $stopLoss = round($entryPrice + ($inst['volatility'] * 0.7), $decimals);
                $takeProfit = round($entryPrice - ($inst['volatility'] * 1.6), $decimals);
            }

            $exitPrice = $isOpen ? null : round(max(0.0001, $exitPrice), $decimals);
            $markPrice = $isOpen ? round($entryPrice + ((rand(-50, 80) / 100) * $inst['volatility']), $decimals) : null;

            $minQ = $inst['qty_range'][0];
            $maxQ = $inst['qty_range'][1];
            $quantity = round($minQ + (mt_rand() / mt_getrandmax()) * ($maxQ - $minQ), 2);

            $fees = round(rand(150, 1200) / 100, 2);
            $fundingCosts = $inst['market_type'] === 'crypto' ? round(rand(0, 450) / 100, 2) : 0;

            $strategy = $strategies->random();

            $trade = Trade::create([
                'user_id' => $user->id,
                'strategy_id' => $strategy->id,
                'symbol' => $inst['symbol'],
                'market_type' => $inst['market_type'],
                'direction' => $direction,
                'status' => $status,
                'entry_price' => $entryPrice,
                'exit_price' => $exitPrice,
                'mark_price' => $markPrice,
                'quantity' => $quantity,
                'contract_multiplier' => $inst['multiplier'],
                'stop_loss' => $stopLoss,
                'take_profit' => $takeProfit,
                'fees' => $fees,
                'funding_costs' => $fundingCosts,
                'entry_time' => $entryTime,
                'exit_time' => $exitTime,
                'setup_description' => $setups[array_rand($setups)],
                'notes' => $isWin ? $winNotes[array_rand($winNotes)] : $lossNotes[array_rand($lossNotes)],
            ]);

            // Attach 1-2 mistake tags primarily on losing trades (or occasionally on wins)
            if (!$isOpen && (!$isWin && rand(1, 100) <= 70 || $isWin && rand(1, 100) <= 15)) {
                $randomTags = $mistakeTags->random(rand(1, 2))->pluck('id')->toArray();
                $trade->mistakeTags()->sync($randomTags);
            }
        }
    }
}