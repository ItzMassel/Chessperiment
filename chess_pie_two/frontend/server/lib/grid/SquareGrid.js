export class SquareGrid {
    constructor() {
        this.id = 'square';
    }
    coordToString(coord) {
        return `${coord.x},${coord.y}`;
    }
    stringToCoord(str) {
        const [x, y] = str.split(',').map(Number);
        return { x, y };
    }
    getNeighbors(coord) {
        const { x, y } = coord;
        return [
            { x: x + 1, y }, { x: x - 1, y },
            { x, y: y + 1 }, { x, y: y - 1 },
            { x: x + 1, y: y + 1 }, { x: x - 1, y: y - 1 },
            { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }
        ];
    }
    getPixelPosition(coord, tileSize) {
        return {
            x: coord.x * tileSize + tileSize / 2,
            y: coord.y * tileSize + tileSize / 2
        };
    }
    getSymmetryPoints(coord, symmetry, bounds) {
        const { x, y } = coord;
        const points = [];
        if (symmetry === 'horizontal') {
            points.push({ x: bounds.cols - 1 - x, y });
        }
        else if (symmetry === 'vertical') {
            points.push({ x, y: bounds.rows - 1 - y });
        }
        else if (symmetry === 'rotational') {
            points.push({ x: bounds.cols - 1 - x, y: bounds.rows - 1 - y });
        }
        return points;
    }
    generateInitialGrid(rows, cols) {
        const grid = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                grid.push({ x, y });
            }
        }
        return grid;
    }
    getTileShape() {
        return 'square';
    }
}
