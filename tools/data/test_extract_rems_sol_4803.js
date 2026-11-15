'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  CSV_COLUMNS,
  OUTPUT_PATH,
  buildObservationsCsv,
  parseCsvRecord,
  selectObservations,
} = require('./extract_rems_sol_4803');

const datasetRoot = path.resolve(__dirname, '../../data/environment/rems-sol-4803');
const sourceRoot = path.join(datasetRoot, 'source');
const manifest = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'manifest.json'), 'utf8'));
const productTab = path.join(sourceRoot, 'RME_823829944RMD48030000000_______P1.TAB');
const adrTab = path.join(sourceRoot, 'RME_823829944ADR48030000000_______P1.TAB');

function readLogicalLines(filePath) {
  const lines = fs.readFileSync(filePath, 'ascii').trimEnd().split('\r\n');
  return lines;
}

function encodeCsvRecord(fields) {
  return fields.map((field) => {
    const value = String(field);
    return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  }).join(',');
}

function csvRecords(csv) {
  const [header, ...lines] = csv.trimEnd().split('\n');
  const columns = parseCsvRecord(header, 'extracted CSV header');
  return lines.map((line, index) => {
    const values = parseCsvRecord(line, `extracted CSV row ${index + 1}`);
    assert.equal(values.length, columns.length);
    return Object.fromEntries(columns.map((column, columnIndex) => [column, values[columnIndex]]));
  });
}

test('PDS CSV record parser preserves quoted text and rejects malformed records', () => {
  assert.deepEqual(parseCsvRecord('12,"a, b","said ""hello"""', 'fixture'), ['12', 'a, b', 'said "hello"']);
  assert.throws(() => parseCsvRecord('12,"unfinished', 'fixture'), /unterminated quoted field/);
  assert.throws(() => parseCsvRecord('12"x,bad', 'fixture'), /quote began inside/);
});

test('verified Sol 4803 extraction retains exact product readings and matched rover positions', () => {
  const generated = buildObservationsCsv();
  assert.equal(fs.readFileSync(OUTPUT_PATH, 'utf8'), generated);
  const records = csvRecords(generated);
  const sourceRows = readLogicalLines(productTab).map((line, index) => parseCsvRecord(line, `MODRDR ${index + 1}`));
  const adrRows = readLogicalLines(adrTab).slice(1).map((line, index) => parseCsvRecord(line, `ADR ${index + 1}`));
  const sourceGaps = sourceRows.slice(1).map((row, index) => Number(row[0]) - Number(sourceRows[index][0]));

  assert.deepEqual(CSV_COLUMNS.slice(0, 7), [
    'product_id',
    'release_id',
    'planet_day_number',
    'source_row_number',
    'source_timestamp_seconds_since_2000_noon',
    'source_lmst',
    'source_ltst',
  ]);
  assert.equal(records.length, 33);
  assert.equal(records[0].product_id, manifest.product_id);
  assert.equal(records[0].release_id, '0042');
  assert.equal(records[0].planet_day_number, '4803');
  assert.equal(records[0].source_row_number, '1');
  assert.equal(records[0].source_timestamp_seconds_since_2000_noon, sourceRows[0][0]);
  assert.equal(sourceRows.length, 30801);
  assert.equal(sourceRows.filter((row) => row[15] === '-999.00').length, 0);
  assert.equal(sourceRows.filter((row) => row[37] === '-999.00').length, 0);
  assert.equal(sourceGaps.filter((gap) => gap > 1).length, 15);
  assert.equal(Math.max(...sourceGaps), 3403);

  for (const record of records) {
    const sourceIndex = Number(record.source_row_number) - 1;
    const source = sourceRows[sourceIndex];
    const locationIndex = Number(record.location_source_row_number) - 1;
    const location = adrRows[locationIndex];

    assert.equal(record.source_timestamp_seconds_since_2000_noon, source[0]);
    assert.equal(record.source_lmst, source[1]);
    assert.equal(record.source_ltst, source[2]);
    assert.equal(record.ambient_temperature_k, source[15]);
    assert.equal(record.ambient_temperature_confidence_code, source[16]);
    assert.equal(record.pressure_pa, source[37]);
    assert.equal(record.pressure_absolute_accuracy_pa, source[38]);
    assert.equal(record.pressure_confidence_code, source[39]);
    assert.equal(record.pressure_sensor_configuration, source[36]);
    assert.equal(record.location_timestamp_seconds_since_2000_noon, location[0]);
    assert.equal(record.location_timestamp_seconds_since_2000_noon, record.source_timestamp_seconds_since_2000_noon);
    assert.equal(record.rover_position_x_m, location[5]);
    assert.equal(record.rover_position_y_m, location[6]);
    assert.equal(record.rover_position_z_m, location[7]);
    assert.equal(record.source_product_url, manifest.files.find((file) => file.role === 'REMS MODRDR observation table').url);
    assert.equal(record.location_product_url, manifest.files.find((file) => file.role.startsWith('Same-sol ADR')).url);
  }

  assert.equal(records.some((record) => record.utc_timestamp), false);
  assert.equal(new Set(records.map((record) => Math.floor((Number(record.source_timestamp_seconds_since_2000_noon) - Number(sourceRows[0][0])) / 1800))).size, 33);
});

test('missing sentinel rows are not converted to zero and the next valid source row is selected', () => {
  const remsRows = readLogicalLines(productTab);
  const first = parseCsvRecord(remsRows[0], 'MODRDR source record 1');
  first[15] = '-999.00';
  const remsFixture = [encodeCsvRecord(first), remsRows[1]];
  const adrFixture = readLogicalLines(adrTab).slice(1, 3);

  const selected = selectObservations(remsFixture, adrFixture, manifest);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].sourceRowNumber, 2);
  assert.notEqual(selected[0].ambientTemperature, '0');
  assert.notEqual(selected[0].ambientTemperature, '-999.00');
});

test('malformed or unlocated source records fail instead of producing invented position data', () => {
  const remsRows = readLogicalLines(productTab);
  const adrRows = readLogicalLines(adrTab).slice(1, 2);
  assert.throws(() => selectObservations([remsRows[0].split(',').slice(0, 39).join(',')], adrRows, manifest), /has 39 fields; expected 40/);
  assert.throws(() => selectObservations([remsRows[0]], [], manifest), /No exact-timestamp ADR geometry match/);
});
