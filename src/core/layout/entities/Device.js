import { Box } from "check2d";

export class Device {
    constructor(deviceData, x, y, size, system) {
        console.log(deviceData);
        this.x = x;
        this.y = y;
        this.w = size;
        this.h = size;
        this.size = size;
        this.type = deviceData.type || 'device';
        this.label = deviceData.name || 'Device';
        this.interfaces = deviceData.interfaces || [];
        this.system = system;
        this.hitTestMode = 'path';
        this.initDeviceIcons();
        this.initIconImage(deviceData)
        this.initPath(size);
        this.initBody();
        this.initTransform();
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
            console.log(img.src);
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

    initPath(size) {
        const half = size / 2;
        const px = this.x - half;
        const py = this.y - half;
        this.path = new Path2D();
        this.path.rect(px, py, size, size);
    }

    initBody() {
        const margin = 0.0001;
        this.body = new Box(
            { x: this.x + margin, y: this.y + margin },
            this.w - 2 * margin,
            this.h - 2 * margin
        );
        this.body.structType = this.structureType;
        this.system.insert(this.body);
    }

    initTransform() {
        this.transform = {
            position: { x: this.x, y: this.y, z: 0 },
            scale: { factor: 1, w: this.w, h: this.h },
            rotation: { x: 0, y: 0, z: 0 }
        };
    }

    updatePath(x, y, size) {
        const path = new Path2D();
        path.rect(x, y, size, size);
        this.path = path;
    }

    setScale(newScale) {
        this.transform.scale.factor = newScale.factor;
        this.transform.scale.w = this.w * newScale.factor;
        this.transform.scale.h = this.h * newScale.factor;
        this.size *= newScale.factor;
        this.body.setScale(newScale.factor, newScale.factor);
    }

    saveCurrentScale() {
        this.savedScale = JSON.parse(JSON.stringify(this.transform.scale));
    }

    restoreToSavedScale() {
        this.setScale(this.savedScale);
        this.body.setScale(this.transform.scale.factor, this.transform.scale.factor);
    }

    saveCurrentPosition() {
        this.savedPosition = {
            x: this.x,
            y: this.y,
        }
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.transform.position.x += dx;
        this.transform.position.y += dy;
        this.body.setPosition(this.x, this.y, true);
    }

    checkIfOverlapping() {

    }
}

export default Device;