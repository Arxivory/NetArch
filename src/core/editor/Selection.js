import  appState  from "../../state/AppState";
export class Selection {
    constructor(opts) {
        this.dpr = opts.dpr || 1;
    }

    _getPriority(en) {
        // Prefer direct object entities over container structures.
        if (en?.entityType === 'furniture' || en?.type === 'furniture') return 120;
        if (Array.isArray(en?.interfaces)) return 110;

        const structurePriority = {
            Space: 30,
            Floor: 20,
            Site: 10,
            Domain: 5
        };

        if (en?.structureType) {
            return structurePriority[en.structureType] || 1;
        }

        return 50;
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
                    const priority = this._getPriority(en);
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