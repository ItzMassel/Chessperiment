import { GridType, Coordinate, Pixel } from './GridType';

export class SquareGrid implements GridType {
  id: 'square' = 'square';

  coordToString(coord: Coordinate): string {
    return `${coord.x},${coord.y}`;
  }

  stringToCoord(str: string): Coordinate {
    const [x, y] = str.split(',').map(Number);
    return { x, y };
  }

  getNeighbors(coord: Coordinate): Coordinate[] {
    const { x, y } = coord;
    return [
      { x: x + 1, y }, { x: x - 1, y },
      { x, y: y + 1 }, { x, y: y - 1 },
      { x: x + 1, y: y + 1 }, { x: x - 1, y: y - 1 },
      { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }
    ];
  }

  getPixelPosition(coord: Coordinate, tileSize: number): Pixel {
    return {
      x: coord.x * tileSize + tileSize / 2,
      y: coord.y * tileSize + tileSize / 2
    };
  }

  getSymmetryPoints(coord: Coordinate, symmetry: 'none' | 'horizontal' | 'vertical' | 'rotational', bounds: { rows: number; cols: number }): Coordinate[] {
    const { x, y } = coord;
    const points: Coordinate[] = [];
    if (symmetry === 'horizontal') {
      points.push({ x: bounds.cols - 1 - x, y });
    } else if (symmetry === 'vertical') {
      points.push({ x, y: bounds.rows - 1 - y });
    } else if (symmetry === 'rotational') {
      points.push({ x: bounds.cols - 1 - x, y: bounds.rows - 1 - y });
    }
    return points;
  }

  generateInitialGrid(rows: number, cols: number): Coordinate[] {
    const grid: Coordinate[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        grid.push({ x, y });
      }
    }
    return grid;
  }

  getTileShape(): string {
    return 'square';
  }
}
