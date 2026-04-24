import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import appState from '../../state/AppState.js';

export class GizmoManager {
  constructor(camera, canvas, scene) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;

    this.control = new TransformControls(this.camera, this.canvas);
    this.helper = this.control.getHelper();
    this.scene.add(this.helper);
    this.control.setMode('translate');
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.initialized = false;
    
    this._setupEventListeners();
  }

  _setupEventListeners() {
    
    this.control.addEventListener('objectChange', () => {
      this._syncTransformToStore();
    });

    window.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'p': this.control.setMode('translate'); break;
        case 'r': this.control.setMode('rotate'); break;
        case 'm': this.control.setMode('scale'); break;
        default: this.control.setMode('translate'); break;
      }
    });

    this.canvas.addEventListener('pointerdown', (event) => {
      this._onPointerDown(event);
    });
  }

  _onPointerDown(event) {
    if (event.button !== 0) return;

    console.log('Selected a Mesh');

    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersects = this.raycaster.intersectObjects(
      this.scene.children.filter(obj => obj !== this.helper),
        true
    );

    if (intersects.length > 0) {
      let object = intersects[0].object;

      while (object && !object.userData?.id && object.parent) {
          object = object.parent;
      }

      if (object && object.userData?.id) {
          if (object.userData.type === 'device') {
            appState.selection.selectDevice(object.userData.id);
          } else if (object.userData.type === 'furniture') {
            appState.selection.focusedNode(object.userData.id, 'furniture');
          } else {
            appState.selection.clearSelection();
            this.detach();
          }
      } else {
        appState.selection.clearSelection();
        this.detach();
      }
    } else {
        this.detach();
        appState.selection.clearSelection();
    }
  }

  attach(object) {
    this.control.attach(object);
  }

  detach() {
    this.control.detach();
  }

  _syncTransformToStore() {
    const object = this.control.object;
    if (!object || !object.userData.id) return;
    console.log('Syncing transform to store');

    const { id, type } = object.userData;
    const updates = {
      position: { x: object.position.x, y: object.position.y, z: object.position.z },
      rotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
      scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z }
    };

    if (type === 'device') {
      const device = appState.network.getDevice(id);
      if (device) device.transform = updates; 
      
    } else if (type === 'furniture') {
      const furniture = appState.furniture.getFurniture(id);
      if (furniture) furniture.transform = updates;
    }

    
    appState.notifyListeners();
  }
}