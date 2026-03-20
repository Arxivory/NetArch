export const UnitManager = {
  mmToMeters: (mm) => mm / 1000,
  metersToMm: (meters) => Math.round(meters * 1000),
  feetAndInchesToMeters: (feet, inches) => ((Number(feet) * 12) + Number(inches)) * 0.0254,
  metersToFeetAndInches: (meters) => {
    const totalInches = meters / 0.0254;
    return {
      feet: Math.floor(totalInches / 12),
      inches: Math.round(totalInches % 12),
      display: `${Math.floor(totalInches / 12)}' ${Math.round(totalInches % 12)}"`
    };
  }
};