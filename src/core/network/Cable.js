export function Cable(typeId, source, target) {
  const catalogEntry = cables[typeId];
  if (!catalogEntry) {
    throw new Error(`Unknown cable type: ${typeId}`);
  }

  return {
    id: `link_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`,
    type: typeId,
    source: {
      deviceId: source.deviceId,
      interfaceName: source.interfaceName
    },
    target: {
      deviceId: target.deviceId,
      interfaceName: target.interfaceName
    },
    status: "up",
    // Inherit properties from catalog for easy access during rendering
    visual: catalogEntry.visual,
    metrics: {
      currentThroughput: 0,
      latency: 0.1 // ms
    }
  };
}