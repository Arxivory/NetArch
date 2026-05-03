const IPV4_BITS = 32;

function ipToInt(ipAddress) {
	if (typeof ipAddress !== 'string') {
		throw new TypeError('IPv4 address must be a string.');
	}

	const octets = ipAddress.trim().split('.').map(Number);
	if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
		throw new Error(`Invalid IPv4 address: ${ipAddress}`);
	}

	return ((octets[0] << 24) >>> 0) + ((octets[1] << 16) >>> 0) + ((octets[2] << 8) >>> 0) + (octets[3] >>> 0);
}

function intToIp(value) {
	return [
		(value >>> 24) & 255,
		(value >>> 16) & 255,
		(value >>> 8) & 255,
		value & 255,
	].join('.');
}

function maskFromPrefixLength(prefixLength) {
	if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > IPV4_BITS) {
		throw new RangeError(`Invalid prefix length: ${prefixLength}`);
	}

	if (prefixLength === 0) {
		return 0;
	}

	return (0xffffffff << (IPV4_BITS - prefixLength)) >>> 0;
}

function prefixLengthFromMask(subnetMask) {
	const maskInt = ipToInt(subnetMask);
	let prefixLength = 0;
	let seenZero = false;

	for (let bit = 31; bit >= 0; bit -= 1) {
		const isSet = (maskInt & (1 << bit)) !== 0;
		if (isSet) {
			if (seenZero) {
				throw new Error(`Subnet mask must be contiguous: ${subnetMask}`);
			}
			prefixLength += 1;
		} else {
			seenZero = true;
		}
	}

	return prefixLength;
}

function normalizePrefixLength({ prefixLength, subnetMask }) {
	if (prefixLength !== undefined && prefixLength !== null) {
		return prefixLength;
	}

	if (subnetMask) {
		return prefixLengthFromMask(subnetMask);
	}

	throw new Error('A route requires either prefixLength or subnetMask.');
}

function normalizeNetwork(destination, prefixLength, subnetMask) {
	const prefix = normalizePrefixLength({ prefixLength, subnetMask });
	const networkInt = ipToInt(destination) & maskFromPrefixLength(prefix);

	return {
		network: intToIp(networkInt),
		networkInt,
		prefixLength: prefix,
		subnetMask: intToIp(maskFromPrefixLength(prefix)),
	};
}

export default class StaticRouting {
	constructor({ owner = null } = {}) {
		this.owner = owner;
		this.routes = [];
	}

	addRoute(routeConfig) {
		const {
			destination,
			prefixLength,
			subnetMask,
			nextHop = null,
			outgoingInterface = null,
			metric = 1,
			administrativeDistance = 1,
			description = '',
			enabled = true,
		} = routeConfig || {};

		if (!destination) {
			throw new Error('Static route requires a destination network.');
		}

		const normalized = normalizeNetwork(destination, prefixLength, subnetMask);
		const route = {
			id: routeConfig.id || `static-route-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
			destination: normalized.network,
			prefixLength: normalized.prefixLength,
			subnetMask: normalized.subnetMask,
			networkInt: normalized.networkInt,
			nextHop,
			outgoingInterface,
			metric,
			administrativeDistance,
			description,
			enabled,
			createdAt: routeConfig.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		this.routes.push(route);
		this.routes.sort((left, right) => {
			if (right.prefixLength !== left.prefixLength) {
				return right.prefixLength - left.prefixLength;
			}
			if (left.administrativeDistance !== right.administrativeDistance) {
				return left.administrativeDistance - right.administrativeDistance;
			}
			return left.metric - right.metric;
		});

		return route;
	}

	removeRoute(routeId) {
		const initialLength = this.routes.length;
		this.routes = this.routes.filter(route => route.id !== routeId);
		return this.routes.length !== initialLength;
	}

	clearRoutes() {
		this.routes = [];
	}

	getRoutes() {
		return [...this.routes];
	}

	findBestRoute(destinationIp) {
		const destinationInt = ipToInt(destinationIp);

		return this.routes.find((route) => {
			if (!route.enabled) return false;
			const mask = maskFromPrefixLength(route.prefixLength);
			return (destinationInt & mask) === route.networkInt;
		}) || null;
	}

	resolve(destinationIp) {
		const route = this.findBestRoute(destinationIp);
		if (!route) return null;

		return {
			destination: destinationIp,
			routeId: route.id,
			destinationNetwork: `${route.destination}/${route.prefixLength}`,
			nextHop: route.nextHop,
			outgoingInterface: route.outgoingInterface,
			metric: route.metric,
			administrativeDistance: route.administrativeDistance,
			description: route.description,
		};
	}

	configure(routes = []) {
		this.clearRoutes();
		for (const route of routes) {
			this.addRoute(route);
		}
		return this.getRoutes();
	}

	toJSON() {
		return {
			routes: this.getRoutes(),
		};
	}
}

export { ipToInt, intToIp, maskFromPrefixLength, prefixLengthFromMask };
