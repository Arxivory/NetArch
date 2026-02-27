import appState from "../../state/AppState";

export class Selection {
    constructor(opts) {
        this.dpr = opts.dpr || 1;
    }

    identifyEntity(x, y, entities, ctx) {
        x *= this.dpr;
        y *= this.dpr;
        for (const arr of entities) {
            for (const en of arr) {
                if (!en || !en.path) continue;
                if (this.wasHit(en, x, y, ctx)) {
                    console.log('Entity identified:', en);

                    appState.selection.focusedNode(en.id, en.type);
                    return en;
                }
            }
        }
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