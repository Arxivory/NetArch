/*
 LogicalCanvas

 Provides a simple engineering-style black/white grid canvas with
 snapping and basic drawing primitives: rooms (rectangles) and walls (lines).

 Usage:
 import { LogicalCanvas } from './core/logicalcanvas';
 const lc = new LogicalCanvas({ container: document.getElementById('some'), width:800, height:600 });
 lc.startDrawRoom(); // user will call this to start drawing
 lc.startDrawWall(); // likewise for walls

 The class exposes callable functions so UI/tooling can attach to them.
 It is intentionally framework-agnostic and manipulates a plain HTMLCanvasElement.
*/

export class LogicalCanvas {
  constructor(opts = {}) {
    this.container = opts.container || document.body;
    this.width = opts.width || 800;
    this.height = opts.height || 600;
    this.gridSize = opts.gridSize || 32; // logical pixels
    this.snap = opts.snap ?? true;
    this.snapTolerance = opts.snapTolerance || 8; // pixels for snapping to existing points
    this.bgColor = opts.bgColor || '#ffffffff';
    this.gridColor = opts.gridColor || '#818181ff';
    this.gridMajorColor = opts.gridMajorColor || '#6b6b6bff';
    this.gridMinorAlpha = opts.gridMinorAlpha || 0.12;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // drawing state
    this.canvas = null;
    this.ctx = null;
    this.isPointerDown = false;
    this.mode = 'none'; // 'room' | 'wall' | 'none'
    this.startPoint = null;
    this.currentPoint = null;

    // data
    this.rooms = []; // {id,x,y,w,h}
    this.walls = []; // {id,x1,y1,x2,y2}

    // callbacks
    this.onRoomCreated = opts.onRoomCreated || function () {};
    this.onWallCreated = opts.onWallCreated || function () {};

    this._pointerMoveHandler = this._onPointerMove.bind(this);
    this._pointerDownHandler = this._onPointerDown.bind(this);
    this._pointerUpHandler = this._onPointerUp.bind(this);

    this._initCanvas();
    this._render();
  }

  _initCanvas() {
    const c = document.createElement('canvas');
    c.style.display = 'block';
    c.style.width = this.width + 'px';
    c.style.height = this.height + 'px';
    c.width = Math.floor(this.width * this.devicePixelRatio);
    c.height = Math.floor(this.height * this.devicePixelRatio);
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    this.container.appendChild(c);

    // events
    c.addEventListener('pointerdown', this._pointerDownHandler);
    window.addEventListener('pointermove', this._pointerMoveHandler);
    window.addEventListener('pointerup', this._pointerUpHandler);
  }

  destroy() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('pointerdown', this._pointerDownHandler);
    window.removeEventListener('pointermove', this._pointerMoveHandler);
    window.removeEventListener('pointerup', this._pointerUpHandler);
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.canvas = null;
    this.ctx = null;
  }

  setSize(w, h) {
    this.width = w;
    this.height = h;
    if (!this.canvas) return;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.floor(w * this.devicePixelRatio);
    this.canvas.height = Math.floor(h * this.devicePixelRatio);
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    this._render();
  }

  setGridSize(n) {
    this.gridSize = n;
    this._render();
  }

  enableSnap(v) {
    this.snap = !!v;
  }

  clear() {
    this.rooms = [];
    this.walls = [];
    this._render();
  }

  // Start drawing modes - callable by external tools
  startDrawRoom() {
    this.mode = 'room';
  }

  startDrawWall() {
    this.mode = 'wall';
  }

  cancelDrawing() {
    this.mode = 'none';
    this.isPointerDown = false;
    this.startPoint = null;
    this.currentPoint = null;
    this._render();
  }

  // Export/Import
  exportJSON() {
    return JSON.stringify({ rooms: this.rooms, walls: this.walls });
  }

  importJSON(json) {
    try {
      const obj = typeof json === 'string' ? JSON.parse(json) : json;
      this.rooms = obj.rooms || [];
      this.walls = obj.walls || [];
      this._render();
    } catch (e) {
      console.error('Invalid json for import', e);
    }
  }

  // internal pointer helpers
  _canvasRect() {
    return this.canvas.getBoundingClientRect();
  }

  _clientToCanvas(clientX, clientY) {
    const rect = this._canvasRect();
    const x = (clientX - rect.left) * (this.canvas.width / rect.width) / this.devicePixelRatio;
    const y = (clientY - rect.top) * (this.canvas.height / rect.height) / this.devicePixelRatio;
    return { x, y };
  }

  _snapToGrid(pt) {
    if (!this.snap) return pt;
    const gx = Math.round(pt.x / this.gridSize) * this.gridSize;
    const gy = Math.round(pt.y / this.gridSize) * this.gridSize;
    return { x: gx, y: gy };
  }

  _onPointerDown(e) {
    if (this.mode === 'none') return;
    this.isPointerDown = true;
    const p = this._clientToCanvas(e.clientX, e.clientY);
    const snapped = this._snapToGrid(p);
    this.startPoint = snapped;
    this.currentPoint = snapped;
    this._render();
  }

  _onPointerMove(e) {
    if (!this.canvas) return;
    const p = this._clientToCanvas(e.clientX, e.clientY);
    const snapped = this._snapToGrid(p);
    this.currentPoint = snapped;
    if (this.isPointerDown && this.mode !== 'none') {
      // preview while drawing
      this._render();
    }
  }

  _onPointerUp(e) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    if (!this.startPoint || !this.currentPoint) {
      this.startPoint = null;
      this.currentPoint = null;
      return;
    }

    if (this.mode === 'room') {
      // create rect normalized
      const x1 = this.startPoint.x;
      const y1 = this.startPoint.y;
      const x2 = this.currentPoint.x;
      const y2 = this.currentPoint.y;
      const rx = Math.min(x1, x2);
      const ry = Math.min(y1, y2);
      const rw = Math.abs(x2 - x1);
      const rh = Math.abs(y2 - y1);
      if (rw > 2 && rh > 2) {
        const room = { id: this._genId('room'), x: rx, y: ry, w: rw, h: rh };
        this.rooms.push(room);
        this.onRoomCreated(room);
      }
    } else if (this.mode === 'wall') {
      const x1 = this.startPoint.x;
      const y1 = this.startPoint.y;
      const x2 = this.currentPoint.x;
      const y2 = this.currentPoint.y;
      // avoid zero-length walls
      if (Math.hypot(x2 - x1, y2 - y1) > 2) {
        const wall = { id: this._genId('wall'), x1, y1, x2, y2 };
        this.walls.push(wall);
        this.onWallCreated(wall);
      }
    }

    // reset drawing state but keep mode so user can draw multiple
    this.startPoint = null;
    this.currentPoint = null;
    this._render();
  }

  _genId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  // render everything
  _render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // clear
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width / this.devicePixelRatio, this.canvas.height / this.devicePixelRatio);
    ctx.restore();

    // background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

    // grid - minor
    ctx.beginPath();
    ctx.strokeStyle = this.gridColor;
    ctx.globalAlpha = this.gridMinorAlpha;
    for (let x = 0; x <= w; x += this.gridSize) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = 0; y <= h; y += this.gridSize) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // grid - major lines every 4
    ctx.beginPath();
    ctx.strokeStyle = this.gridMajorColor;
    for (let x = 0; x <= w; x += this.gridSize * 4) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = 0; y <= h; y += this.gridSize * 4) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();

    // draw rooms
    for (const r of this.rooms) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#000000ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
    }

    // draw walls
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    for (const wline of this.walls) {
      ctx.beginPath();
      ctx.moveTo(wline.x1 + 0.5, wline.y1 + 0.5);
      ctx.lineTo(wline.x2 + 0.5, wline.y2 + 0.5);
      ctx.stroke();
    }

    // preview current drawing
    if (this.startPoint && this.currentPoint) {
      ctx.save();
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = 'rgba(0,255,0,0.08)';
      ctx.lineWidth = 1.5;
      if (this.mode === 'room') {
        const x = Math.min(this.startPoint.x, this.currentPoint.x);
        const y = Math.min(this.startPoint.y, this.currentPoint.y);
        const wRect = Math.abs(this.currentPoint.x - this.startPoint.x);
        const hRect = Math.abs(this.currentPoint.y - this.startPoint.y);
        ctx.fillRect(x, y, wRect, hRect);
        ctx.strokeRect(x + 0.5, y + 0.5, wRect, hRect);
      } else if (this.mode === 'wall') {
        ctx.beginPath();
        ctx.moveTo(this.startPoint.x + 0.5, this.startPoint.y + 0.5);
        ctx.lineTo(this.currentPoint.x + 0.5, this.currentPoint.y + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

export default LogicalCanvas;
