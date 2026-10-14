<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StrategyController;
use App\Http\Controllers\TradeController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::get('/trades/export/csv', [TradeController::class, 'exportCsv'])->name('trades.export.csv');
    Route::post('/trades/import/csv', [TradeController::class, 'importBrokerCsv'])->name('trades.import.csv');
    Route::get('/trades/{trade}/screenshot', [TradeController::class, 'screenshot'])->name('trades.screenshot');
    Route::resource('trades', TradeController::class);

    Route::get('/analytics', AnalyticsController::class)->name('analytics');
    Route::get('/calendar', CalendarController::class)->name('calendar');
    Route::resource('strategies', StrategyController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::get('/settings/profile', [ProfileController::class, 'edit'])->name('settings.profile');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';