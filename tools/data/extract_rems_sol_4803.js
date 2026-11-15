'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const REPOSITORY_ROOT = path.resolve(__dirname, '../..');
const DATASET_ROOT = path.join(REPOSITORY_ROOT, 'data/environment/rems-sol-4803');
const SOURCE_ROOT = path.join(DATASET_ROOT, 'source');
const MANIFEST_PATH = path.join(DATASET_ROOT, 'manifest.json');
const OUTPUT_PATH = path.join(DATASET_ROOT, 'observations.csv');
const SAMPLE_BIN_SECONDS = 1800;

const CSV_COLUMNS = [
  'product_id',
  'release_id',
  'planet_day_number',
  'source_row_number',
  'source_timestamp_seconds_since_2000_noon',
  'source_lmst',
  'source_ltst',
  'ambient_temperature_k',
  'ambient_temperature_confidence_code',
  'pressure_pa',
  'pressure_absolute_accuracy_pa',
  'pressure_confidence_code',
  'pressure_sensor_configuration',
  'source_product_url',
  'location_product_id',
  'location_source_row_number',
  'location_timestamp_seconds_since_2000_noon',
  'rover_position_x_m',
  'rover_position_y_m',
  'rover_position_z_m',
  'location_product_url',
];

function fail(message) {
  throw new Error(message);
}

function parseCsvRecord(line, context) {
  const fields = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"' && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      if (value.length !== 0) fail(`${context}: quote began inside an unquoted field`);
      quoted = true;
    } else if (character === ',') {
      fields.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) fail(`${context}: unterminated quoted field`);
  fields.push(value.trim());
  return fields;
}

function csvCell(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function pds3Value(label, key) {
  const match = label.match(new RegExp(`(?:^|\\r?\\n)\\s*${key}\\s*=\\s*(?:"([^"]*)"|([^\\r\\n/]+))`, 'm'));
  if (!match) fail(`PDS3 label is missing ${key}`);
  return (match[1] ?? match[2]).trim();
}

function pds3Set(label, key) {
  const match = label.match(new RegExp(`(?:^|\\r?\\n)\\s*${key}\\s*=\\s*\\{([\\s\\S]*?)\\}`, 'm'));
  if (!match) fail(`PDS3 label is missing ${key}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function pds3Object(label, objectName) {
  const match = label.match(new RegExp(`OBJECT\\s*=\\s*${objectName}([\\s\\S]*?)END_OBJECT\\s*=\\s*${objectName}`, 'm'));
  if (!match) fail(`PDS3 label is missing object ${objectName}`);
  return match[1];
}

function xmlText(fragment, tag) {
  const match = fragment.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].replace(/<[^>]*>/g, '').trim() : null;
}

function xmlTables(xml) {
  return [...xml.matchAll(/<Table_Character>([\s\S]*?)<\/Table_Character>/g)].map((match) => {
    const fragment = match[1];
    const fields = new Map();
    for (const fieldMatch of fragment.matchAll(/<Field_Character>([\s\S]*?)<\/Field_Character>/g)) {
      const field = fieldMatch[1];
      const name = xmlText(field, 'name');
      const number = Number(xmlText(field, 'field_number'));
      if (name && Number.isInteger(number)) {
        fields.set(name, {
          number,
          unit: xmlText(field, 'unit'),
        });
      }
    }
    return {
      records: Number(xmlText(fragment, 'records')),
      recordBytes: Number(xmlText(fragment, 'record_length')),
      fields,
    };
  });
}

function readLines(filePath, expectedRecordBytes, expectedCount, firstLineOffset = 0) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.some((byte) => byte > 0x7f)) fail(`${path.basename(filePath)} contains non-ASCII bytes despite its PDS declaration`);
  const text = bytes.toString('ascii');
  if (text.includes('\uFFFD')) fail(`${path.basename(filePath)} is not ASCII as declared`);
  if (!text.endsWith('\r\n')) fail(`${path.basename(filePath)} does not end with the declared CRLF record delimiter`);
  const lines = text.split(/\r\n/);
  if (lines.at(-1) === '') lines.pop();
  if (lines.some((line) => line.includes('\n') || line.includes('\r'))) {
    fail(`${path.basename(filePath)} has unexpected line endings`);
  }
  if (lines.length !== expectedCount + firstLineOffset) {
    fail(`${path.basename(filePath)} has ${lines.length} physical rows; expected ${expectedCount + firstLineOffset}`);
  }
  for (const [index, line] of lines.entries()) {
    const recordBytes = Buffer.byteLength(line, 'ascii') + 2;
    if (recordBytes !== expectedRecordBytes) {
      fail(`${path.basename(filePath)} row ${index + 1} including CRLF has ${recordBytes} bytes; expected ${expectedRecordBytes}`);
    }
  }
  return { bytes, lines };
}

function verifySourceFiles(manifest) {
  for (const file of manifest.files) {
    const filePath = path.join(SOURCE_ROOT, file.name);
    const bytes = fs.readFileSync(filePath);
    const actualHash = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
    if (bytes.length !== file.bytes) fail(`${file.name} has ${bytes.length} bytes; manifest says ${file.bytes}`);
    if (actualHash !== file.sha256.toUpperCase()) fail(`${file.name} SHA-256 does not match manifest`);
  }
}

function requireField(table, fieldName, expectedUnit) {
  const field = table.fields.get(fieldName);
  if (!field) fail(`Source product label is missing field ${fieldName}`);
  if (expectedUnit && field.unit !== expectedUnit) {
    fail(`${fieldName} unit is ${field.unit}; expected ${expectedUnit}`);
  }
  return field.number - 1;
}

function selectObservations(remsLines, adrLines, manifest) {
  const sample = manifest.extraction;
  const remsFields = sample.source_modrdr_fields;
  const adrFields = sample.source_adr_geometry_fields;
  const remsIndexes = Object.fromEntries(Object.entries(remsFields).map(([name, fieldNumber]) => [name, fieldNumber - 1]));
  const adrIndexes = Object.fromEntries(Object.entries(adrFields).map(([name, fieldNumber]) => [name, fieldNumber - 1]));

  const geometryByTimestamp = new Map();
  for (const [index, line] of adrLines.entries()) {
    const fields = parseCsvRecord(line, `ADR geometry record ${index + 1}`);
    if (fields.length !== 16) fail(`ADR geometry record ${index + 1} has ${fields.length} fields; expected 16`);
    const timestamp = fields[adrIndexes.TIMESTAMP];
    if (geometryByTimestamp.has(timestamp)) fail(`ADR geometry timestamp ${timestamp} is duplicated`);
    geometryByTimestamp.set(timestamp, { fields, rowNumber: index + 1 });
  }

  if (remsLines.length === 0) fail('REMS source table contains no rows');
  const firstFields = parseCsvRecord(remsLines[0], 'MODRDR source record 1');
  if (firstFields.length !== 40) fail(`MODRDR source record 1 has ${firstFields.length} fields; expected 40`);
  const firstTimestamp = Number(firstFields[remsIndexes.TIMESTAMP]);
  if (!Number.isFinite(firstTimestamp)) fail('First MODRDR timestamp is not numeric');

  const selectedBins = new Set();
  const observations = [];
  for (const [index, line] of remsLines.entries()) {
    const sourceRowNumber = index + 1;
    const fields = parseCsvRecord(line, `MODRDR source record ${sourceRowNumber}`);
    if (fields.length !== 40) fail(`MODRDR source record ${sourceRowNumber} has ${fields.length} fields; expected 40`);

    const timestamp = fields[remsIndexes.TIMESTAMP];
    const timestampNumber = Number(timestamp);
    const ambientTemperature = fields[remsIndexes.AMBIENT_TEMP];
    const pressure = fields[remsIndexes.PRESSURE];
    const isMissing = (value) => value === '-999' || value === '-999.0' || value === '-999.00';
    if (!Number.isFinite(timestampNumber)) fail(`MODRDR source record ${sourceRowNumber} has a nonnumeric timestamp`);
    if (isMissing(ambientTemperature) || isMissing(pressure)) continue;
    if (!Number.isFinite(Number(ambientTemperature)) || !Number.isFinite(Number(pressure))) {
      fail(`MODRDR source record ${sourceRowNumber} has a non-finite pressure or ambient temperature`);
    }

    const elapsedBin = Math.floor((timestampNumber - firstTimestamp) / SAMPLE_BIN_SECONDS);
    if (selectedBins.has(elapsedBin)) continue;

    const geometry = geometryByTimestamp.get(timestamp);
    if (!geometry) fail(`No exact-timestamp ADR geometry match for MODRDR timestamp ${timestamp}`);
    const geometryFields = geometry.fields;
    const locationValues = [
      geometryFields[adrIndexes.ROVER_POSITION_X],
      geometryFields[adrIndexes.ROVER_POSITION_Y],
      geometryFields[adrIndexes.ROVER_POSITION_Z],
    ];
    if (locationValues.some((value) => !Number.isFinite(Number(value)))) {
      fail(`ADR location for MODRDR timestamp ${timestamp} is not numeric`);
    }

    observations.push({
      productId: manifest.product_id,
      releaseId: manifest.release_id,
      sol: manifest.planet_day_number,
      sourceRowNumber,
      timestamp,
      lmst: fields[remsIndexes.LMST],
      ltst: fields[remsIndexes.LTST],
      ambientTemperature,
      ambientTemperatureConfidence: fields[remsIndexes.AMBIENT_TEMP_CONFIDENCE_LEVEL],
      pressure,
      pressureAbsoluteAccuracy: fields[remsIndexes.PRESSURE_UNCERTAINTY],
      pressureConfidence: fields[remsIndexes.PS_CONFIDENCE_LEVEL],
      pressureConfiguration: fields[remsIndexes.PS_CONFIGURATION],
      sourceUrl: manifest.files.find((file) => file.name.endsWith('RMD48030000000_______P1.TAB')).url,
      locationProductId: manifest.location_product_id,
      locationSourceRowNumber: geometry.rowNumber,
      locationTimestamp: geometryFields[adrIndexes.TIMESTAMP],
      roverX: locationValues[0],
      roverY: locationValues[1],
      roverZ: locationValues[2],
      locationUrl: manifest.files.find((file) => file.name.endsWith('ADR48030000000_______P1.TAB')).url,
      elapsedBin,
    });
    selectedBins.add(elapsedBin);
  }

  return observations;
}

function rowsToCsv(observations) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const observation of observations) {
    const values = [
      observation.productId,
      observation.releaseId,
      observation.sol,
      observation.sourceRowNumber,
      observation.timestamp,
      observation.lmst,
      observation.ltst,
      observation.ambientTemperature,
      observation.ambientTemperatureConfidence,
      observation.pressure,
      observation.pressureAbsoluteAccuracy,
      observation.pressureConfidence,
      observation.pressureConfiguration,
      observation.sourceUrl,
      observation.locationProductId,
      observation.locationSourceRowNumber,
      observation.locationTimestamp,
      observation.roverX,
      observation.roverY,
      observation.roverZ,
      observation.locationUrl,
    ];
    lines.push(values.map(csvCell).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function buildObservationsCsv() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  verifySourceFiles(manifest);

  const remsLabel = fs.readFileSync(path.join(SOURCE_ROOT, 'RME_823829944RMD48030000000_______P1.LBL'), 'ascii');
  const remsXml = fs.readFileSync(path.join(SOURCE_ROOT, 'RME_823829944RMD48030000000_______P1.xml'), 'utf8');
  const adrLabel = fs.readFileSync(path.join(SOURCE_ROOT, 'RME_823829944ADR48030000000_______P1.LBL'), 'ascii');
  const adrXml = fs.readFileSync(path.join(SOURCE_ROOT, 'RME_823829944ADR48030000000_______P1.xml'), 'utf8');

  if (pds3Value(remsLabel, 'DATA_SET_ID') !== manifest.dataset_id) fail('REMS dataset ID does not match manifest');
  if (pds3Value(remsLabel, 'PRODUCT_ID') !== manifest.product_id) fail('REMS product ID does not match manifest');
  if (pds3Value(remsLabel, 'PLANET_DAY_NUMBER') !== String(manifest.planet_day_number)) fail('REMS sol does not match manifest');
  if (pds3Value(remsLabel, 'RELEASE_ID') !== manifest.release_id) fail('REMS release ID does not match manifest');
  if (pds3Value(remsLabel, 'ROWS') !== String(manifest.declared_table_records)) fail('PDS3 REMS row count does not match manifest');
  if (pds3Value(remsLabel, 'COLUMNS') !== String(manifest.declared_columns)) fail('PDS3 REMS column count does not match manifest');
  if (pds3Value(remsLabel, 'ROW_BYTES') !== String(manifest.declared_record_bytes)) fail('PDS3 REMS record length does not match manifest');
  if (pds3Value(remsLabel, 'START_TIME') !== manifest.start_time_utc.replace(/Z$/, '')) fail('REMS start UTC does not match manifest');
  if (pds3Value(remsLabel, 'STOP_TIME') !== manifest.stop_time_utc.replace(/Z$/, '')) fail('REMS stop UTC does not match manifest');
  if (JSON.stringify(pds3Set(remsLabel, 'SOURCE_PRODUCT_ID')) !== JSON.stringify(manifest.source_product_ids)) {
    fail('REMS source product IDs do not match manifest');
  }
  if (JSON.stringify(pds3Set(remsLabel, 'CALIBRATION_SOURCE_ID')) !== JSON.stringify(manifest.calibration_source_ids)) {
    fail('REMS calibration source IDs do not match manifest');
  }

  if (pds3Value(adrLabel, 'PRODUCT_ID') !== manifest.location_product_id) fail('ADR location product ID does not match manifest');
  if (pds3Value(adrLabel, 'PLANET_DAY_NUMBER') !== String(manifest.planet_day_number)) fail('ADR sol does not match manifest');
  if (pds3Value(adrLabel, 'RELEASE_ID') !== manifest.release_id) fail('ADR release ID does not match manifest');
  const adrGeometryLabel = pds3Object(adrLabel, 'REMS_ADR_GEOMETRY_TABLE');
  if (pds3Value(adrGeometryLabel, 'ROWS') !== String(manifest.declared_table_records)) fail('PDS3 ADR geometry row count does not match manifest');
  if (pds3Value(adrGeometryLabel, 'COLUMNS') !== '16') fail('PDS3 ADR geometry column count does not match manifest');
  if (pds3Value(adrGeometryLabel, 'ROW_BYTES') !== '152') fail('PDS3 ADR geometry record length does not match manifest');

  const remsTable = xmlTables(remsXml)[0];
  const adrGeometryTable = xmlTables(adrXml).find((table) => table.fields.has('ROVER_POSITION_X'));
  if (!remsTable || !adrGeometryTable) fail('PDS4 labels do not describe the expected tables');
  if (remsTable.records !== manifest.declared_table_records || remsTable.recordBytes !== manifest.declared_record_bytes) {
    fail('PDS4 REMS table dimensions do not match manifest');
  }
  if (remsTable.fields.size !== manifest.declared_columns) fail('PDS4 REMS field count does not match manifest');
  if (adrGeometryTable.records !== manifest.declared_table_records || adrGeometryTable.recordBytes !== 152) {
    fail('PDS4 ADR geometry table dimensions do not match manifest');
  }
  if (adrGeometryTable.fields.size !== 16) fail('PDS4 ADR geometry field count does not match manifest');
  requireField(remsTable, 'TIMESTAMP', 'SECOND');
  requireField(remsTable, 'AMBIENT_TEMP', 'KELVIN');
  requireField(remsTable, 'PRESSURE', 'PASCAL');
  requireField(remsTable, 'PRESSURE_UNCERTAINTY', 'PASCAL');
  requireField(adrGeometryTable, 'ROVER_POSITION_X', 'METER');
  requireField(adrGeometryTable, 'ROVER_POSITION_Y', 'METER');
  requireField(adrGeometryTable, 'ROVER_POSITION_Z', 'METER');
  for (const [fieldName, fieldNumber] of Object.entries(manifest.extraction.source_modrdr_fields)) {
    if (remsTable.fields.get(fieldName)?.number !== fieldNumber) fail(`MODRDR field mapping changed for ${fieldName}`);
  }
  for (const [fieldName, fieldNumber] of Object.entries(manifest.extraction.source_adr_geometry_fields)) {
    if (adrGeometryTable.fields.get(fieldName)?.number !== fieldNumber) fail(`ADR field mapping changed for ${fieldName}`);
  }

  const remsData = readLines(
    path.join(SOURCE_ROOT, 'RME_823829944RMD48030000000_______P1.TAB'),
    manifest.declared_record_bytes,
    manifest.declared_table_records,
  );
  const adrData = readLines(
    path.join(SOURCE_ROOT, 'RME_823829944ADR48030000000_______P1.TAB'),
    152,
    manifest.declared_table_records,
    1,
  );
  const adrGeometryLines = adrData.lines.slice(1);
  const observations = selectObservations(remsData.lines, adrGeometryLines, manifest);
  if (observations.length !== manifest.extraction.generated_row_count) {
    fail(`Generated ${observations.length} observations; manifest expects ${manifest.extraction.generated_row_count}`);
  }
  return rowsToCsv(observations);
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const generated = buildObservationsCsv();
  if (checkOnly) {
    if (!fs.existsSync(OUTPUT_PATH)) fail('Expected extracted CSV is missing; run without --check to generate it');
    const existing = fs.readFileSync(OUTPUT_PATH, 'utf8');
    if (existing !== generated) fail('Extracted CSV differs from the reproducible source selection');
    console.log(`PASS: ${CSV_COLUMNS.length} columns, ${generated.trimEnd().split('\n').length - 1} observations; source hashes and field values verified`);
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, generated, 'utf8');
  console.log(`Wrote ${generated.trimEnd().split('\n').length - 1} observations to ${path.relative(REPOSITORY_ROOT, OUTPUT_PATH)}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`REMS extraction failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  CSV_COLUMNS,
  OUTPUT_PATH,
  buildObservationsCsv,
  parseCsvRecord,
  selectObservations,
};
