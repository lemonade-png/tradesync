export type MarketType = 'crypto' | 'forex' | 'stocks' | 'commodities';
export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';

export interface Strategy {
    id: number;
    name: string;
    description?: string | null;
}

export interface MistakeTag {
    id: number;
    name: string;
}

export interface Trade {
    id: number;
    user_id: number;
    strategy_id: number | null;
    symbol: string;
    market_type: MarketType;
    direction: TradeDirection;
    status: TradeStatus;
    entry_price: string;
    exit_price: string | null;
    mark_price: string | null;
    quantity: string;
    contract_multiplier: string;
    stop_loss: string | null;
    take_profit: string | null;
    fees: string;
    funding_costs: string;
    entry_time: string;
    exit_time: string | null;
    setup_description: string | null;
    notes: string | null;
    has_screenshot: boolean;
    gross_pnl: number | null;
    net_pnl: number | null;
    unrealized_pnl: number | null;
    strategy?: Strategy | null;
    mistake_tags?: MistakeTag[];
}

export interface PortfolioMetrics {
    total_realized_net_pnl: number;
    unrealized_pnl: number | null;
    closed_trades_count: number;
    open_trades_count: number;
    win_rate: number;
    profit_factor: number | null;
    expectancy: number;
    average_win: number;
    average_loss: number;
    largest_win: number;
    largest_loss: number;
    winning_trades_count: number;
    losing_trades_count: number;
    breakeven_trades_count: number;
    best_day: { date: string; net_pnl: number; trades_count: number } | null;
    worst_day: { date: string; net_pnl: number; trades_count: number } | null;
    equity_curve: Array<{
        trade_number: number;
        date: string;
        symbol: string;
        trade_pnl: number;
        cumulative_pnl: number;
    }>;
    monthly_pnl: Array<{ month: string; net_pnl: number; trades_count: number }>;
    weekly_pnl: Array<{ week: string; net_pnl: number; trades_count: number }>;
    daily_pnl_distribution: Array<{ date: string; net_pnl: number; trades_count: number }>;
    market_comparison: Array<{
        market_type: MarketType;
        trades_count: number;
        net_pnl: number;
        win_rate: number;
    }>;
    direction_comparison: {
        long: { count: number; net_pnl: number; win_rate: number };
        short: { count: number; net_pnl: number; win_rate: number };
    };
}