export interface Point {
  x: number;
  y: number;
}

export class Pathfinding {
  /**
   * Simple A* implementation
   */
  static findPath(grid: number[][], startPoint: Point, endPoint: Point): Point[] {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    // Ensure start/end are ints
    const start = { x: Math.floor(startPoint.x), y: Math.floor(startPoint.y) };
    const end = { x: Math.floor(endPoint.x), y: Math.floor(endPoint.y) };

    const isValidForPath = (x: number, y: number) => {
      if (x === end.x && y === end.y) {
        return x >= 0 && x < cols && y >= 0 && y < rows;
      }
      return x >= 0 && x < cols && y >= 0 && y < rows && grid[y][x] === 0;
    };

    if (start.x === end.x && start.y === end.y) return [end];

    // Priority queue simplified
    const openSet: { p: Point; f: number; g: number; h: number; parent: Point | null }[] = [];
    const closedSet: Set<string> = new Set();
    
    // Heuristic: Manhattan distance
    const h = (p: Point) => Math.abs(p.x - end.x) + Math.abs(p.y - end.y);
    
    openSet.push({ p: start, f: h(start), g: 0, h: h(start), parent: null });
    
    // Map to reconstruct path
    const cameFrom = new Map<string, Point | null>();
    cameFrom.set(`${start.x},${start.y}`, null);

    while (openSet.length > 0) {
      // Sort to get lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const curKey = `${current.p.x},${current.p.y}`;

      if (current.p.x === end.x && current.p.y === end.y) {
        // Reconstruct path
        const path: Point[] = [];
        let curr: Point | null | undefined = current.p;
        while (curr) {
          path.push(curr);
          curr = cameFrom.get(`${curr.x},${curr.y}`);
        }
        return path.reverse();
      }

      closedSet.add(curKey);

      const neighbors = [
        { x: current.p.x, y: current.p.y - 1 }, // up
        { x: current.p.x, y: current.p.y + 1 }, // down
        { x: current.p.x - 1, y: current.p.y }, // left
        { x: current.p.x + 1, y: current.p.y }, // right
      ];

      for (const next of neighbors) {
        const nextKey = `${next.x},${next.y}`;
        if (!isValidForPath(next.x, next.y) || closedSet.has(nextKey)) continue;

        const tentativeG = current.g + 1;
        const existingNode = openSet.find((node) => node.p.x === next.x && node.p.y === next.y);

        if (!existingNode || tentativeG < existingNode.g) {
          cameFrom.set(nextKey, current.p);
          const nextH = h(next);
          const newNode = { p: next, g: tentativeG, h: nextH, f: tentativeG + nextH, parent: current.p };
          
          if (existingNode) {
            existingNode.g = newNode.g;
            existingNode.f = newNode.f;
            existingNode.parent = newNode.parent;
          } else {
            openSet.push(newNode);
          }
        }
      }
    }

    return []; // No path found
  }
}
