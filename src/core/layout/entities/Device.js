import { Box } from "check2d";

export class Device {
    constructor(deviceData, cx, cy, size, system) {
        this.x = cx - size / 2;
        this.y = cy - size / 2;
        this.w = size;
        this.h = size;
        this.type = deviceData.type || 'device';
        this.label = deviceData.name || 'Device';
        this.interfaces = deviceData.interfaces || [];
        this.system = system;
        this.hitTestMode = 'path';
        this.initDeviceIcons();
        this.initIconImage(deviceData);
        this.initTransform();
        this.initPath(size);
        this.initBody();
    }

    initDeviceIcons() {
        this.deviceIcons = {};
        const svgs = {
            'router': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6.01 18h.01"/><path d="M10.01 18h.01"/><path d="M15 10v4"/><path d="M17.84 7.17a4 4 0 0 0-5.66 0"/><path d="M20.66 4.34a8 8 0 0 0-11.31 0"/></svg>`,
            'server': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
            'pc': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
            'switch': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6" y2="6"/><line x1="6" y1="18" x2="6" y2="18"/></svg>`,
            'firewall': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`
        };
        Object.keys(svgs).forEach(key => {
            const img = new Image();
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgs[key]);
            this.deviceIcons[key] = img;
        });
    }

    initIconImage(deviceData) {
        const rawType = (deviceData.type + ' ' + deviceData.name).toLowerCase();

        let iconKey = null;

        if (rawType.includes('router') || rawType.includes('gateway') || rawType.includes('1941')) {
            iconKey = 'router';
        } else if (rawType.includes('switch') || rawType.includes('catalyst') || rawType.includes('2960') || rawType.includes('9200')) {
            iconKey = 'switch';
        } else if (rawType.includes('server')) {
            iconKey = 'server';
        } else if (rawType.includes('firewall') || rawType.includes('asa')) {
            iconKey = 'firewall';
        } else if (rawType.includes('pc') || rawType.includes('desktop') || rawType.includes('computer') || rawType.includes('laptop')) {
            iconKey = 'pc';
        } else if (rawType.includes('phone')) {
            iconKey = 'pc';
        }
        this.icon = this.deviceIcons[iconKey];
    }

    initPath() {
        this.path = new Path2D();
        this.path.rect(this.tileX, this.tileY, this.tileWidth, this.tileHeight);
    }

    initBody() {
        const margin = 0.0001;
        const w = this.tileWidth;
        const h = this.tileHeight;
        this.body = new Box(
            { x: this.tileX + margin, y: this.tileY + margin },
            w - 2 * margin,
            h - 2 * margin
        );
        this.system.insert(this.body);
    }

    initTransform() {
        this.transform = {
            position: {
                x: this.x - 17,
                y: this.y - 20,
                z: 0
            },
            scale: { factor: 1 },
            rotation: { x: 0, y: 0, z: 0 }
        };
    }



    get renderWidth() {
        return this.w * this.transform.scale.factor;
    }

    get renderHeight() {
        return this.h * this.transform.scale.factor;
    }

    get tileWidth() {
        return this.renderWidth + 34;
    }

    get tileHeight() {
        return this.renderHeight + 41;
    }

    get tileX() {
        return this.transform.position.x;
    }

    get tileY() {
        return this.transform.position.y;
    }


    updatePath() {
        this.path = new Path2D();
        this.path.rect(this.tileX, this.tileY, this.tileWidth, this.tileHeight);
    }

    setScale(newScale) {
        this.transform.scale.factor = newScale.factor;
        this.body.setScale(newScale.factor, newScale.factor);
        this.body.width = this.tileWidth;
        this.body.height = this.tileHeight;
    }

    saveCurrentScale() {
        this.savedScale = JSON.parse(JSON.stringify(this.transform.scale));
    }

    restoreToSavedScale() {
        this.setScale(this.savedScale);
    }

    saveCurrentPosition() {
        this.savedPosition = {
            x: this.x,
            y: this.y,
            tx: this.transform.position.x,
            ty: this.transform.position.y
        };
    }

    restoreToSavedPosition() {
        this.x = this.savedPosition.x;
        this.y = this.savedPosition.y;
        this.transform.position.x = this.savedPosition.tx;
        this.transform.position.y = this.savedPosition.ty;
        this.body.setPosition(this.transform.position.x, this.transform.position.y,);
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.transform.position.x += dx;
        this.transform.position.y += dy;
        this.body.setPosition(this.tileX, this.tileY, true);
    }

    checkIfOverlapping(floorId) {
        let overlapping = false;
        this.system.checkOne(this.body, (other) => {
            if (other !== this.body) {
                const otherFloorId = other.b?.floorId ?? null;
                const currentFloorId = floorId ?? null;
                if (other.b && otherFloorId === currentFloorId) {
                    overlapping = true;
                }
            }
        });
        return overlapping;
    }
}

export default Device;