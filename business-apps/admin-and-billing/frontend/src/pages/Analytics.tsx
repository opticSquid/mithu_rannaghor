import { createSignal, onMount, For, Show } from 'solid-js';
import axios from 'axios';
import { AnalyticsStats } from '../types';
import { BarChart3, TrendingUp, DollarSign, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-solid';
import { SolidApexCharts } from 'solid-apexcharts';
import { useI18n } from '../i18n';

const Analytics = () => {
    const { t } = useI18n();
    const [stats, setStats] = createSignal<AnalyticsStats | null>(null);
    const [loading, setLoading] = createSignal(true);

    onMount(async () => {
        try {
            const res = await axios.get('/api/analytics');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    });

    const trendChartOptions = () => ({
        chart: {
            id: 'revenue-trend-chart',
            toolbar: { show: false },
            fontFamily: 'inherit',
            background: 'transparent',
            animations: { enabled: true }
        },
        stroke: { curve: 'smooth' as const, width: 3 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 100]
            }
        },
        colors: ['#10b981', '#f43f5e'], // Emerald-500, Rose-500
        xaxis: {
            categories: stats()?.trends.map(t => new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })) || [],
            labels: { style: { colors: '#94a3b8' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: { colors: '#94a3b8' },
                formatter: (val: number) => `₹${val.toLocaleString('en-IN')}`
            }
        },
        grid: { borderColor: '#1e293b', strokeDashArray: 4 },
        legend: { labels: { colors: '#cbd5e1' }, position: 'top' as const },
        theme: { mode: 'dark' as const }
    });

    const trendChartSeries = () => [
        { name: t('revenue'), data: stats()?.trends.map(t => t.revenue) || [] },
        { name: t('expenses'), data: stats()?.trends.map(t => t.expenses) || [] }
    ];

    const mealTypeOptions = () => ({
        chart: { id: 'meal-type-chart', background: 'transparent' },
        labels: Object.keys(stats()?.meal_types || {}),
        colors: ['#3b82f6', '#8b5cf6'], // Blue-500, Violet-500
        legend: { position: 'bottom' as const, labels: { colors: '#cbd5e1' } },
        stroke: { show: false },
        theme: { mode: 'dark' as const },
        plotOptions: {
            pie: {
                donut: {
                    size: '75%',
                    labels: {
                        show: true,
                        total: { show: true, label: t('totalMeals'), color: '#94a3b8' },
                        value: { color: '#ffffff' }
                    }
                }
            }
        }
    });

    const shiftOptions = () => ({
        chart: { id: 'shift-chart', toolbar: { show: false }, background: 'transparent' },
        xaxis: {
            categories: Object.keys(stats()?.shifts || {}),
            labels: { style: { colors: '#94a3b8' } }
        },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#f59e0b'], // Amber-500
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '40%',
                distributed: false
            }
        },
        grid: { borderColor: '#1e293b' },
        theme: { mode: 'dark' as const }
    });

    return (
        <div class="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 class="text-4xl font-black text-[var(--md-sys-color-primary)] tracking-tight">{t('businessAnalytics')}</h2>
                    <p class="text-[var(--md-sys-color-on-surface-variant)] mt-2 text-lg">{t('detailedInsights')}</p>
                </div>
                <div class="bg-[var(--md-sys-color-secondary-container)] px-6 py-3 rounded-2xl flex items-center gap-3 shadow-inner border border-[var(--md-sys-color-outline-variant)]">
                    <BarChart3 class="text-[var(--md-sys-color-primary)]" />
                    <span class="text-sm font-bold tracking-wide uppercase opacity-70">{t('outlook30Day')}</span>
                </div>
            </header>

            <Show when={!loading()} fallback={<div class="flex items-center justify-center h-64"><div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>}>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SummaryCard
                        label={t('revenue30d')}
                        value={`₹${stats()?.total_revenue.toLocaleString('en-IN')}`}
                        icon={TrendingUp}
                        color="text-emerald-400"
                        trend={t('vsLastMonthRev')}
                    />
                    <SummaryCard
                        label={t('expenses30d')}
                        value={`₹${stats()?.total_expenses.toLocaleString('en-IN')}`}
                        icon={DollarSign}
                        color="text-rose-400"
                        trend={t('vsLastMonthExp')}
                    />
                    <SummaryCard
                        label={t('profitMargin')}
                        value={`${stats()?.profit_percentage.toFixed(1)}%`}
                        icon={Percent}
                        color="text-violet-400"
                        trend={t('healthy')}
                    />
                    <SummaryCard
                        label={t('netResult')}
                        value={`₹${((stats()?.total_revenue || 0) - (stats()?.total_expenses || 0)).toLocaleString('en-IN')}`}
                        icon={stats() && (stats()!.total_revenue >= stats()!.total_expenses) ? ArrowUpRight : ArrowDownRight}
                        color={(stats()?.total_revenue || 0) >= (stats()?.total_expenses || 0) ? "text-emerald-400" : "text-rose-400"}
                        trend={t('netMonthlyImpact')}
                    />
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Trend Chart */}
                    <div class="lg:col-span-2 md-card p-8">
                        <div class="mb-6">
                            <h3 class="text-xl font-bold flex items-center gap-2">
                                <TrendingUp size={20} class="text-primary" />
                                {t('revenueVsExpensesTrend')}
                            </h3>
                            <p class="text-sm text-text-dim mt-1">{t('dailyComparison')}</p>
                        </div>
                        <div class="h-[400px] w-full">
                            <SolidApexCharts
                                type="area"
                                options={trendChartOptions()}
                                series={trendChartSeries()}
                                width="100%"
                                height="100%"
                            />
                        </div>
                    </div>

                    <div class="space-y-8">
                        {/* Meal Distribution */}
                        <div class="md-card p-8">
                            <h3 class="text-xl font-bold mb-6">{t('mealDistribution')}</h3>
                            <div class="h-[300px]">
                                <SolidApexCharts
                                    type="donut"
                                    options={mealTypeOptions()}
                                    series={Object.values(stats()?.meal_types || {})}
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        </div>

                        {/* Shift Comparison */}
                        <div class="md-card p-8">
                            <h3 class="text-xl font-bold mb-6">{t('shiftComparison')}</h3>
                            <div class="h-[200px]">
                                <SolidApexCharts
                                    type="bar"
                                    options={shiftOptions()}
                                    series={[{ name: t('volume'), data: Object.values(stats()?.shifts || {}) }]}
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
};

const SummaryCard = (props: { label: string; value: string; icon: any; color: string; trend: string }) => (
    <div class="md-card p-6 border-none shadow-xl bg-gradient-to-br from-white/[0.05] to-transparent">
        <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-bold tracking-wider uppercase opacity-50">{props.label}</span>
            <div class={`p-2 rounded-xl bg-white/5 ${props.color}`}>
                <props.icon size={20} />
            </div>
        </div>
        <div class="space-y-1">
            <h4 class="text-3xl font-black tracking-tight">{props.value}</h4>
            <p class="text-xs opacity-40 font-medium">{props.trend}</p>
        </div>
    </div>
);

export default Analytics;
