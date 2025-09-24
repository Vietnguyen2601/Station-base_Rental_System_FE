/**
 * Utility functions for formatting data display
 */

/**
 * Format currency values
 */
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date values
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
  locale = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

/**
 * Format battery percentage with appropriate styling class
 */
export const formatBatteryLevel = (level: number): {
  formatted: string;
  className: string;
} => {
  const formatted = `${level}%`;
  let className = 'battery-high';

  if (level <= 20) {
    className = 'battery-low';
  } else if (level <= 50) {
    className = 'battery-medium';
  }

  return { formatted, className };
};

/**
 * Format vehicle status for display
 */
export const formatVehicleStatus = (status: string): {
  formatted: string;
  className: string;
} => {
  const statusMap: Record<string, { formatted: string; className: string }> = {
    available: { formatted: 'Available', className: 'status-success' },
    rented: { formatted: 'Rented', className: 'status-error' },
    charging: { formatted: 'Charging', className: 'status-warning' },
    maintenance: { formatted: 'Maintenance', className: 'status-error' },
  };

  return statusMap[status] || { formatted: status, className: 'status-default' };
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};