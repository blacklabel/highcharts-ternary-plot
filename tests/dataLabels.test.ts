import { describe, it, expect } from 'vitest';

// Regression test for #5: the afterDrawDataLabels handler must skip
// repositioning when dataLabels is disabled, and must handle both the
// object form and the array form of the dataLabels option.
//
// The condition from the plugin, extracted for unit testing:
//   const dl = this.options.dataLabels;
//   const labelsEnabled = Array.isArray(dl)
//       ? (dl as Highcharts.DataLabelsOptions[]).some(d => d.enabled !== false)
//       : dl?.enabled !== false;

type DL = { enabled?: boolean };

function labelsEnabled(dl: DL | DL[] | undefined): boolean {
    return Array.isArray(dl)
        ? dl.some(d => d.enabled !== false)
        : dl?.enabled !== false;
}

describe('labelsEnabled', () => {

    it('returns true when dataLabels is undefined', () => {
        expect(labelsEnabled(undefined)).toBe(true);
    });

    it('returns true when dataLabels has no enabled property', () => {
        expect(labelsEnabled({})).toBe(true);
    });

    it('returns true when dataLabels.enabled is true', () => {
        expect(labelsEnabled({ enabled: true })).toBe(true);
    });

    it('returns false when dataLabels.enabled is false', () => {
        expect(labelsEnabled({ enabled: false })).toBe(false);
    });

    it('returns true when dataLabels is an array with at least one enabled item', () => {
        expect(labelsEnabled([{ enabled: false }, { enabled: true }])).toBe(true);
    });

    it('returns true when dataLabels is an array with no explicit enabled property', () => {
        expect(labelsEnabled([{}, {}])).toBe(true);
    });

    it('returns false when dataLabels is an array with all items disabled', () => {
        expect(labelsEnabled([{ enabled: false }, { enabled: false }])).toBe(false);
    });

});
