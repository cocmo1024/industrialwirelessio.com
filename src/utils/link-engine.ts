/**
 * Link engineering engine — ONE engine for the link budget and
 * Fresnel zone calculators (blueprint §4.5 tool discipline, R2:
 * one concept, one entry). The full tool pages and the mini embeds
 * on protocol pages import this same module in the browser; the
 * worked examples on the tool pages are computed with it at build
 * time. There is no second implementation anywhere.
 *
 * Formulas — the same statements printed on the tool pages:
 *
 *  Free-space path loss (ITU-R P.525 free-space attenuation, in the
 *  km/MHz unit system used by every input on these pages):
 *      FSPL(dB) = 20·log10(d in km) + 20·log10(f in MHz) + 32.44
 *  The constant is not empirical: 20·log10(4π/c) with c =
 *  299,792,458 m/s (exact, SI) evaluates to 32.4478… in this unit
 *  system and is stated as 32.44. Using the unrounded constant
 *  changes any result on these pages by less than 0.01 dB.
 *
 *  Log-distance path loss (the tool's stated convention):
 *      PL(dB) = FSPL at 1 km + 10·n·log10(d / 1 km)
 *  anchored to the free-space loss at 1 km, so the two models agree
 *  at 1 km for any exponent n.
 *
 *  Received power and link margin:
 *      Prx(dBm) = Ptx + Gtx + Grx − Ltx − Lrx − PL
 *      Margin(dB) = Prx − receiver sensitivity
 *
 *  First Fresnel zone radius (geometry per ITU-R P.526):
 *      r(m) = sqrt( λ · d1 · d2 / (d1 + d2) ),  λ = c / f
 *  with d1/d2 the distances from the obstacle point to each end.
 *
 * Verification: scripts/verify-link-engine.mjs checks this module
 * against independently hand-computed reference cases.
 */

export const SPEED_OF_LIGHT_MPS = 299_792_458;
export const FSPL_CONSTANT_DB = 32.44;

function requirePositiveFinite(name: string, value: number): void {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new RangeError(`${name} must be a finite number`);
	}
	if (value <= 0) {
		throw new RangeError(`${name} must be greater than zero`);
	}
}

function requireFinite(name: string, value: number): void {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new RangeError(`${name} must be a finite number`);
	}
}

/** Free-space path loss in dB. Distance in km, frequency in MHz. */
export function freeSpacePathLossDb(distanceKm: number, frequencyMhz: number): number {
	requirePositiveFinite('distance', distanceKm);
	requirePositiveFinite('frequency', frequencyMhz);
	return 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMhz) + FSPL_CONSTANT_DB;
}

export type PathLossModel = 'free-space' | 'log-distance';

export interface LinkBudgetInput {
	frequencyMhz: number;
	distanceKm: number;
	model: PathLossModel;
	/** Required when model is 'log-distance'; ignored otherwise. */
	pathLossExponent?: number;
	txPowerDbm: number;
	txAntennaGainDbi: number;
	rxAntennaGainDbi: number;
	txCableLossDb: number;
	rxCableLossDb: number;
	rxSensitivityDbm: number;
	/** Optional planning allowance, subtracted from the raw margin. */
	fadeMarginAllowanceDb?: number;
}

export interface LinkMarginVerdict {
	band: 'does-not-close' | 'closes-on-paper' | 'workable' | 'comfortable';
	/** Site state token (R5): colour appears only because it names a state. */
	state: 'err' | 'warn' | 'ok';
	label: string;
	detail: string;
}

/**
 * Plain-language reading of a link margin. These bands are field
 * rules of thumb for fixed links — no standard sets them, and the
 * tool page says so. They judge the margin AFTER any fade-margin
 * allowance the user chose to subtract.
 */
export function linkMarginVerdict(marginDb: number): LinkMarginVerdict {
	requireFinite('link margin', marginDb);
	if (marginDb < 0) {
		return {
			band: 'does-not-close',
			state: 'err',
			label: 'Does not close',
			detail:
				'The received power lands below the receiver sensitivity: on these figures the receiver cannot decode the signal at all. More antenna gain, a shorter or clearer path, or a more sensitive receiver class is needed — not more optimism.',
		};
	}
	if (marginDb < 10) {
		return {
			band: 'closes-on-paper',
			state: 'warn',
			label: 'Closes on paper only',
			detail:
				'The arithmetic closes, but with under 10 dB in hand there is almost no room for rain and wet foliage, antenna misalignment, or a path that grows obstructions over time. Fixed industrial links are rarely signed off in this band.',
		};
	}
	if (marginDb < 20) {
		return {
			band: 'workable',
			state: 'ok',
			label: 'Workable planning territory',
			detail:
				'Between 10 and 20 dB is where many fixed industrial links are planned. Whether it is enough for a given site depends on how critical the data is and how hostile the path is — that judgement belongs to the site survey, not to this calculator.',
		};
	}
	return {
		band: 'comfortable',
		state: 'ok',
		label: 'Comfortable headroom',
		detail:
			'Above 20 dB the link can absorb substantial fading — weather, misalignment, new obstructions — and still close. Headroom this large is also a prompt to check the inputs: an unrealistic antenna gain or an obstructed path entered as free space inflates it.',
	};
}

export interface LinkBudgetResult {
	pathLossDb: number;
	receivedPowerDbm: number;
	linkMarginDb: number;
	/** Margin after the fade-margin allowance (equals linkMarginDb when none given). */
	marginAfterAllowanceDb: number;
	verdict: LinkMarginVerdict;
}

export function computeLinkBudget(input: LinkBudgetInput): LinkBudgetResult {
	requirePositiveFinite('frequency', input.frequencyMhz);
	requirePositiveFinite('distance', input.distanceKm);
	requireFinite('transmit power', input.txPowerDbm);
	requireFinite('transmit antenna gain', input.txAntennaGainDbi);
	requireFinite('receive antenna gain', input.rxAntennaGainDbi);
	requireFinite('transmit cable loss', input.txCableLossDb);
	requireFinite('receive cable loss', input.rxCableLossDb);
	requireFinite('receiver sensitivity', input.rxSensitivityDbm);
	if (input.txCableLossDb < 0 || input.rxCableLossDb < 0) {
		throw new RangeError('cable losses cannot be negative');
	}
	const allowance = input.fadeMarginAllowanceDb ?? 0;
	requireFinite('fade margin allowance', allowance);
	if (allowance < 0) {
		throw new RangeError('fade margin allowance cannot be negative');
	}

	let pathLossDb: number;
	if (input.model === 'log-distance') {
		const n = input.pathLossExponent;
		if (n === undefined) {
			throw new RangeError('the log-distance model needs a path-loss exponent');
		}
		requireFinite('path-loss exponent', n);
		if (n < 1 || n > 10) {
			throw new RangeError('path-loss exponent must lie between 1 and 10');
		}
		pathLossDb =
			freeSpacePathLossDb(1, input.frequencyMhz) + 10 * n * Math.log10(input.distanceKm);
	} else {
		pathLossDb = freeSpacePathLossDb(input.distanceKm, input.frequencyMhz);
	}

	const receivedPowerDbm =
		input.txPowerDbm +
		input.txAntennaGainDbi +
		input.rxAntennaGainDbi -
		input.txCableLossDb -
		input.rxCableLossDb -
		pathLossDb;
	const linkMarginDb = receivedPowerDbm - input.rxSensitivityDbm;
	const marginAfterAllowanceDb = linkMarginDb - allowance;
	return {
		pathLossDb,
		receivedPowerDbm,
		linkMarginDb,
		marginAfterAllowanceDb,
		verdict: linkMarginVerdict(marginAfterAllowanceDb),
	};
}

/** Wavelength in metres for a frequency in MHz. */
export function wavelengthM(frequencyMhz: number): number {
	requirePositiveFinite('frequency', frequencyMhz);
	return SPEED_OF_LIGHT_MPS / (frequencyMhz * 1e6);
}

/**
 * Radius of the first Fresnel zone, in metres, at a point d1 metres
 * from one end of a path and d2 metres from the other.
 */
export function fresnelRadiusM(frequencyMhz: number, d1M: number, d2M: number): number {
	requirePositiveFinite('distance from first end', d1M);
	requirePositiveFinite('distance from second end', d2M);
	return Math.sqrt((wavelengthM(frequencyMhz) * d1M * d2M) / (d1M + d2M));
}

export interface FresnelInput {
	frequencyMhz: number;
	pathLengthM: number;
	/** Distance of the obstacle point from end A, in metres. Defaults to the midpoint. */
	obstacleFromAM?: number;
	/** Height of the line of sight above the obstacle top, in metres (may be negative). */
	clearanceM?: number;
}

export interface FresnelClearanceVerdict {
	band: 'blocked' | 'deep-inside' | 'partial' | 'convention-met' | 'fully-clear';
	state: 'err' | 'warn' | 'ok';
	label: string;
	detail: string;
}

/**
 * Reading of a clearance ratio against the 60% planning convention.
 * The 60% figure is an engineering convention from vendor link-
 * planning practice, cross-checked against the ITU-R P.526
 * diffraction model — not a limit set by any standard. The tool
 * page states this nature explicitly.
 */
export function fresnelClearanceVerdict(clearanceRatioPct: number): FresnelClearanceVerdict {
	requireFinite('clearance ratio', clearanceRatioPct);
	if (clearanceRatioPct < 0) {
		return {
			band: 'blocked',
			state: 'err',
			label: 'Sight line blocked',
			detail:
				'The obstacle rises above the line of sight itself. No margin figure rescues this geometry: raise an antenna, move an antenna, or relay the path around the obstacle.',
		};
	}
	if (clearanceRatioPct < 30) {
		return {
			band: 'deep-inside',
			state: 'err',
			label: 'Deep inside the first zone',
			detail:
				'Under 30% of the first zone is clear. Diffraction loss at this depth is heavy and weather-sensitive — the P.526 diffraction model already puts the loss at roughly 6 dB when an obstacle merely grazes the sight line (0% clearance), and it grows from there.',
		};
	}
	if (clearanceRatioPct < 60) {
		return {
			band: 'partial',
			state: 'warn',
			label: 'Partially obstructed',
			detail:
				'Between 30% and 60% clear, the link usually works but carries extra diffraction loss that belongs in the link budget as lost decibels. It falls short of the 60% clearance that link-planning practice aims for.',
		};
	}
	if (clearanceRatioPct < 100) {
		return {
			band: 'convention-met',
			state: 'ok',
			label: 'Meets the 60% planning convention',
			detail:
				'At 60% or more of the first zone clear, diffraction loss is small enough that planning practice treats the path as unobstructed. This is a convention, not a guarantee — verify the path again when structures or vegetation change.',
		};
	}
	return {
		band: 'fully-clear',
		state: 'ok',
		label: 'First zone fully clear',
		detail:
			'The whole first Fresnel zone is clear of the obstacle at this point. Remaining path risks are atmospheric and mechanical, not diffraction from this obstacle.',
	};
}

export interface FresnelResult {
	wavelengthM: number;
	radiusAtObstacleM: number;
	radiusAtMidpointM: number;
	/** Radius × 0.60 at the obstacle point — the convention's target clearance. */
	clearance60AtObstacleM: number;
	/** Present only when a clearance height was entered. */
	clearanceRatioPct?: number;
	verdict?: FresnelClearanceVerdict;
}

export function computeFresnel(input: FresnelInput): FresnelResult {
	requirePositiveFinite('frequency', input.frequencyMhz);
	requirePositiveFinite('path length', input.pathLengthM);
	const total = input.pathLengthM;
	const d1 = input.obstacleFromAM ?? total / 2;
	requirePositiveFinite('obstacle distance from end A', d1);
	if (d1 >= total) {
		throw new RangeError('obstacle point must lie between the two ends of the path');
	}
	const d2 = total - d1;
	const radiusAtObstacleM = fresnelRadiusM(input.frequencyMhz, d1, d2);
	const radiusAtMidpointM = fresnelRadiusM(input.frequencyMhz, total / 2, total / 2);
	const result: FresnelResult = {
		wavelengthM: wavelengthM(input.frequencyMhz),
		radiusAtObstacleM,
		radiusAtMidpointM,
		clearance60AtObstacleM: 0.6 * radiusAtObstacleM,
	};
	if (input.clearanceM !== undefined) {
		requireFinite('clearance height', input.clearanceM);
		result.clearanceRatioPct = (input.clearanceM / radiusAtObstacleM) * 100;
		result.verdict = fresnelClearanceVerdict(result.clearanceRatioPct);
	}
	return result;
}

/** Display formatting (R8): dB readings to 2 decimals, always signed where signed. */
export function fmtDb(value: number, digits = 2): string {
	return value.toFixed(digits);
}

export function fmtSignedDb(value: number, digits = 2): string {
	return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

export function fmtM(value: number, digits = 2): string {
	return value.toFixed(digits);
}
