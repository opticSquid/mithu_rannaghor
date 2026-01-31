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

export interface BillReport {
    user: User;
    start_date: string;
    end_date: string;
    logs: DailyLog[];
    total_spent: number;
    opening_balance: number;
    closing_balance: number;
}
