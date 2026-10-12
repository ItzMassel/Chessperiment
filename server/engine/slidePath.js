const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
/**
 * Squares (relative to the piece) that a sliding move passes over, excluding the
 * start and the target.
 *
 * - Straight lines (orthogonal / diagonal): the squares along that line.
 * - Off-line targets on square boards (e.g. a "3 rooks side by side" piece moving one
 *   file over and several ranks up): the move is treated as a rook ray along its own
 *   lane, so only pieces on THAT lane block it, starting from the square next to the
 *   piece. This only applies if the rule also allows every square of that lane.
 * - Anything else keeps the old behaviour (evenly spaced squares on the line, which is
 *   nothing for knight-like jumps).
 */
export function getSlidePath(dx, dy, ruleAllows, allowLanes = true) {
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const path = [];
    const straight = dx === 0 || dy === 0 || adx === ady;
    if (!straight && allowLanes && Math.max(adx, ady) > 1) {
        // Walk along the lane that belongs to the longer axis
        const vertical = ady > adx;
        const len = vertical ? ady : adx;
        const dir = Math.sign(vertical ? dy : dx);
        const lane = [];
        let isLane = true;
        for (let k = 0; k < len; k++) {
            const sq = vertical ? [dx, k * dir] : [k * dir, dy];
            if (!ruleAllows(sq[0], sq[1])) {
                isLane = false;
                break;
            }
            lane.push(sq);
        }
        if (isLane)
            return lane;
    }
    const steps = gcd(adx, ady);
    for (let s = 1; s < steps; s++)
        path.push([(s * dx) / steps, (s * dy) / steps]);
    return path;
}
