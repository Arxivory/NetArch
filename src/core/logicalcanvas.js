export class LogicalCanvas {
  constructor(opts = {}) {
    this.container = opts.container || document.body;
    this.width = opts.width || 800;
    this.height = opts.height || 600;
    this.gridSize = opts.gridSize || 32;
    this.snap = opts.snap ?? true;
    this.snapTolerance = opts.snapTolerance || 8; 
    this.bgColor = opts.bgColor || '#ffffffff';
    this.gridColor = opts.gridColor || '#818181ff';
    this.gridMajorColor = opts.gridMajorColor || '#6b6b6bff';
    this.gridMinorAlpha = opts.gridMinorAlpha || 0.12;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    this.canvas = null;
    this.ctx = null;
    this.isPointerDown = false;
    this.mode = 'none';
    this.startPoint = null;
    this.currentPoint = null;

    this.rooms = [];
    this.walls = [];

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

  startDrawRoom() {
    this.mode = 'room';
    this._updateCursor();
  }

  startDrawWall() {
    this.mode = 'wall';
    this._updateCursor();
  }

  cancelDrawing() {
    this.mode = 'none';
    this.isPointerDown = false;
    this.startPoint = null;
    this.currentPoint = null;
    this._updateCursor();
    this._render();
  }

  _updateCursor() {
    if (!this.canvas) return;
    if (this.mode === 'room' || this.mode === 'wall') {
      this.canvas.style.cursor = 'crosshair';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

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
      if (Math.hypot(x2 - x1, y2 - y1) > 2) {
        const wall = { id: this._genId('wall'), x1, y1, x2, y2 };
        this.walls.push(wall);
        this.onWallCreated(wall);
      }
    }

    this.startPoint = null;
    this.currentPoint = null;
    this._render();
  }

  _genId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  _render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width / this.devicePixelRatio, this.canvas.height / this.devicePixelRatio);
    ctx.restore();

    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

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

    for (const r of this.rooms) {
      ctx.fillStyle = 'rgba(174, 174, 174, 0.5)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#000000ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
    }

    ctx.strokeStyle = '#000000ff';
    ctx.lineWidth = 2;
    for (const wline of this.walls) {
      ctx.beginPath();
      ctx.moveTo(wline.x1 + 0.5, wline.y1 + 0.5);
      ctx.lineTo(wline.x2 + 0.5, wline.y2 + 0.5);
      ctx.stroke();
    }

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
