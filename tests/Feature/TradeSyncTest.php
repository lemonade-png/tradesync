<?php

namespace Tests\Feature;

use App\Models\Strategy;
use App\Models\Trade;
use App\Models\User;
use App\Services\FinancialCalculatorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TradeSyncTest extends TestCase
{
    use RefreshDatabase;

    private FinancialCalculatorService $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = app(FinancialCalculatorService::class);
    }

    public function test_profitable_and_losing_long_and_short_calculations_with_fees(): void
    {
        $user = User::factory()->create();

        // 1. Profitable Long: (110 - 100) * 2 - 3 - 1 = 16.00
        $longWin = new Trade([
            'user_id' => $user->id,
            'direction' => 'long',
            'status' => 'closed',
            'entry_price' => '100.00000000',
            'exit_price' => '110.00000000',
            'quantity' => '2.00000000',
            'contract_multiplier' => '1.00000000',
            'fees' => '3.00000000',
            'funding_costs' => '1.00000000',
        ]);
        $this->assertSame(20.0, $this->calculator->calculateGrossPnl($longWin));
        $this->assertSame(16.0, $this->calculator->calculateNetPnl($longWin));

        // 2. Losing Long: (95 - 100) * 2 - 2 - 0 = -12.00
        $longLoss = new Trade([
            'user_id' => $user->id,
            'direction' => 'long',
            'status' => 'closed',
            'entry_price' => '100.00000000',
            'exit_price' => '95.00000000',
            'quantity' => '2.00000000',
            'contract_multiplier' => '1.00000000',
            'fees' => '2.00000000',
            'funding_costs' => '0.00000000',
        ]);
        $this->assertSame(-12.0, $this->calculator->calculateNetPnl($longLoss));

        // 3. Profitable Short: (200 - 180) * 1.5 - 2.5 - 0.5 = 27.00
        $shortWin = new Trade([
            'user_id' => $user->id,
            'direction' => 'short',
            'status' => 'closed',
            'entry_price' => '200.00000000',
            'exit_price' => '180.00000000',
            'quantity' => '1.50000000',
            'contract_multiplier' => '1.00000000',
            'fees' => '2.50000000',
            'funding_costs' => '0.50000000',
        ]);
        $this->assertSame(30.0, $this->calculator->calculateGrossPnl($shortWin));
        $this->assertSame(27.0, $this->calculator->calculateNetPnl($shortWin));

        // 4. Losing Short: (200 - 210) * 1 - 1 = -11.00
        $shortLoss = new Trade([
            'user_id' => $user->id,
            'direction' => 'short',
            'status' => 'closed',
            'entry_price' => '200.00000000',
            'exit_price' => '210.00000000',
            'quantity' => '1.00000000',
            'contract_multiplier' => '1.00000000',
            'fees' => '1.00000000',
            'funding_costs' => '0.00000000',
        ]);
        $this->assertSame(-11.0, $this->calculator->calculateNetPnl($shortLoss));
    }

    public function test_open_trades_and_zero_denominator_edge_cases(): void
    {
        $user = User::factory()->create();

        $openTradeWithoutMark = new Trade([
            'user_id' => $user->id,
            'direction' => 'long',
            'status' => 'open',
            'entry_price' => '50000.00000000',
            'exit_price' => null,
            'mark_price' => null,
            'quantity' => '1.00000000',
        ]);

        $this->assertNull($this->calculator->calculateNetPnl($openTradeWithoutMark));
        $this->assertNull($this->calculator->calculateUnrealizedPnl($openTradeWithoutMark));

        // Empty dataset metrics
        $emptyStats = $this->calculator->buildPortfolioMetrics(collect());
        $this->assertSame(0.0, $emptyStats['win_rate']);
        $this->assertNull($emptyStats['profit_factor']);
    }

    public function test_cross_user_authorization_prevents_accessing_another_users_trade(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $trade = Trade::create([
            'user_id' => $owner->id,
            'symbol' => 'BTCUSDT',
            'market_type' => 'crypto',
            'direction' => 'long',
            'status' => 'open',
            'entry_price' => 60000,
            'quantity' => 1,
            'entry_time' => now(),
        ]);

        $this->actingAs($intruder)
            ->get(route('trades.show', $trade))
            ->assertForbidden();

        $this->actingAs($intruder)
            ->delete(route('trades.destroy', $trade))
            ->assertForbidden();
    }

    public function test_screenshot_upload_rejects_executable_files_and_protects_private_access(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $badFile = UploadedFile::fake()->create('exploit.php', 100, 'application/x-php');

        $this->actingAs($user)->post(route('trades.store'), [
            'symbol' => 'BTCUSDT',
            'market_type' => 'crypto',
            'direction' => 'long',
            'status' => 'open',
            'entry_price' => 50000,
            'quantity' => 1,
            'entry_time' => now()->toDateTimeString(),
            'screenshot' => $badFile,
        ])->assertSessionHasErrors('screenshot');

        $validImage = UploadedFile::fake()->image('chart.png', 800, 600);
        $this->actingAs($user)->post(route('trades.store'), [
            'symbol' => 'ETHUSDT',
            'market_type' => 'crypto',
            'direction' => 'long',
            'status' => 'open',
            'entry_price' => 3000,
            'quantity' => 2,
            'entry_time' => now()->toDateTimeString(),
            'screenshot' => $validImage,
        ])->assertRedirect();

        $trade = Trade::where('symbol', 'ETHUSDT')->firstOrFail();
        $this->actingAs($otherUser)
            ->get(route('trades.screenshot', $trade))
            ->assertForbidden();
    }

    public function test_strategy_deletion_preserves_historical_trades(): void
    {
        $user = User::factory()->create();
        $strategy = Strategy::create(['user_id' => $user->id, 'name' => 'Scalp']);

        $trade = Trade::create([
            'user_id' => $user->id,
            'strategy_id' => $strategy->id,
            'symbol' => 'XAUUSD',
            'market_type' => 'commodities',
            'direction' => 'long',
            'status' => 'closed',
            'entry_price' => 2300,
            'exit_price' => 2310,
            'quantity' => 1,
            'entry_time' => now()->subHour(),
            'exit_time' => now(),
        ]);

        $this->actingAs($user)->delete(route('strategies.destroy', $strategy))->assertRedirect();
        $this->assertDatabaseHas('trades', ['id' => $trade->id, 'strategy_id' => null]);
    }
}