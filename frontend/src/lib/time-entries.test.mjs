import assert from 'node:assert/strict';
import { test } from 'node:test';
import { entryDurationMinutes, entryOutsideCount, entryOutsideMinutes, entryPausedMinutes, summarizeEntryDays, warsawTime } from './time-entries.ts';

const entry = (overrides = {}) => ({
    id: 'entry-1',
    start_time: '2026-10-29T08:00:00Z',
    end_time: '2026-10-29T10:00:00Z',
    user: { id: 'user-1', first_name: 'Jan', last_name: 'Kowalski' },
    project: null,
    task: null,
    was_edited: false,
    is_outside_geofence: false,
    ...overrides,
});
const pause = (overrides = {}) => ({
    id: 'pause-1',
    paused_at: '2026-10-29T08:30:00Z',
    resumed_at: '2026-10-29T08:45:00Z',
    resume_source: 'scan',
    ...overrides,
});

test('outside intervals count as work, legacy pauses alone are subtracted', () => {
    const value = entry({ geofence_pauses: [
        pause({ is_work_time: true }),
        pause({ id: 'legacy', resumed_at: '2026-10-29T08:40:00Z', is_work_time: false }),
        pause({ id: 'old-without-flag', resumed_at: '2026-10-29T08:35:00Z' }),
    ] });
    assert.equal(entryOutsideMinutes(value), 15);
    assert.equal(entryOutsideCount(value), 1);
    assert.equal(entryPausedMinutes(value), 15);
    assert.equal(entryDurationMinutes(value), 105);
});

test('server totals take precedence, including zero', () => {
    const value = entry({ duration_minutes: 90, outside_minutes: 22, outside_count: 3, paused_minutes: 8, geofence_pauses: [pause({ is_work_time: true })] });
    assert.deepEqual([entryDurationMinutes(value), entryOutsideMinutes(value), entryOutsideCount(value), entryPausedMinutes(value)], [90, 22, 3, 8]);
    const zero = { ...value, duration_minutes: 0, outside_minutes: 0, outside_count: 0, paused_minutes: 0 };
    assert.deepEqual([entryDurationMinutes(zero), entryOutsideMinutes(zero), entryOutsideCount(zero), entryPausedMinutes(zero)], [0, 0, 0, 0]);
});

test('open intervals end at the entry end or the supplied current time', () => {
    const now = new Date('2026-10-29T09:00:00Z');
    const value = entry({ geofence_pauses: [pause({ resumed_at: null, is_work_time: true })] });
    assert.equal(entryOutsideMinutes(value, now), 90);
    assert.equal(entryOutsideMinutes({ ...value, end_time: null }, now), 30);
    assert.equal(entryDurationMinutes({ ...value, end_time: null }, now), 60);
    const legacy = entry({ end_time: null, geofence_pauses: [pause({ resumed_at: null })] });
    assert.equal(entryPausedMinutes(legacy, now), 30);
    assert.equal(entryDurationMinutes(legacy, now), 30);
});

test('invalid or backwards intervals do not produce invalid or negative totals', () => {
    const value = entry({ geofence_pauses: [pause({ paused_at: 'invalid', is_work_time: true }), pause({ resumed_at: '2026-10-29T08:00:00Z', is_work_time: true })] });
    assert.equal(entryOutsideMinutes(value), 0);
    assert.equal(entryDurationMinutes(entry({ end_time: '2026-10-29T07:00:00Z' })), 0);
});

test('day summary uses Warsaw start day, earliest start, employee ID and overtime totals', () => {
    const rows = summarizeEntryDays([
        entry({ start_time: '2026-10-28T23:30:00Z', duration_minutes: 20, is_overtime: true, outside_minutes: 5, outside_count: 1 }),
        entry({ id: 'earlier', start_time: '2026-10-28T23:05:00Z', duration_minutes: 30, outside_minutes: 2, outside_count: 1 }),
        entry({ id: 'same-name', user: { id: 'user-2', first_name: 'Jan', last_name: 'Kowalski' }, duration_minutes: 10 }),
    ]);
    assert.equal(rows.length, 2);
    const row = rows.find((item) => item.duration === 50);
    assert.ok(row);
    assert.equal(row.day, '2026-10-29');
    assert.equal(row.start, '2026-10-28T23:05:00Z');
    assert.equal(warsawTime(row.start), '00:05');
    assert.deepEqual([row.duration, row.overtime, row.outside, row.outsideCount], [50, 20, 7, 2]);
});

test('Warsaw summary observes summer time and retains the start day across midnight', () => {
    const [summer] = summarizeEntryDays([entry({ start_time: '2026-07-01T22:30:00Z', end_time: '2026-07-03T01:00:00Z', duration_minutes: 60, is_overtime: true })]);
    assert.equal(summer.day, '2026-07-02');
    assert.equal(warsawTime(summer.start), '00:30');
    assert.equal(summer.overtime, 60);
});
