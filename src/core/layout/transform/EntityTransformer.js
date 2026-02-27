export class EntityTransformer {

  applyEntityTransform(en, updates, shapeRenderer, checkForOverlap) {
    if (!en) return false;
    console.log('apply', en);
    if (updates.position) {
      const nx = updates.position.x;
      const ny = updates.position.y;

      en.transform.position.x = nx;
      en.transform.position.y = ny;

      const deviceTypes = [
        'device',
        'Routers',
        'Switches',
        'Cables',
        'EndDevices',
        'Wireless',
        'Furniture'
      ]

      if (en.type === 'rectangle') {
        en.x = nx;
        en.y = ny;
        en.path = new Path2D();
        en.path.rect(en.x + 0.5, en.y + 0.5, en.w, en.h);
      }
      else if (en.type === 'polygon' && Array.isArray(en.points)) {
        const dx = nx - en.points[0].x;
        const dy = ny - en.points[0].y;
        console.log(nx, ny);
        for (let i = 0; i < en.points.length; i++) {
          en.points[i] = {
            x: en.points[i].x + dx,
            y: en.points[i].y + dy
          };
        }

        const path = new Path2D();
        path.moveTo(en.points[0].x, en.points[0].y);
        for (let i = 1; i < en.points.length; i++) path.lineTo(en.points[i].x, en.points[i].y);
        path.closePath();
        en.path = path;
      }
      else if (en.type === 'circle') {
        en.x = nx;
        en.y = ny;
        en.path = new Path2D();
        en.path.arc(en.x, en.y, en.r, 0, Math.PI * 2);
      }
      else if (deviceTypes.includes(en.type)) {
        const size = shapeRenderer.gridSize * 1.3;
        const halfSize = size / 2;
        const px = nx - halfSize;
        const py = ny - halfSize;
        en.x = nx;
        en.y = ny;
        en.path = new Path2D();
        en.path.rect(px + 0.5, py + 0.5, size, size);
      }
      else if (en.type === 'wall' || en.type === 'cable') {
        console.log(nx, ny);
        const dx = nx - en.x1;
        const dy = ny - en.y1;
        en.x1 += dx;
        en.y1 += dy;
        en.x2 += dx;
        en.y2 += dy;
        const path = new Path2D();
        path.moveTo(en.x1, en.y1);
        path.lineTo(en.x2, en.y2);
      }

    }

    if (updates.scale !== undefined) {
      const originalScale = en.transform.scale;
      en.transform.scale = updates.scale;
      if ((checkForOverlap(en))) {
        console.log(`Scaling area overlapping. Please Try again`);
        en.transform.scale = originalScale;
        return false;
      }
      if (en.type === 'rectangle' || en.type === 'polygon'){
        en.w *= updates.scale;
        en.h *= updates.scale;
      }
    }

    if (updates.rotation) {
      en.transform.rotation = {
        ...en.transform.rotation,
        ...updates.rotation
      };
    }

    return true;
  }
}
export default EntityTransformer;