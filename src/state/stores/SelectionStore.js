
export class SelectionStore {
  constructor() {
    this.selectedDeviceIds = [];
    this.selectedLinkIds = [];
    this.focusedId = null;
    this.focusedType = null;
    this.highlightedIds = [];
    this.listeners = [];
  }

  focusedNode(id, type) {
    this.focusedId = id;
    this.focusedType = type;

    this.selectedDeviceIds = [];
    this.selectedLinkIds = [];

    console.log(`Focused on ${type} with ID: ${id}`);

    this.notify();
  }

  isFocused(id) {
    return this.focusedId === id;
  }

  canAddChild(requiredParentType) {
    return this.focusedType === requiredParentType;
  }

  selectDevice(deviceId, multiSelect = false) {
    if (!multiSelect) {
      this.selectedDeviceIds = [];
      this.selectedLinkIds = [];
    }

    if (!this.selectedDeviceIds.includes(deviceId)) {
      this.selectedDeviceIds.push(deviceId);
    }

    this.focusedId = deviceId;
    this.notify();
  }

  deselectDevice(deviceId) {
    this.selectedDeviceIds = this.selectedDeviceIds.filter(id => id !== deviceId);
    if (this.focusedId === deviceId) {
      this.focusedId = null;
    }
    this.notify();
  }

  selectLink(linkId, multiSelect = false) {
    if (!multiSelect) {
      this.selectedDeviceIds = [];
      this.selectedLinkIds = [];
    }

    if (!this.selectedLinkIds.includes(linkId)) {
      this.selectedLinkIds.push(linkId);
    }

    this.focusedId = linkId;
    this.notify();
  }

  deselectLink(linkId) {
    this.selectedLinkIds = this.selectedLinkIds.filter(id => id !== linkId);
    if (this.focusedId === linkId) {
      this.focusedId = null;
    }
    this.notify();
  }

  clearSelection() {
    this.selectedDeviceIds = [];
    this.selectedLinkIds = [];
    this.focusedId = null;
    this.highlightedIds = [];
    this.notify();
  }

  setHighlight(ids) {
    this.highlightedIds = Array.isArray(ids) ? ids : [ids];
    this.notify();
  }

  clearHighlight() {
    this.highlightedIds = [];
    this.notify();
  }

  getSelectedDeviceIds() {
    return [...this.selectedDeviceIds];
  }

  getSelectedLinkIds() {
    return [...this.selectedLinkIds];
  }

  getFocusedId() {
    return this.focusedId;
  }

  isDeviceSelected(deviceId) {
    return this.selectedDeviceIds.includes(deviceId);
  }

  isLinkSelected(linkId) {
    return this.selectedLinkIds.includes(linkId);
  }

  isHighlighted(id) {
    return this.highlightedIds.includes(id);
  }

  getSelectionCount() {
    return this.selectedDeviceIds.length + this.selectedLinkIds.length;
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.error('Listener must be a function');
      return () => {};
    }

    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this);
      } catch (error) {
        console.error('Error in SelectionStore listener:', error);
      }
    });
  }
}
