import appState from '../../state/AppState.js';

export class Selection {
    constructor(opts) {
        this.dpr = opts.dpr || 1;
    }

getEntityPriority(en) {
    const isDevice = en.interfaces !== undefined || en.catalogId !== undefined;
    const isFurniture = en.type === 'furniture' || en.id?.startsWith('furniture');
    const isDoor = en.type === 'door';
    const isWindow = en.type === 'window'; // ADD THIS

    if (isDevice) return 5;
    if (isFurniture) return 4;
    if (isDoor) return 3;     // bumped up
    if (isWindow) return 3;   // ADD THIS — same priority as door

    const priorityMap = {
        'Space': 2,           // bumped down to make room
        'Floor': 1,
        'Site': 0,
        'Domain': 0
    };

    return priorityMap[en.structureType] ?? 0;
}

getFocusType(en) {
    const isDevice = en.interfaces !== undefined || en.catalogId !== undefined;
    const isFurniture = en.type === 'furniture' || en.id?.startsWith('furniture');
    const isDoor = en.type === 'door';
    const isWindow = en.type === 'window'; // ADD THIS

    if (isDevice) return 'device';
    if (isFurniture) return 'furniture';
    if (isDoor) return 'door';
    if (isWindow) return 'window'; // ADD THIS

    return en.structureType
        ? en.structureType.toLowerCase()
        : en.type;
}

identifyEntity(x, y, entities, ctx) {
        x *= this.dpr;
        y *= this.dpr;

        let bestMatch = null;
        let bestPriority = -1;

        for (const arr of entities) {
            for (const en of arr) {
                if (!en || !en.path) continue;

                if (this.wasHit(en, x, y, ctx)) {
                    const priority = this.getEntityPriority(en);
                    if (priority > bestPriority) {
                        bestMatch = en;
                        bestPriority = priority;
                    }
                }
            }
        }

        if (bestMatch) {
            appState.selection.focusedNode(bestMatch.id, this.getFocusType(bestMatch));
            return bestMatch;
        }

        return null;
    }

wasHit(en, x, y, ctx) {
    if (en.hitTestMode === 'path') {
        return ctx.isPointInPath(en.path, x, y);
    }
    else if (en.hitTestMode === 'stroke') {
        const originalLineWidth = ctx.lineWidth;
        ctx.lineWidth = 12; // Wide tolerance for stroke hit
        const hit = ctx.isPointInStroke(en.path, x, y);
        ctx.lineWidth = originalLineWidth;
        return hit;
    }
}

}
