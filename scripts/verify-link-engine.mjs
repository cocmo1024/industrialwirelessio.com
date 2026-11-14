/**
 * Engine verification for the link budget / Fresnel calculators.
 *
 * The expected values below were computed INDEPENDENTLY of the
 * engine (hand arithmetic from the textbook formulas, cross-checked
 * with a separate Python implementation) before the engine was
 * written. This script is the record that engine output matches
 * them. Run: node scripts/verify-link-engine.mjs
 * (Node ≥ 23 imports the TypeScript engine via type stripping.)
 */
import {
	computeFresnel,
	computeLinkBudget,
	freeSpacePathLossDb,
	fresnelRadiusM,
} from '../src/utils/link-engine.ts';

let failures = 0;
function close(name, actual, expected, tol = 0.011) {
	const ok = Number.isFinite(actual) && Math.abs(actual - expected) <= tol;
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: engine=${actual} expected≈${expected}`);
	if (!ok) failures += 1;
}
function throws(name, fn) {
	try {
		fn();
		console.log(`FAIL  ${name}: expected a RangeError, got a result`);
		failures += 1;
	} catch (error) {
		const ok = error instanceof RangeError;
		console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: threw ${error.constructor.name}`);
		if (!ok) failures += 1;
	}
}

/* --- Free-space path loss: FSPL = 20log10(d_km) + 20log10(f_MHz) + 32.44 --- */
close('FSPL 1 km / 915 MHz', freeSpacePathLossDb(1, 915), 91.67);
close('FSPL 10 km / 2400 MHz', freeSpacePathLossDb(10, 2400), 120.04);
close('FSPL 100 m / 868 MHz', freeSpacePathLossDb(0.1, 868), 71.21);
close('FSPL 2 km / 868 MHz', freeSpacePathLossDb(2, 868), 97.23);
close('FSPL 5 km / 868 MHz', freeSpacePathLossDb(5, 868), 105.19);

/* --- Full budget: 14 dBm, +3/+3 dBi, 1 dB cable each end, 5 km, 868 MHz, −120 dBm --- */
const budget = computeLinkBudget({
	frequencyMhz: 868,
	distanceKm: 5,
	model: 'free-space',
	txPowerDbm: 14,
	txAntennaGainDbi: 3,
	rxAntennaGainDbi: 3,
	txCableLossDb: 1,
	rxCableLossDb: 1,
	rxSensitivityDbm: -120,
});
close('budget path loss', budget.pathLossDb, 105.19);
close('budget received power', budget.receivedPowerDbm, -87.19);
close('budget link margin', budget.linkMarginDb, 32.81);
console.log(
	`${budget.verdict.band === 'comfortable' ? 'PASS' : 'FAIL'}  verdict band for +32.81 dB margin: ${budget.verdict.band}`,
);
if (budget.verdict.band !== 'comfortable') failures += 1;

/* --- Worked-example figures used on the link budget page (LoRaWAN uplink) --- */
const example = computeLinkBudget({
	frequencyMhz: 868,
	distanceKm: 2,
	model: 'free-space',
	txPowerDbm: 14,
	txAntennaGainDbi: 2,
	rxAntennaGainDbi: 3,
	txCableLossDb: 0.5,
	rxCableLossDb: 0.5,
	rxSensitivityDbm: -140,
});
close('example path loss', example.pathLossDb, 97.23);
close('example received power', example.receivedPowerDbm, -79.23);
close('example link margin', example.linkMarginDb, 60.77);

/* --- Log-distance model: n = 3, 2 km, 2400 MHz, anchored at FSPL(1 km) --- */
const logDist = computeLinkBudget({
	frequencyMhz: 2400,
	distanceKm: 2,
	model: 'log-distance',
	pathLossExponent: 3,
	txPowerDbm: 10,
	txAntennaGainDbi: 0,
	rxAntennaGainDbi: 0,
	txCableLossDb: 0,
	rxCableLossDb: 0,
	rxSensitivityDbm: -95,
});
close('log-distance path loss', logDist.pathLossDb, 109.08);
close('log-distance received power', logDist.receivedPowerDbm, -99.08);

/* --- Allowance handling: margin after allowance drives the verdict --- */
const allowed = computeLinkBudget({
	frequencyMhz: 868,
	distanceKm: 5,
	model: 'free-space',
	txPowerDbm: 14,
	txAntennaGainDbi: 3,
	rxAntennaGainDbi: 3,
	txCableLossDb: 1,
	rxCableLossDb: 1,
	rxSensitivityDbm: -120,
	fadeMarginAllowanceDb: 25,
});
close('margin after 25 dB allowance', allowed.marginAfterAllowanceDb, 7.81);
console.log(
	`${allowed.verdict.band === 'closes-on-paper' ? 'PASS' : 'FAIL'}  verdict band after allowance: ${allowed.verdict.band}`,
);
if (allowed.verdict.band !== 'closes-on-paper') failures += 1;

/* --- Fresnel: r = sqrt(λ·d1·d2/(d1+d2)) --- */
close('Fresnel midpoint 1 km / 2400 MHz', fresnelRadiusM(2400, 500, 500), 5.59, 0.01);
close('Fresnel midpoint 5 km / 915 MHz', fresnelRadiusM(915, 2500, 2500), 20.24, 0.01);
close('Fresnel 2 km / 5800 MHz at 500 m', fresnelRadiusM(5800, 500, 1500), 4.4, 0.01);
const fresnelExample = computeFresnel({
	frequencyMhz: 915,
	pathLengthM: 5000,
	obstacleFromAM: 1500,
	clearanceM: 12,
});
close('Fresnel example radius at obstacle', fresnelExample.radiusAtObstacleM, 18.55, 0.01);
close('Fresnel example radius at midpoint', fresnelExample.radiusAtMidpointM, 20.24, 0.01);
close('Fresnel example 60% clearance target', fresnelExample.clearance60AtObstacleM, 11.13, 0.01);
close('Fresnel example clearance ratio', fresnelExample.clearanceRatioPct, 64.71, 0.05);
console.log(
	`${fresnelExample.verdict?.band === 'convention-met' ? 'PASS' : 'FAIL'}  Fresnel verdict at 64.7%: ${fresnelExample.verdict?.band}`,
);
if (fresnelExample.verdict?.band !== 'convention-met') failures += 1;

/* --- Edge cases: no NaN, no silent nonsense --- */
throws('zero distance rejected', () =>
	computeLinkBudget({
		frequencyMhz: 868,
		distanceKm: 0,
		model: 'free-space',
		txPowerDbm: 14,
		txAntennaGainDbi: 0,
		rxAntennaGainDbi: 0,
		txCableLossDb: 0,
		rxCableLossDb: 0,
		rxSensitivityDbm: -120,
	}),
);
throws('negative distance rejected', () => freeSpacePathLossDb(-2, 868));
throws('NaN frequency rejected', () => freeSpacePathLossDb(1, Number.NaN));
throws('log-distance without exponent rejected', () =>
	computeLinkBudget({
		frequencyMhz: 2400,
		distanceKm: 2,
		model: 'log-distance',
		txPowerDbm: 10,
		txAntennaGainDbi: 0,
		rxAntennaGainDbi: 0,
		txCableLossDb: 0,
		rxCableLossDb: 0,
		rxSensitivityDbm: -95,
	}),
);
throws('negative cable loss rejected', () =>
	computeLinkBudget({
		frequencyMhz: 868,
		distanceKm: 1,
		model: 'free-space',
		txPowerDbm: 14,
		txAntennaGainDbi: 0,
		rxAntennaGainDbi: 0,
		txCableLossDb: -1,
		rxCableLossDb: 0,
		rxSensitivityDbm: -120,
	}),
);
throws('obstacle at path end rejected', () =>
	computeFresnel({ frequencyMhz: 915, pathLengthM: 5000, obstacleFromAM: 5000 }),
);
throws('zero-length Fresnel path rejected', () =>
	computeFresnel({ frequencyMhz: 915, pathLengthM: 0 }),
);

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
