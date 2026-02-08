export class DrawingCommand {
  constructor(controller, appState) {
    this.controller = controller;
    this.appState = appState;
  }

  execute() {
    throw new Error('execute() must be implemented');
  }

  undo() {
    // Soon
  }
}

export class StartDrawRectangleCommand extends DrawingCommand {
  constructor(controller, appState, structureType = '') {
    super(controller, appState);
    this.structureType = structureType;
  }

  execute() {
    this.controller?.startDrawRectangle(this.structureType);
    this.appState.tools.setActiveTool('rectangle');
  }
}

export class StartDrawCircleCommand extends DrawingCommand {
  constructor(controller, appState, structureType = '') {
    super(controller, appState);
    this.structureType = structureType;
  }

  execute() {
    this.controller?.startDrawCircle(this.structureType);
    this.appState.tools.setActiveTool('circle');
  }
}

export class StartDrawWallCommand extends DrawingCommand {
  execute() {
    this.controller?.startDrawWall();
    this.appState.tools.setActiveTool('wall');
  }
}

export class StartDrawCableCommand extends DrawingCommand {
  execute() {
    this.controller?.startDrawCable();
    this.appState.tools.setActiveTool('cable');
  }
}

export class StartDrawPolygonCommand extends DrawingCommand {
  constructor(controller, appState, structureType = '') {
    super(controller, appState);
    this.structureType = structureType;
  }

  execute() {
    this.controller?.startDrawPolygon(this.structureType);
    this.appState.tools.setActiveTool('polygon');
  }
}

export class StartPanCommand extends DrawingCommand {
  execute() {
    this.controller?.startPan();
    this.appState.tools.setActiveTool('pan');
  }
}

export class CancelDrawingCommand extends DrawingCommand {
  execute() {
    this.controller?.cancelDrawing();
    this.appState.tools.clearActiveTool();
  }
}

export class AddDeviceCommand extends DrawingCommand {
  constructor(controller, appState, deviceData, x, y) {
    super(controller, appState);
    this.deviceData = deviceData;
    this.x = x;
    this.y = y;
  }

  execute() {
    this.controller?.addDevice(this.deviceData, this.x, this.y);
  }
}

export class SetGridSizeCommand extends DrawingCommand {
  constructor(controller, appState, size) {
    super(controller, appState);
    this.size = size;
  }

  execute() {
    this.controller?.setGridSize(this.size);
  }
}

export class SetSnapCommand extends DrawingCommand {
  constructor(controller, appState, enabled) {
    super(controller, appState);
    this.enabled = enabled;
  }

  execute() {
    this.controller?.enableSnap(this.enabled);
  }
}

export default DrawingCommand;
