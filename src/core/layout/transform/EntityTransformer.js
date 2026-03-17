export class EntityTransformer {

  applyEntityTransform(en, updates, shapeRenderer, checkForOverlap) {
    if (!en) return false;
    if (updates.position) {
      const nx = updates.position.x;
      const ny = updates.position.y;

      en.saveCurrentPosition();
      en.transform.position.x = nx;
      en.transform.position.y = ny;

      const deviceTypes = [
        'device',
        'router',
        'switch',
        'cables',
        'end-device',
        'Wireless',
        'Furniture'
      ]
      if (en.type === 'rectangle') {
        en.x = nx;
        en.y = ny;
        en.maxX = nx + en.transform.scale.w;
        en.maxY = ny + en.transform.scale.h;
        en.body.setPosition(en.x, en.y, true);
      }

      else if (en.type === 'polygon' || en.type === 'freeform') {
        const dx = nx - en.x;
        const dy = ny - en.y;
        en.move(dx, dy);
      }
      else if (en.type === 'circle') {
        en.x = nx;
        en.y = ny;
        en.body.setPosition(en.x, en.y, true);
      }
      else if (deviceTypes.includes(en.type)) {
        console.log('in here');
        en.x = nx;
        en.y = ny;
        en.body.setPosition(en.x, en.y, true);
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
      if (checkForOverlap(en, "transformation")) {
        console.log("Move area overlapping.");
        en.restoreToSavedPosition();
        return false;
      }
    }

    if (updates.scale !== undefined) {
      en.saveCurrentScale();
      en.setScale(updates.scale);
      if (checkForOverlap(en, "transformation")) {
        console.log(`Scaling area overlapping. Please Try again`);
        en.restoreToSavedScale();
        return false;
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