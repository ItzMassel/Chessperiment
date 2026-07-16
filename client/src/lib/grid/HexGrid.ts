import { GridType, Coordinate, Pixel } from './GridType';

/**
 * Axial Coordinates (q, r)
 * For a pointy-topped hex grid:
 * x = size * sqrt(3) * (q + r/2)
 * y = size * 3/2 * r
 */
export class HexGrid implements GridType {
  id: 'hex' = 'hex';

  coordToString(coord: Coordinate): string {
    return `${coord.q},${coord.r}`;
  }

  stringToCoord(str: string): Coordinate {
    const [q, r] = str.split(',').map(Number);
    return { q, r };
  }

  getNeighbors(coord: Coordinate): Coordinate[] {
    const { q, r } = coord;
    return [
      { q: q + 1, r: r }, { q: q + 1, r: r - 1 }, { q: q, r: r - 1 },
      { q: q - 1, r: r }, { q: q - 1, r: r + 1 }, { q: q, r: r + 1 }
    ];
  }

  getPixelPosition(coord: Coordinate, tileSize: number): Pixel {
    // Pointy-topped hexes
    // Spacing based on div width (tileSize) and div height (tileSize)
    const x = tileSize * (coord.q + coord.r / 2);
    const y = tileSize * 0.75 * coord.r;
    return { x, y };
  }

  getSymmetryPoints(coord: Coordinate, symmetry: 'none' | 'horizontal' | 'vertical' | 'rotational', bounds: { rows: number; cols: number }): Coordinate[] {
    const { q, r } = coord;
    // Axial symmetry is trickier. 
    // In axial space (q, r, s) where q+r+s=0:
    const s = -q - r;

    const points: Coordinate[] = [];
    if (symmetry === 'horizontal') {
      // Reflection over vertical axis (q=0) -> q becomes -q, r becomes r+q, s becomes s+q? 
      // Actually simpler in Cube coords: (q, r, s) -> (-q, -s, -r) for horizontal reflection?
      // Standard axial horizontal reflection (flip q): q' = -q - r, r' = r
      // Wait, let's use standard hex axial reflections:
      // Vertical flip: q' = q, r' = -r - q
      // Horizontal flip: q' = -q - r, r' = r
      points.push({ q: -q - r, r: r });
    } else if (symmetry === 'vertical') {
      points.push({ q: q, r: -r - q });
    } else if (symmetry === 'rotational') {
      // 180 degree rotation: q' = -q, r' = -r
      points.push({ q: -q, r: -r });
    }
    return points;
  }

  generateInitialGrid(rows: number, cols: number): Coordinate[] {
    // Independent radii: cols controls horizontal (q), rows controls vertical (r)
    const qRadius = Math.floor(cols / 2);
    const rRadius = Math.floor(rows / 2);
    // s constraint uses the larger radius so the shape stays connected
    const sRadius = Math.max(qRadius, rRadius);
    const grid: Coordinate[] = [];
    for (let q = -qRadius; q <= qRadius; q++) {
      const r1 = Math.max(-rRadius, -q - sRadius);
      const r2 = Math.min(rRadius, -q + sRadius);
      for (let r = r1; r <= r2; r++) {
        grid.push({ q, r });
      }
    }
    return grid;
  }

  getTileShape(): string {
    return 'hex';
  }
}
