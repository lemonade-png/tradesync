<?php

namespace App\Models;

use App\Services\FinancialCalculatorService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Trade extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'strategy_id',
        'symbol',
        'market_type',
        'direction',
        'status',
        'entry_price',
        'exit_price',
        'mark_price',
        'quantity',
        'contract_multiplier',
        'stop_loss',
        'take_profit',
        'fees',
        'funding_costs',
        'entry_time',
        'exit_time',
        'setup_description',
        'notes',
        'screenshot_path',
    ];

    protected $appends = [
        'gross_pnl',
        'net_pnl',
        'unrealized_pnl',
        'has_screenshot',
    ];

    protected function casts(): array
    {
        return [
            'entry_price' => 'decimal:8',
            'exit_price' => 'decimal:8',
            'mark_price' => 'decimal:8',
            'quantity' => 'decimal:8',
            'contract_multiplier' => 'decimal:8',
            'stop_loss' => 'decimal:8',
            'take_profit' => 'decimal:8',
            'fees' => 'decimal:8',
            'funding_costs' => 'decimal:8',
            'entry_time' => 'datetime',
            'exit_time' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function strategy(): BelongsTo
    {
        return $this->belongsTo(Strategy::class);
    }

    public function mistakeTags(): BelongsToMany
    {
        return $this->belongsToMany(MistakeTag::class, 'mistake_tag_trade')->withTimestamps();
    }

    public function getGrossPnlAttribute(): ?float
    {
        return app(FinancialCalculatorService::class)->calculateGrossPnl($this);
    }

    public function getNetPnlAttribute(): ?float
    {
        return app(FinancialCalculatorService::class)->calculateNetPnl($this);
    }

    public function getUnrealizedPnlAttribute(): ?float
    {
        return app(FinancialCalculatorService::class)->calculateUnrealizedPnl($this);
    }

    public function getHasScreenshotAttribute(): bool
    {
        return ! empty($this->screenshot_path);
    }
}