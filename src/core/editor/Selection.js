export class Selection {
    constructor(opts) {
        this.dpr = opts.dpr || 1;
    }

    identifyEntity(x, y, entities, ctx) {
        x *= this.dpr;
        y *= this.dpr;
        
        const priorityMap = { 'Space': 3, 'Site': 2, 'Domain': 1 };
        
        let bestMatch = null;
        let bestPriority = -1;
        
        for (const arr of entities) {
            for (const en of arr) {
                if (!en || !en.path) continue;
                if (this.wasHit(en, x, y, ctx)) {
                    const priority = priorityMap[en.structureType] || 0;
                    if (priority > bestPriority) {
                        bestMatch = en;
                        bestPriority = priority;
                    }
                }
            }
        }
        
        if (bestMatch) {
            console.log('Entity identified:', bestMatch);
            appState.selection.focusedNode(bestMatch.id, bestMatch.type);
            return bestMatch;
        }
        return null;
    }

    wasHit(en, x, y, ctx) {
        if (en.hitTestMode === 'path') {
            return ctx.isPointInPath(en.path, x, y);
        }
        else if (en.hitTestMode === 'stroke') {
            return ctx.isPointInStroke(en.path, x, y);
        }
    }
}