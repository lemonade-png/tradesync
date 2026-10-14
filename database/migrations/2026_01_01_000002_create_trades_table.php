<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // nullOnDelete preserves historical trade records if a strategy is deleted
            $table->foreignId('strategy_id')->nullable()->constrained('strategies')->nullOnDelete();
            $table->string('symbol', 30);
            $table->enum('market_type', ['crypto', 'forex', 'stocks', 'commodities']);
            $table->enum('direction', ['long', 'short']);
            $table->enum('status', ['open', 'closed'])->default('closed');
            $table->decimal('entry_price', 20, 8);
            $table->decimal('exit_price', 20, 8)->nullable();
            $table->decimal('mark_price', 20, 8)->nullable();
            $table->decimal('quantity', 20, 8);
            $table->decimal('contract_multiplier', 16, 8)->default(1.00000000);
            $table->decimal('stop_loss', 20, 8)->nullable();
            $table->decimal('take_profit', 20, 8)->nullable();
            $table->decimal('fees', 16, 8)->default(0.00000000);
            $table->decimal('funding_costs', 16, 8)->default(0.00000000);
            $table->dateTime('entry_time');
            $table->dateTime('exit_time')->nullable();
            $table->text('setup_description')->nullable();
            $table->text('notes')->nullable();
            $table->string('screenshot_path')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'exit_time']);
            $table->index(['user_id', 'entry_time']);
            $table->index(['user_id', 'symbol']);
            $table->index(['user_id', 'market_type']);
        });

        Schema::create('mistake_tag_trade', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_id')->constrained('trades')->cascadeOnDelete();
            $table->foreignId('mistake_tag_id')->constrained('mistake_tags')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['trade_id', 'mistake_tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mistake_tag_trade');
        Schema::dropIfExists('trades');
    }
};