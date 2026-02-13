export class PointerHandler {
  constructor(opts = {}) {
    this.onPointerDown = opts.onPointerDown || null;
    this.onPointerMove = opts.onPointerMove || null;
    this.onPointerUp = opts.onPointerUp || null;

    this.isPointerDown = false;
    this.panStart = { e: 0, f: 0 };

    this._pointerDownHandler = this._onPointerDown.bind(this);
    this._pointerMoveHandler = this._onPointerMove.bind(this);
    this._pointerUpHandler = this._onPointerUp.bind(this);
  }

  attach(canvas) {
    if (!canvas) return;
    this.canvas = canvas;
    canvas.addEventListener('pointerdown', this._pointerDownHandler);
    window.addEventListener('pointermove', this._pointerMoveHandler);
    window.addEventListener('pointerup', this._pointerUpHandler);
  }

  detach() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('pointerdown', this._pointerDownHandler);
    window.removeEventListener('pointermove', this._pointerMoveHandler);
    window.removeEventListener('pointerup', this._pointerUpHandler);
    this.canvas = null;
  }

  getCanvasRect() {
    if (!this.canvas) return null;
    return this.canvas.getBoundingClientRect();
  }

  clientToWorld(clientX, clientY, viewState = { e: 0, f: 0 }) {
    const rect = this.getCanvasRect();
    if (!rect) return { x: 0, y: 0 };

    let x = clientX - rect.left;
    let y = clientY - rect.top;
    
    x -= viewState.e;
    y -= viewState.f;
    
    return { x, y };
  }

  setPanStart(clientX, clientY) {
    this.panStart = { e: clientX, f: clientY };
  }

  getPanStart() {
    return this.panStart;
  }

  getPanDelta(clientX, clientY) {
    const dx = clientX - this.panStart.e;
    const dy = clientY - this.panStart.f;
    return { dx, dy };
  }

  setPointerDown(value) {
    this.isPointerDown = !!value;
  }

  getIsPointerDown() {
    return this.isPointerDown;
  }

  _onPointerDown(e) {
    if (this.onPointerDown) {
      this.onPointerDown(e);
    }
  }

  _onPointerMove(e) {
    if (this.onPointerMove) {
      this.onPointerMove(e);
    }
  }

  _onPointerUp(e) {
    if (this.onPointerUp) {
      this.onPointerUp(e);
    }
  }

  setCursor(cursorStyle) {
    if (this.canvas) {
      this.canvas.style.cursor = cursorStyle;
    }
  }
}

export default PointerHandler;
