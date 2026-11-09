import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lengthShiftCm, matchSize } from '../src/sizing.js';
import { isPrivateAddress } from '../src/fetchProduct.js';

const chart = {
  unit: 'cm' as const,
  rows: [
    { size: 'S', bust: { min: 84, max: 88 }, waist: { min: 66, max: 70 }, hips: { min: 92, max: 98 }, inseam: null, footLength: null },
    { size: 'M', bust: { min: 88, max: 94 }, waist: { min: 70, max: 76 }, hips: { min: 98, max: 104 }, inseam: null, footLength: null },
    { size: 'L', bust: { min: 94, max: 100 }, waist: { min: 76, max: 82 }, hips: { min: 104, max: 110 }, inseam: null, footLength: null },
  ],
};
const body = { heightCm: 162, bustCm: 92, waistCm: 74, hipsCm: 102 };

test('picks the smallest size where nothing is tight', () => {
  const r = matchSize(chart, body, 'none');
  assert.equal(r.recommended, 'M');
  assert.deepEqual(r.usedMeasures, ['bust', 'waist', 'hips']);
});

test('stretch allows a little over the max', () => {
  const r = matchSize(chart, { ...body, bustCm: 89, waistCm: 71, hipsCm: 99 }, 'high');
  assert.equal(r.recommended, 'S');
});

test('reports borderline when the next size down is close on one measure', () => {
  const r = matchSize(chart, { bustCm: 87, waistCm: 69, hipsCm: 99.5 }, 'none');
  assert.equal(r.recommended, 'M');
  assert.deepEqual(r.borderline, { size: 'S', measure: 'hips', overCm: 1.5 });
});

test('converts inches', () => {
  const r = matchSize(
    { unit: 'in', rows: [{ size: '8', bust: { min: 35, max: 36 }, waist: null, hips: null, inseam: null, footLength: null }] },
    { bustCm: 90 },
    'none',
  );
  assert.equal(r.rows[0].fits[0].status, 'fits');
});

test('falls back to the largest size when everything is tight', () => {
  const r = matchSize(chart, { hipsCm: 120 }, 'none');
  assert.equal(r.recommended, 'L');
});

test('length shift: shorter user, hem lands lower', () => {
  assert.equal(lengthShiftCm(176, 162), 6.6);
  assert.equal(lengthShiftCm(null, 162), null);
});

test('blocks private addresses', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.5', '172.20.0.1', '169.254.169.254', '::1', '::ffff:10.0.0.1', 'fd00::1']) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  assert.equal(isPrivateAddress('151.101.1.69'), false);
});
