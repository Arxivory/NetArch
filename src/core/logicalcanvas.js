//import { SAOShader } from "three/examples/jsm/Addons.js"; //unused

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
    this.viewState = { e: 0, f: 0 };

    this.rooms = []; //for changes

    //structures
    this.rectangles = [];
    this.polygons = [];
    this.freeforms = [];
    this.circles = [];
    this.structureType = '';

    //fenestrations
    this.walls = [];
    this.roofs = [];
    this.doors = [];
    this.windows = [];

    this.panStart = {
      x: 0,
      y: 0
    }


    this.onRoomCreated = opts.onRoomCreated || function () { };
    this.onWallCreated = opts.onWallCreated || function () { };
    this.onCircleCreated = opts.onCircleCreated || function () { };
    //'this' is now LogicalCanvas
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
    this.rectangles = [];
    this.polygons = [];
    this.freeforms = [];
    this.circles = [];
    this.walls = [];
    this.roofs = [];
    this.doors = [];
    this.windows = [];
    this._render();
  }

  //Shapes

  startDrawRoom() { //to be replaced with the method below
    this.mode = 'room';
    this._updateCursor();
  }

  startDrawRectangle(structureType) { // structType - e.g. 'Domain', 'Site', or 'Space'
    this.mode = 'rectangle';
    this.structureType = structureType;
    this._updateCursor();
  }

  startDrawPolygon(structureType) {
    this.mode = 'polygon';
    this.structureType = structureType;
    this._updateCursor();
  }

  startDrawFreeform(structureType) {
    this.mode = 'freeform';
    this.structureType = structureType;
    this._updateCursor();
  }

  startDrawCircle(structureType) { // pls change ui calls to method below
    this.mode = 'circle';
    this.structureType = structureType;
    this._updateCursor();
  }

  startDrawCircular(structureType) {
    this.mode = 'circle';
    this.structureType = structureType;
    this._updateCursor();
  }

  //Structures

  startDrawWall() {
    this.mode = 'wall';
    this._updateCursor();
  }

  startDrawRoof() {
    this.mode = 'roof';
    this._updateCursor();
  }

  startDrawDoor() {
    this.mode = 'door';
    this._updateCursor();
  }

  startDrawWindow() {
    this.mode = 'window';
    this._updateCursor();
  }

  //Controls

  startPan() {
    this.mode = 'pan';
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
    if (this.mode === 'room' || this.mode === 'wall' || this.mode === 'circle') {
      this.canvas.style.cursor = 'crosshair';
    }
    else if (this.mode === 'pan') {
      this.canvas.style.cursor = 'grab';
    }
    else {
      this.canvas.style.cursor = 'default';
    }
  }

  _canvasRect() {
    return this.canvas.getBoundingClientRect();
  }

  _clientToCanvas(clientX, clientY) { //pointer coordinates in viewport
    const rect = this._canvasRect();
    const x = (clientX - rect.left) * (this.canvas.width / rect.width) / this.devicePixelRatio;
    const y = (clientY - rect.top) * (this.canvas.height / rect.height) / this.devicePixelRatio;
    return { x, y };
  } 

  _snapToGrid(pt) { //returns coordinates of nearest grid intersection to the cursor
    if (!this.snap) return pt;
    const gx = Math.round(pt.x / this.gridSize) * this.gridSize;
    const gy = Math.round(pt.y / this.gridSize) * this.gridSize;
    return { x: gx, y: gy };
  }

  _onPointerDown(e) {
    if (this.mode === 'none') return;
    if (this.mode === 'pan') { //doesnt pass after switch 
      this.canvas.style.cursor = 'grabbing';
      this.panStart = this._clientToCanvas(e.clientX, e.clientY);
    }
    this.isPointerDown = true;
    const p = this._clientToCanvas(e.clientX, e.clientY);
    const snapped = this._snapToGrid(p);
    this.startPoint = snapped;
    this.currentPoint = snapped;
    this._render();
  }

  _onPointerMove(e) {
    if (!this.canvas) return;
    const p = this._clientToCanvas(e.clientX, e.clientY); //returns cursor coordinates relative to canvas
    const snapped = this._snapToGrid(p);
    this.currentPoint = snapped;
    if (this.isPointerDown && this.mode !== 'none') { //renders while drawing
      if (this.mode === 'pan') {
        this.pan(e.clientX, e.clientY);

      }
      this._render();
    }
  }

  _onPointerUp(e) {
    if (!this.isPointerDown) return;
    if (this.mode === 'pan') {
      this.canvas.style.cursor = 'grab';
    }
    this.isPointerDown = false;
    if (!this.startPoint || !this.currentPoint) {
      this.startPoint = null;
      this.currentPoint = null;
      return;
    }
    if (this.mode === 'room') { //to be 'rectangle'
      this.createRectangle()
    }
    else if (this.mode === 'polygon') {
      this.createPolygon();
    }
    else if (this.mode === 'circle') {
      this.createCircle();
    }
    else if (this.mode === 'freeform') {
      this.createFreeform();
    }
    else if (this.mode === 'wall') {
      this.createWall();
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
    console.log(`E: ${this.viewState.e}, F: ${this.viewState.f}`);
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    //clear canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //apply pixel ratio and pan
    ctx.restore(); //pop state
    //1.25
    ctx.save(); //this pair to return to original view after panning
    if (this.mode === 'pan') {
      ctx.translate(this.viewState.e, this.viewState.f);
    }
    console.log("Current transform " + ctx.getTransform()); //a

    ctx.fillStyle = "#8c2849";           //this.bgColor;
    ctx.fillRect(0, 0, w, h);
    this.makeMinorGrids();
    this.makeMajorGrids();
    this.renderRooms(); //should be renderRectangles()
    this.renderCircles();
    this.renderWalls();
    //ctx.restore()
    if (this.startPoint && this.currentPoint) {
      ctx.save();
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = 'rgba(0,255,0,0.08)';
      ctx.lineWidth = 1.5;
      if (this.mode === 'room') { // to be 'rectangle'
        this.outlineRoom();
      }
      else if (this.mode === 'polygon') {
        this.outlinePolygon();
      }
      else if (this.mode === 'circle') {
        this.outlineCircle();
      }
      else if (this.mode === 'freefrom') {
        this.outlineFreeform();
      }
      else if (this.mode === 'wall') {
        this.outlineWall();
      }
      else if (this.mode === 'roof') {
        this.outlineRoof();
      }
      else if (this.mode === 'door') {
        this.outlineDoor();
      }
      else if (this.mode === 'window') {
        this.outlineWindow();
      }
      ctx.restore();
    }
  }

  createRectangle() {
    const x1 = this.startPoint.x;
    const y1 = this.startPoint.y;
    const x2 = this.currentPoint.x;
    const y2 = this.currentPoint.y;
    const rx = Math.min(x1, x2);
    const ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1);
    const rh = Math.abs(y2 - y1);
    if (rw > 2 && rh > 2) {
      const room = {
        id: this._genId(`Rectangle ${this.structureType}`),
        x: rx,
        y: ry,
        w: rw,
        h: rh
      };
      this.rooms.push(room);
      this.onRoomCreated(room);
    }
  }

  createPolygon() {

  }

  createCircle() {
    const cx = this.startPoint.x;
    const cy = this.startPoint.y;
    const dx = this.currentPoint.x - cx;
    const dy = this.currentPoint.y - cy;
    const r = Math.hypot(dx, dy);
    if (r > 2) {
      const circle = {
        id: this._genId(`Circle ${this.structureType}`),
        x: cx,
        y: cy,
        r
      };
      this.circles.push(circle);
      this.onCircleCreated(circle);
    }
  }

  createFreeform() {

  }

  createWall() {
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

  createRoof() {

  }

  createDoor() {

  }

  createWindow() {

  }

  outlineRoom() { //to be renamed 'outlineRectangle'
    const x = Math.min(this.startPoint.x, this.currentPoint.x);
    const y = Math.min(this.startPoint.y, this.currentPoint.y);
    const wRect = Math.abs(this.currentPoint.x - this.startPoint.x);
    const hRect = Math.abs(this.currentPoint.y - this.startPoint.y);
    this.ctx.fillRect(x, y, wRect, hRect);
    this.ctx.strokeRect(x + 0.5, y + 0.5, wRect, hRect);
  }

  outlinePolygon() {

  }

  outlineCircle() {
    const cx = this.startPoint.x;
    const cy = this.startPoint.y;
    const dx = this.currentPoint.x - cx;
    const dy = this.currentPoint.y - cy;
    const r = Math.hypot(dx, dy);
    this.ctx.beginPath();
    this.ctx.arc(cx + 0.5, cy + 0.5, r, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  outlineFreeform() {

  }

  outlineWall() {
    this.ctx.beginPath();
    this.ctx.moveTo(this.startPoint.x + 0.5, this.startPoint.y + 0.5);
    this.ctx.lineTo(this.currentPoint.x + 0.5, this.currentPoint.y + 0.5);
    this.ctx.stroke();
  }

  outlineRoof() {

  }

  outlineDoor() {

  }

  outlineWindow() {

  }

  pan(clientX, clientY) {
    const p = this._clientToCanvas(clientX, clientY);

    const dx = p.x - this.panStart.x; // current coordinates - start coordinates from mouse down = delta
    const dy = p.y - this.panStart.y;

    this.viewState.e = dx;
    this.viewState.f = dy;

    this.panStart = p;
  }

  makeMinorGrids() {
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.gridColor;
    this.ctx.globalAlpha = this.gridMinorAlpha; //transparency value
    for (let x = 0; x <= this.width; x += this.gridSize) {
      this.ctx.moveTo(x + 0.5, 0);
      this.ctx.lineTo(x + 0.5, this.height);
    }
    for (let y = 0; y <= this.height; y += this.gridSize) {
      this.ctx.moveTo(0, y + 0.5);
      this.ctx.lineTo(this.width, y + 0.5);
    }
    this.ctx.stroke();
  }

  makeMajorGrids() {
    this.ctx.globalAlpha = 1;
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.gridMajorColor;
    for (let x = 0; x <= this.width; x += this.gridSize * 4) {
      this.ctx.moveTo(x + 0.5, 0);
      this.ctx.lineTo(x + 0.5, this.height);
    }
    for (let y = 0; y <= this.height; y += this.gridSize * 4) {
      this.ctx.moveTo(0, y + 0.5);
      this.ctx.lineTo(this.width, y + 0.5);
    }
    this.ctx.stroke();
  }

  renderRooms() { //to be renamed renderRectangles
    for (const r of this.rooms) { //should be this.rectangles
      this.ctx.fillStyle = 'rgba(174, 174, 174, 0.5)';
      this.ctx.fillRect(r.x, r.y, r.w, r.h);
      this.ctx.strokeStyle = '#000000ff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
      //console.log(`x: ${r.x + 0.5} y: ${r.y + 0.5} w: ${r.w} h: ${r.h }`);
    }

  }

  renderPolygons() {

  }

  renderCircles() {
    this.ctx.strokeStyle = '#000000ff';
    this.ctx.lineWidth = 2;
    for (const c of this.circles) {
      this.ctx.beginPath();
      this.ctx.arc(c.x + 0.5, c.y + 0.5, c.r, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  renderFreeforms() {

  }

  renderWalls() {
    this.ctx.strokeStyle = '#000000ff';
    this.ctx.lineWidth = 2;
    for (const wline of this.walls) {
      this.ctx.beginPath();
      this.ctx.moveTo(wline.x1 + 0.5, wline.y1 + 0.5);
      this.ctx.lineTo(wline.x2 + 0.5, wline.y2 + 0.5);
      this.ctx.stroke();
    }
  }

  renderRoofs() {

  }

  renderDoors() {

  }

  renderWindows() {

  }

}


export default LogicalCanvas;
