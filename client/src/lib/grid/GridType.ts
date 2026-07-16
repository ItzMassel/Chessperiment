export type Coordinate = Record<string, number>;
export interface Pixel { x: number; y: number; }

export interface GridType {
  id: 'square' | 'hex';
  
  // Coordinate transformations
  coordToString(coord: Coordinate): string;
  stringToCoord(str: string): Coordinate;
  
  // Geometry
  getNeighbors(coord: Coordinate): Coordinate[];
  getPixelPosition(coord: Coordinate, tileSize: number): Pixel;
  getSymmetryPoints(coord: Coordinate, symmetry: 'none' | 'horizontal' | 'vertical' | 'rotational', bounds: { rows: number; cols: number }): Coordinate[];
  
  // Grid generation
  generateInitialGrid(rows: number, cols: number): Coordinate[];
  
  // Rendering helpers
  getTileShape(tileSize: number): string; // 'square' | 'hex' or path data
}
