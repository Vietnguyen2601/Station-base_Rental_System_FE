import {
  formatCurrency,
  formatDate,
  formatBatteryLevel,
  formatVehicleStatus,
  truncateText,
} from '../../utils/formatters';

describe('Formatter Utilities', () => {
  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      expect(formatCurrency(25.50)).toBe('$25.50');
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    it('formats different currencies', () => {
      expect(formatCurrency(25.50, 'EUR', 'en-US')).toBe('€25.50');
    });
  });

  describe('formatDate', () => {
    it('formats date with default options', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan 15, 2024/);
    });

    it('formats date string', () => {
      const formatted = formatDate('2024-01-15');
      expect(formatted).toMatch(/Jan 15, 2024/);
    });
  });

  describe('formatBatteryLevel', () => {
    it('returns high class for high battery', () => {
      const result = formatBatteryLevel(80);
      expect(result.formatted).toBe('80%');
      expect(result.className).toBe('battery-high');
    });

    it('returns medium class for medium battery', () => {
      const result = formatBatteryLevel(40);
      expect(result.formatted).toBe('40%');
      expect(result.className).toBe('battery-medium');
    });

    it('returns low class for low battery', () => {
      const result = formatBatteryLevel(15);
      expect(result.formatted).toBe('15%');
      expect(result.className).toBe('battery-low');
    });
  });

  describe('formatVehicleStatus', () => {
    it('formats available status', () => {
      const result = formatVehicleStatus('available');
      expect(result.formatted).toBe('Available');
      expect(result.className).toBe('status-success');
    });

    it('formats unknown status', () => {
      const result = formatVehicleStatus('unknown');
      expect(result.formatted).toBe('unknown');
      expect(result.className).toBe('status-default');
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = truncateText(longText, 20);
      expect(result).toBe('This is a very long ...');
    });

    it('returns original text if shorter than max length', () => {
      const shortText = 'Short text';
      const result = truncateText(shortText, 20);
      expect(result).toBe('Short text');
    });
  });
});