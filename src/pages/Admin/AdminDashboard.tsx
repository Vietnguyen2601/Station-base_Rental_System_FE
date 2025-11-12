import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Activity,
	BarChart3,
	CheckCircle2,
	CircleDollarSign,
	Clock3,
	GaugeCircle,
	MapPin,
	PieChart,
	TrendingUp,
} from 'lucide-react';
import './AdminDashboard.scss';
import { dashboardService } from '../../services';
import type {
	StationOrdersFilters,
	StationOrdersSummary,
	StationRevenueSummary,
	StationUsageSummary,
} from '../../services';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6'];

const formatNumber = (value: number): string => value.toLocaleString('vi-VN');

const formatCurrency = (value: number): string =>
	value.toLocaleString('vi-VN', {
		style: 'currency',
		currency: 'VND',
		maximumFractionDigits: 0,
	});

const formatDateParam = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}/${month}/${day}`;
};

const toInputDate = (value?: string): string => {
	if (!value) {
		return '';
	}

	if (value.includes('/')) {
		const [year, month, day] = value.split('/');
		return `${year}-${month}-${day}`;
	}

	if (value.includes('T')) {
		return value.split('T')[0];
	}

	return value;
};

const toApiDate = (value?: string): string | undefined => {
	if (!value) {
		return undefined;
	}

	if (value.includes('/')) {
		return value;
	}

	return value.replace(/-/g, '/');
};

type FilterMode = 'monthly' | 'quarterly' | 'range';
type DashboardFilters = StationOrdersFilters;

interface FilterFormState {
	month: string;
	year: string;
	quarter: string;
	startDate: string;
	endDate: string;
}

const DEFAULT_FILTER_MODE: FilterMode = 'monthly';

const getMonthRange = (month: number, year: number) => {
	const normalizedMonth = Math.min(Math.max(month, 1), 12);
	const start = new Date(year, normalizedMonth - 1, 1);
	const end = new Date(year, normalizedMonth, 0);

	return {
		startDate: formatDateParam(start),
		endDate: formatDateParam(end),
	};
};

const getQuarterRange = (quarter: number, year: number) => {
	const normalizedQuarter = Math.min(Math.max(quarter, 1), 4);
	const startMonth = (normalizedQuarter - 1) * 3;
	const start = new Date(year, startMonth, 1);
	const end = new Date(year, startMonth + 3, 0);

	return {
		startDate: formatDateParam(start),
		endDate: formatDateParam(end),
	};
};

const deriveFormState = (mode: FilterMode, filters: DashboardFilters): FilterFormState => {
	const now = new Date();
	const fallbackMonth = now.getMonth() + 1;
	const fallbackYear = now.getFullYear();
	const fallbackQuarter = Math.floor(now.getMonth() / 3) + 1;
	const fallbackRange = getMonthRange(fallbackMonth, fallbackYear);

	switch (mode) {
		case 'monthly': {
			const month = filters.month ?? fallbackMonth;
			const year = filters.year ?? fallbackYear;
			return {
				month: month.toString(),
				year: year.toString(),
				quarter: '',
				startDate: '',
				endDate: '',
			};
		}
		case 'quarterly': {
			const year = filters.year ?? fallbackYear;
			const quarter = filters.quarter ?? fallbackQuarter;
			return {
				month: '',
				year: year.toString(),
				quarter: quarter.toString(),
				startDate: '',
				endDate: '',
			};
		}
		case 'range': {
			const startDate = filters.startDate ?? fallbackRange.startDate;
			const endDate = filters.endDate ?? fallbackRange.endDate;
			return {
				month: '',
				year: '',
				quarter: '',
				startDate: toInputDate(startDate),
				endDate: toInputDate(endDate),
			};
		}
		default:
			return {
				month: '',
				year: '',
				quarter: '',
				startDate: '',
				endDate: '',
			};
	}
};

const buildDefaultFilters = (): DashboardFilters => {
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();
	const { startDate, endDate } = getMonthRange(month, year);

	return {
		month,
		year,
		startDate,
		endDate,
	};
};


const AdminDashboard: React.FC = () => {
	const initialFilters = useMemo(() => buildDefaultFilters(), []);
	const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
	const [filterMode, setFilterMode] = useState<FilterMode>(DEFAULT_FILTER_MODE);
	const [formFilters, setFormFilters] = useState<FilterFormState>(() =>
		deriveFormState(DEFAULT_FILTER_MODE, initialFilters)
	);
	const [orderSummary, setOrderSummary] = useState<StationOrdersSummary | null>(null);
	const [revenueSummary, setRevenueSummary] = useState<StationRevenueSummary | null>(null);
	const [usageSummary, setUsageSummary] = useState<StationUsageSummary | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchDashboardData = useCallback(async (nextFilters: DashboardFilters) => {
		setIsLoading(true);
		setError(null);

		try {
			const [orders, revenue, usage] = await Promise.all([
				dashboardService.getStationOrders(nextFilters),
				dashboardService.getStationRevenue(nextFilters),
				dashboardService.getStationUsage(nextFilters),
			]);

			setOrderSummary(orders);
			setRevenueSummary(revenue);
			setUsageSummary(usage);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu thống kê.';
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDashboardData(filters);
	}, [fetchDashboardData, filters]);

	useEffect(() => {
		setFormFilters(deriveFormState(filterMode, filters));
	}, [filterMode, filters]);

	const handleFilterModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const nextMode = event.target.value as FilterMode;
		setFilterMode(nextMode);
		setFormFilters(deriveFormState(nextMode, filters));
		setError(null);
	};

	const handleFilterInputChange = (field: keyof FilterFormState, value: string) => {
		setFormFilters((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);

		let nextFilters: DashboardFilters | null = null;

		if (filterMode === 'monthly') {
			const month = Number(formFilters.month);
			const year = Number(formFilters.year);

			if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
				setError('Vui lòng nhập tháng và năm hợp lệ.');
				return;
			}

			const { startDate, endDate } = getMonthRange(month, year);

			nextFilters = {
				month,
				year,
				startDate,
				endDate,
			};
		} else if (filterMode === 'quarterly') {
			const year = Number(formFilters.year);
			const quarter = Number(formFilters.quarter);

			if (!Number.isInteger(year) || !Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
				setError('Vui lòng nhập quý và năm hợp lệ.');
				return;
			}

			const { startDate, endDate } = getQuarterRange(quarter, year);

			nextFilters = {
				year,
				quarter,
				startDate,
				endDate,
			};
		} else {
			const startDateInput = formFilters.startDate;
			const endDateInput = formFilters.endDate;

			if (!startDateInput || !endDateInput) {
				setError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
				return;
			}

			if (new Date(startDateInput) > new Date(endDateInput)) {
				setError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
				return;
			}

			const startDate = toApiDate(startDateInput);
			const endDate = toApiDate(endDateInput);

			if (!startDate || !endDate) {
				setError('Không thể xử lý giá trị ngày đã chọn.');
				return;
			}

			nextFilters = {
				startDate,
				endDate,
			};
		}

		if (!nextFilters) {
			return;
		}

		setFilters(nextFilters);
	};

	const handleResetFilters = () => {
		const resetFilters = buildDefaultFilters();
		setFilterMode(DEFAULT_FILTER_MODE);
		setFilters(resetFilters);
		setFormFilters(deriveFormState(DEFAULT_FILTER_MODE, resetFilters));
		setError(null);
	};

	const aggregatedOrders = useMemo(() => {
		if (!orderSummary) {
			return null;
		}

		return orderSummary.stations.reduce(
			(acc, station) => {
				acc.totalOrders += station.totalOrders ?? 0;
				acc.pendingOrders += station.pendingOrders ?? 0;
				acc.confirmedOrders += station.confirmedOrders ?? 0;
				acc.ongoingOrders += station.ongoingOrders ?? 0;
				acc.completedOrders += station.completedOrders ?? 0;
				acc.canceledOrders += station.canceledOrders ?? 0;
				return acc;
			},
			{
				totalOrders: 0,
				pendingOrders: 0,
				confirmedOrders: 0,
				ongoingOrders: 0,
				completedOrders: 0,
				canceledOrders: 0,
			}
		);
	}, [orderSummary]);

	const stats = useMemo(() => {
		const items: Array<{ title: string; value: string; icon: React.ReactNode; color: 'blue' | 'green' | 'purple' | 'orange' | 'red' }> = [];

		if (revenueSummary) {
			items.push({
				title: 'Tổng doanh thu',
				value: formatCurrency(revenueSummary.totalRevenue ?? 0),
				icon: <CircleDollarSign size={24} />,
				color: 'green',
			});
		}

		if (usageSummary && usageSummary.stations.length > 0) {
			const averageUsage =
				usageSummary.stations.reduce((sum, station) => sum + (station.usageRate ?? 0), 0) /
				usageSummary.stations.length;

			const usageValue = Math.round(averageUsage * 10) / 10;

			items.push({
				title: 'Tỷ lệ sử dụng trung bình',
				value: `${usageValue.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`,
				icon: <GaugeCircle size={24} />,
				color: 'red',
			});
		}

		if (aggregatedOrders) {
			const processingOrders = aggregatedOrders.confirmedOrders + aggregatedOrders.ongoingOrders;

			items.push(
				{
					title: 'Tổng đơn hàng',
					value: formatNumber(aggregatedOrders.totalOrders),
					icon: <TrendingUp size={24} />,
					color: 'blue',
				},
				{
					title: 'Đơn đang xử lý',
					value: formatNumber(processingOrders),
					icon: <PieChart size={24} />,
					color: 'purple',
				},
				{
					title: 'Đang chờ duyệt',
					value: formatNumber(aggregatedOrders.pendingOrders),
					icon: <Clock3 size={24} />,
					color: 'orange',
				},
				{
					title: 'Hoàn tất',
					value: formatNumber(aggregatedOrders.completedOrders),
					icon: <CheckCircle2 size={24} />,
					color: 'green',
				}
			);
		}

		return items;
	}, [aggregatedOrders, revenueSummary, usageSummary]);

	const revenueSegments = useMemo(() => {
		if (!revenueSummary || revenueSummary.stationRevenues.length === 0) {
			return [];
		}

		const total = (revenueSummary.totalRevenue ?? 0) > 0
			? revenueSummary.totalRevenue ?? 0
			: revenueSummary.stationRevenues.reduce((sum, station) => sum + (station.totalRevenue ?? 0), 0);

		return revenueSummary.stationRevenues.map((station, index) => {
			const revenue = station.totalRevenue ?? 0;
			const rawPercentage = total > 0 ? (revenue / total) * 100 : 0;
			const percentage = Math.round(rawPercentage * 10) / 10;

			return {
				station,
				revenue,
				rawPercentage,
				percentage,
				color: CHART_COLORS[index % CHART_COLORS.length],
			};
		});
	}, [revenueSummary]);

	const revenuePieGradient = useMemo(() => {
		if (revenueSegments.length === 0) {
			return 'conic-gradient(#e2e8f0 0% 100%)';
		}

		let cumulative = 0;

		const segments = revenueSegments.map((segment, index) => {
			const start = cumulative;
			const slice = index === revenueSegments.length - 1 ? 100 - start : segment.rawPercentage;
			cumulative += slice;
			const end = Math.min(cumulative, 100);
			return `${segment.color} ${start}% ${end}%`;
		});

		return `conic-gradient(${segments.join(', ')})`;
	}, [revenueSegments]);

	const orderBars = useMemo(() => {
		if (!orderSummary || orderSummary.stations.length === 0) {
			return [];
		}

		const maxTotal = Math.max(...orderSummary.stations.map((station) => station.totalOrders ?? 0), 0);

		return orderSummary.stations.map((station, index) => {
			const totalOrders = station.totalOrders ?? 0;
			const height = maxTotal > 0 ? (totalOrders / maxTotal) * 100 : 0;

			return {
				stationId: station.stationId,
				stationName: station.stationName,
				totalOrders,
				completedOrders: station.completedOrders ?? 0,
				height,
				color: CHART_COLORS[index % CHART_COLORS.length],
			};
		});
	}, [orderSummary]);

	const topOrderStation = useMemo(() => {
		if (!orderSummary || orderSummary.stations.length === 0) {
			return null;
		}

		return [...orderSummary.stations].sort((a, b) => (b.totalOrders ?? 0) - (a.totalOrders ?? 0))[0];
	}, [orderSummary]);

	const topRevenueSegment = useMemo(() => {
		if (revenueSegments.length === 0) {
			return null;
		}

		return [...revenueSegments].sort((a, b) => b.revenue - a.revenue)[0];
	}, [revenueSegments]);

	const completionRate = useMemo(() => {
		if (!aggregatedOrders || aggregatedOrders.totalOrders === 0) {
			return 0;
		}

		return Math.round((aggregatedOrders.completedOrders / aggregatedOrders.totalOrders) * 1000) / 10;
	}, [aggregatedOrders]);

	const stationDetails = useMemo(() => {
		const map = new Map<
			string,
			{
				stationId: string;
				stationName: string;
				address?: string;
				totalRevenue?: number;
				totalOrders?: number;
				pendingOrders?: number;
				confirmedOrders?: number;
				ongoingOrders?: number;
				completedOrders?: number;
				canceledOrders?: number;
				usageRate?: number;
				availabilityRate?: number;
				totalVehicles?: number;
				rentedVehicles?: number;
				availableVehicles?: number;
				maintenanceVehicles?: number;
				chargingVehicles?: number;
			}
		>();

		if (revenueSummary) {
			revenueSummary.stationRevenues.forEach((station) => {
				map.set(station.stationId, {
					stationId: station.stationId,
					stationName: station.stationName,
					address: station.address,
					totalRevenue: station.totalRevenue ?? 0,
					totalOrders: station.totalOrders ?? 0,
					completedOrders: station.completedOrders ?? 0,
					usageRate: station.usageRate ?? 0,
					totalVehicles: station.totalVehicles ?? 0,
					rentedVehicles: station.rentedVehicles ?? 0,
				});
			});
		}

		if (orderSummary) {
			orderSummary.stations.forEach((station) => {
				const existing = map.get(station.stationId) ?? {
					stationId: station.stationId,
					stationName: station.stationName,
					address: station.address,
				};

				map.set(station.stationId, {
					...existing,
					stationName: station.stationName ?? existing.stationName,
					address: station.address ?? existing.address,
					totalRevenue: existing.totalRevenue ?? 0,
					totalOrders: station.totalOrders ?? existing.totalOrders ?? 0,
					pendingOrders: station.pendingOrders ?? 0,
					confirmedOrders: station.confirmedOrders ?? 0,
					ongoingOrders: station.ongoingOrders ?? 0,
					completedOrders: station.completedOrders ?? existing.completedOrders ?? 0,
					canceledOrders: station.canceledOrders ?? 0,
					usageRate: existing.usageRate,
					totalVehicles: existing.totalVehicles,
					rentedVehicles: existing.rentedVehicles,
				});
			});
		}

		if (usageSummary) {
			usageSummary.stations.forEach((station) => {
				const existing = map.get(station.stationId) ?? {
					stationId: station.stationId,
					stationName: station.stationName,
					address: station.address,
				};

				map.set(station.stationId, {
					...existing,
					stationName: station.stationName ?? existing.stationName,
					address: station.address ?? existing.address,
					totalVehicles: station.totalVehicles ?? existing.totalVehicles,
					rentedVehicles: station.rentedVehicles ?? existing.rentedVehicles,
					availableVehicles: station.availableVehicles ?? existing.availableVehicles,
					maintenanceVehicles: station.maintenanceVehicles ?? existing.maintenanceVehicles,
					chargingVehicles: station.chargingVehicles ?? existing.chargingVehicles,
					usageRate: station.usageRate ?? existing.usageRate,
					availabilityRate: station.availabilityRate ?? existing.availabilityRate,
				});
			});
		}

		const result = Array.from(map.values());
		result.sort((a, b) => (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0));
		return result;
	}, [orderSummary, revenueSummary, usageSummary]);

	const filterSummary = revenueSummary ?? orderSummary ?? usageSummary;

	const usageTimestamp = useMemo(() => {
		if (!usageSummary?.timestamp) {
			return null;
		}

		const parsed = new Date(usageSummary.timestamp);
		if (Number.isNaN(parsed.getTime())) {
			return null;
		}

		return parsed.toLocaleString('vi-VN', { hour12: false });
	}, [usageSummary]);

	return (
		<div className="admin-dashboard">
			<div className="admin-dashboard__header">
				<h2>Tổng quan hệ thống</h2>
				<p>Thống kê tổng quan về hoạt động của hệ thống EVStation</p>
			</div>

			<form className="admin-dashboard__filters" onSubmit={handleApplyFilters}>
				<div className="admin-dashboard__filters-row">
					<label className="admin-dashboard__filters-field admin-dashboard__filters-field--grow">
						<span>Kiểu thống kê</span>
						<select value={filterMode} onChange={handleFilterModeChange}>
							<option value="monthly">Theo tháng</option>
							<option value="quarterly">Theo quý</option>
							<option value="range">Theo ngày (từ - đến)</option>
						</select>
					</label>
				</div>

				{filterMode === 'monthly' && (
					<div className="admin-dashboard__filters-row">
						<label className="admin-dashboard__filters-field">
							<span>Tháng</span>
							<input
								type="number"
								min={1}
								max={12}
								value={formFilters.month}
								onChange={(event) => handleFilterInputChange('month', event.target.value)}
								placeholder="VD: 11"
							/>
						</label>

						<label className="admin-dashboard__filters-field">
							<span>Năm</span>
							<input
								type="number"
								min={2000}
								max={2100}
								value={formFilters.year}
								onChange={(event) => handleFilterInputChange('year', event.target.value)}
								placeholder="VD: 2025"
							/>
						</label>
					</div>
				)}

				{filterMode === 'quarterly' && (
					<div className="admin-dashboard__filters-row">
						<label className="admin-dashboard__filters-field">
							<span>Năm</span>
							<input
								type="number"
								min={2000}
								max={2100}
								value={formFilters.year}
								onChange={(event) => handleFilterInputChange('year', event.target.value)}
								placeholder="VD: 2025"
							/>
						</label>

						<label className="admin-dashboard__filters-field">
							<span>Quý</span>
							<input
								type="number"
								min={1}
								max={4}
								value={formFilters.quarter}
								onChange={(event) => handleFilterInputChange('quarter', event.target.value)}
								placeholder="1 - 4"
							/>
						</label>
					</div>
				)}

				{filterMode === 'range' && (
					<div className="admin-dashboard__filters-row">
						<label className="admin-dashboard__filters-field admin-dashboard__filters-field--grow">
							<span>Ngày bắt đầu</span>
							<input
								type="date"
								value={formFilters.startDate}
								onChange={(event) => handleFilterInputChange('startDate', event.target.value)}
							/>
						</label>

						<label className="admin-dashboard__filters-field admin-dashboard__filters-field--grow">
							<span>Ngày kết thúc</span>
							<input
								type="date"
								value={formFilters.endDate}
								onChange={(event) => handleFilterInputChange('endDate', event.target.value)}
							/>
						</label>
					</div>
				)}

				<div className="admin-dashboard__filters-row">
					<div className="admin-dashboard__filters-actions">
						<button type="submit" className="admin-dashboard__filters-apply" disabled={isLoading}>
							Áp dụng
						</button>
						<button type="button" className="admin-dashboard__filters-reset" onClick={handleResetFilters} disabled={isLoading}>
							Đặt lại
						</button>
					</div>
				</div>

				<div className="admin-dashboard__filter-summary">
					{filterSummary ? (
						<>
							<span className="admin-dashboard__filter-badge">{filterSummary.filterType}</span>
							<p>{filterSummary.filterDescription}</p>
						</>
					) : (
						<p>Chọn thời gian và nhấn áp dụng để xem thống kê.</p>
					)}
				</div>
			</form>

			{isLoading && (
				<div className="admin-dashboard__state admin-dashboard__state--loading">
					Đang tải dữ liệu thống kê...
				</div>
			)}

			{error && !isLoading && (
				<div className="admin-dashboard__state admin-dashboard__state--error">
					<span>{error}</span>
					<button type="button" onClick={() => fetchDashboardData(filters)}>
						Thử lại
					</button>
				</div>
			)}

			{!isLoading && !error && stats.length > 0 && (
				<div className="admin-dashboard__stats">
					{stats.map((stat) => (
						<div key={stat.title} className={`admin-dashboard__stat admin-dashboard__stat--${stat.color}`}>
							<div className="admin-dashboard__stat-icon">{stat.icon}</div>
							<div className="admin-dashboard__stat-content">
								<h3>{stat.value}</h3>
								<p>{stat.title}</p>
							</div>
						</div>
					))}
				</div>
			)}

			{!isLoading && !error && (
				<div className="admin-dashboard__content">
					<div className="admin-dashboard__visual-grid">
						<div className="admin-dashboard__card admin-dashboard__card--pie">
							<div className="admin-dashboard__card-header">
								<h3>Doanh thu theo trạm</h3>
								<PieChart size={20} />
							</div>
							<div className="admin-dashboard__card-content">
								{revenueSegments.length === 0 ? (
									<p className="admin-dashboard__chart-empty">Chưa có dữ liệu doanh thu cho khoảng thời gian này.</p>
								) : (
									<div className="admin-dashboard__pie">
										<div className="admin-dashboard__pie-chart" style={{ backgroundImage: revenuePieGradient }}>
											<div className="admin-dashboard__pie-total">
												<strong>{formatCurrency(revenueSummary?.totalRevenue ?? 0)}</strong>
												<span>Tổng doanh thu</span>
											</div>
										</div>
										<ul className="admin-dashboard__pie-legend">
											{revenueSegments.map((segment) => (
												<li key={segment.station.stationId}>
													<span className="admin-dashboard__legend-marker" style={{ backgroundColor: segment.color }} />
													<div>
														<strong>{segment.station.stationName}</strong>
														<small>
															{formatCurrency(segment.revenue)} • {segment.percentage}% tổng doanh thu
														</small>
													</div>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						</div>

						<div className="admin-dashboard__card admin-dashboard__card--bars">
							<div className="admin-dashboard__card-header">
								<h3>Đơn hàng theo trạm</h3>
								<BarChart3 size={20} />
							</div>
							<div className="admin-dashboard__card-content">
								{orderBars.length === 0 ? (
									<p className="admin-dashboard__chart-empty">Chưa có dữ liệu đơn hàng cho khoảng thời gian này.</p>
								) : (
									<div className="admin-dashboard__bar-chart">
										{orderBars.map((bar) => (
											<div key={bar.stationId} className="admin-dashboard__bar">
												<div className="admin-dashboard__bar-column">
													<div
														className="admin-dashboard__bar-fill"
														style={{
															height: `${Math.max(bar.height, 4)}%`,
															backgroundColor: bar.color,
														}}
													/>
												</div>
												<span className="admin-dashboard__bar-label">{bar.stationName}</span>
												<small className="admin-dashboard__bar-value">{formatNumber(bar.totalOrders)} đơn</small>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="admin-dashboard__card admin-dashboard__card--usage">
						<div className="admin-dashboard__card-header">
							<h3>Tình trạng sử dụng xe theo trạm</h3>
							<GaugeCircle size={20} />
						</div>
						<div className="admin-dashboard__card-content">
							{usageSummary && usageSummary.stations.length > 0 ? (
								<>
									{usageTimestamp && (
										<p className="admin-dashboard__usage-timestamp">Cập nhật: {usageTimestamp}</p>
									)}
									<div className="admin-dashboard__usage-grid">
										{usageSummary.stations.map((station) => {
											const usageRateRaw = station.usageRate ?? 0;
											const availabilityRateRaw = station.availabilityRate ?? 0;
											const normalizedUsage = usageRateRaw > 1 ? usageRateRaw : usageRateRaw * 100;
											const normalizedAvailability = availabilityRateRaw > 1 ? availabilityRateRaw : availabilityRateRaw * 100;

											return (
												<div key={station.stationId} className="admin-dashboard__usage-card">
													<div className="admin-dashboard__usage-header">
														<h4>{station.stationName}</h4>
														{station.address && (
															<span>
																<MapPin size={14} />
																{station.address}
															</span>
														)}
													</div>

													<div className="admin-dashboard__usage-metrics">
														<div className="admin-dashboard__usage-metrics-item">
															<span>Tổng số xe</span>
															<strong>{formatNumber(station.totalVehicles ?? 0)}</strong>
														</div>
														<div className="admin-dashboard__usage-metrics-item">
															<span>Xe đang thuê</span>
															<strong>{formatNumber(station.rentedVehicles ?? 0)}</strong>
														</div>
														<div className="admin-dashboard__usage-metrics-item">
															<span>Xe sẵn sàng</span>
															<strong>{formatNumber(station.availableVehicles ?? 0)}</strong>
														</div>
														<div className="admin-dashboard__usage-metrics-item">
															<span>Xe bảo trì</span>
															<strong>{formatNumber(station.maintenanceVehicles ?? 0)}</strong>
														</div>
													</div>

													<div className="admin-dashboard__usage-progress">
														<div>
															<strong>Tỷ lệ sử dụng</strong>
															<div className="admin-dashboard__usage-progress-bar">
																<div
																	className="admin-dashboard__usage-progress-bar-fill"
																	style={{ width: `${Math.min(normalizedUsage, 100)}%` }}
																/>
															</div>
															<div className="admin-dashboard__usage-progress-labels">
																<span>0%</span>
																<span>{normalizedUsage.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span>
															</div>
														</div>
														<div>
															<strong>Tỷ lệ sẵn sàng</strong>
															<div className="admin-dashboard__usage-progress-bar">
																<div
																	className="admin-dashboard__usage-progress-bar-fill"
																	style={{
																		width: `${Math.min(normalizedAvailability, 100)}%`,
																		background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.85), rgba(59, 130, 246, 0.85))',
																	}}
																/>
															</div>
															<div className="admin-dashboard__usage-progress-labels">
																<span>0%</span>
																<span>{normalizedAvailability.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span>
															</div>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</>
							) : (
								<p className="admin-dashboard__chart-empty">Chưa có dữ liệu tỷ lệ sử dụng xe.</p>
							)}
						</div>
					</div>

					<div className="admin-dashboard__card admin-dashboard__card--table">
						<div className="admin-dashboard__card-header">
							<h3>Bảng chi tiết trạm</h3>
							<Activity size={20} />
						</div>
						<div className="admin-dashboard__card-content">
							{stationDetails.length === 0 ? (
								<p className="admin-dashboard__table-empty">Chưa có dữ liệu thống kê trong khoảng thời gian đã chọn.</p>
							) : (
								<div className="admin-dashboard__table-wrapper">
									<table className="admin-dashboard__table">
										<thead>
											<tr>
												<th>Trạm</th>
												<th>Doanh thu</th>
												<th>Tổng đơn</th>
												<th>Hoàn tất</th>
												<th>Đang xử lý</th>
												<th>Chờ duyệt</th>
												<th>Đã hủy</th>
												<th>Tỷ lệ sử dụng</th>
												<th>Tỷ lệ sẵn sàng</th>
											</tr>
										</thead>
										<tbody>
											{stationDetails.map((station) => {
												const processingOrders = (station.confirmedOrders ?? 0) + (station.ongoingOrders ?? 0);
												const usageRateNormalized = (station.usageRate ?? 0) <= 1
													? (station.usageRate ?? 0) * 100
													: station.usageRate ?? 0;
												const availabilityRateNormalized = (station.availabilityRate ?? 0) <= 1
													? (station.availabilityRate ?? 0) * 100
													: station.availabilityRate ?? 0;

												return (
													<tr key={station.stationId}>
														<td>
															<div className="admin-dashboard__station">
																<span className="admin-dashboard__station-name">{station.stationName}</span>
																{station.address && (
																	<span className="admin-dashboard__station-address">
																		<MapPin size={14} />
																		{station.address}
																	</span>
																)}
															</div>
														</td>
														<td className="admin-dashboard__table-number">{formatCurrency(station.totalRevenue ?? 0)}</td>
														<td>{formatNumber(station.totalOrders ?? 0)}</td>
														<td>{formatNumber(station.completedOrders ?? 0)}</td>
														<td>{formatNumber(processingOrders)}</td>
														<td>{formatNumber(station.pendingOrders ?? 0)}</td>
														<td>{formatNumber(station.canceledOrders ?? 0)}</td>
														<td>{usageRateNormalized.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</td>
														<td>{availabilityRateNormalized.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>

					<div className="admin-dashboard__card admin-dashboard__card--highlights">
						<div className="admin-dashboard__card-header">
							<h3>Thông tin nổi bật</h3>
							<Activity size={20} />
						</div>
						<div className="admin-dashboard__card-content admin-dashboard__highlights">
							<div className="admin-dashboard__highlight-item">
								<span className="admin-dashboard__highlight-label">Số trạm đang theo dõi</span>
								<strong>{formatNumber(stationDetails.length)}</strong>
							</div>
							<div className="admin-dashboard__highlight-item">
								<span className="admin-dashboard__highlight-label">Tỷ lệ hoàn tất</span>
								<strong>{completionRate}%</strong>
							</div>
							{topRevenueSegment && (
								<div className="admin-dashboard__highlight-item">
									<span className="admin-dashboard__highlight-label">Doanh thu cao nhất</span>
									<strong>{topRevenueSegment.station.stationName}</strong>
									<small>
										{formatCurrency(topRevenueSegment.revenue)} • {topRevenueSegment.percentage}% tổng doanh thu
									</small>
								</div>
							)}
							{topOrderStation && (
								<div className="admin-dashboard__highlight-item">
									<span className="admin-dashboard__highlight-label">Trạm nhiều đơn nhất</span>
									<strong>{topOrderStation.stationName}</strong>
									<small>
										{formatNumber(topOrderStation.totalOrders ?? 0)} đơn • {formatNumber(topOrderStation.completedOrders ?? 0)} hoàn tất
									</small>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminDashboard;
