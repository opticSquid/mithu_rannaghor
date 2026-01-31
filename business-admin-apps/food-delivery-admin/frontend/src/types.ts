export interface User {
    user_id: number;
    name: string;
    mobile_no: string;
    building_no: string;
    room_no: string;
    role: 'normal' | 'admin';
    plan: 'monthly' | 'one_off';
    balance: number;
}

export interface DailyLog {
    log_id: number;
    user_id: number;
    user_name?: string;
    log_date: string;
    meal_type: 'lunch' | 'dinner';
    has_main_meal: boolean;
    is_special: boolean;
    special_dish_name: string;
    extra_rice_qty: number;
    extra_roti_qty: number;
    total_cost: number;
}

export interface Expense {
    expense_id: number;
    expense_date: string;
    reason: string;
    amount: number;
    created_at: string;
}

export interface BillReport {
    user: User;
    start_date: string;
    end_date: string;
    logs: DailyLog[];
    total_spent: number;
    opening_balance: number;
    closing_balance: number;
}

export interface DashboardStats {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    monthly_revenue: number;
    monthly_expenses: number;
    active_customers: number;
    wallet_pool: number;
}

export interface TrendPoint {
    date: string;
    revenue: number;
    expenses: number;
}

export interface AnalyticsStats {
    trends: TrendPoint[];
    meal_types: { [key: string]: number };
    shifts: { [key: string]: number };
    total_revenue: number;
    total_expenses: number;
    profit_percentage: number;
}
