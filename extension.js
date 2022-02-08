const GObject = imports.gi.GObject;
const Meta = imports.gi.Meta;
const Main = imports.ui.main;

class Extension {
  constructor() {
    this._handles = [];
  }

  log_with_tag(line) {
    log(`FS2WS ${line}`);
  }

  get_windows_on_workspace(workspace) {
    let windows = workspace.list_windows();
    let dis = global.get_display();
    return windows.filter(win => win.get_monitor() == dis.get_primary_monitor());
  }

  should_ignore_window(win) {
    if (win.window_type !== Meta.WindowType.NORMAL) {
      this.log_with_tag(`ignoring window with title ${win.get_title()} as it is not a normal window`);
      return true;
    }

    let dis = global.get_display();
    if (dis.get_primary_monitor() != win.get_monitor()) {

      this.log_with_tag(`ignoring window with title ${win.get_title()} as it is not on primary display`);
      return true;
    }

    return false
  }

  get_first_unoccupied_workspace() {
    // Return first subsequent workspace with no maximized windows
    const start = global.workspace_manager.get_active_workspace_index() + 1;
    const end = Math.max(1, global.workspace_manager.n_workspaces);

    for (let index = start; index <= end; index++) {
      this.log_with_tag(`considering workspace number ${index}`);

      let workspace_occupied = false;
      let workspace = global.workspace_manager.get_workspace_by_index(index);
      if (!workspace) continue;

      let windows = this.get_windows_on_workspace(workspace);
      this.log_with_tag(`${index}: current workspace has ${windows.length} windows`)

      for (const window of windows) {
        this.log_with_tag(`${index}: considering window ${window.get_title()}`);
        this.log_with_tag(`${index}: window.fullscreen is ${window.fullscreen}`);
        this.log_with_tag(`${index}: window.get_maximized() is ${window.get_maximized()}`)
        if (window.fullscreen || window.get_maximized() == Meta.MaximizeFlags.BOTH)
          workspace_occupied = true;
      }

      if (workspace_occupied) {
        this.log_with_tag(`${index}: skipping workspace`);
        continue;
      }

      this.log_with_tag(`${index}: confirming workspace as unoccupied`);
      return workspace;
    }

    return global.workspace_manager.append_new_workspace(false, global.get_current_time());
  }

  maximize(win) {
    this.log_with_tag(`maximizing window with title ${win.get_title()}`);

    let current_index = global.workspace_manager.get_active_workspace_index();
    let target_workspace = global.workspace_manager.append_new_workspace(false, global.get_current_time());
    global.workspace_manager.reorder_workspace(target_workspace, current_index);

    win.change_workspace(target_workspace);
    target_workspace.activate(global.get_current_time());
  }

  unmaximize(win) {
    this.log_with_tag(`unmaximizing window with title ${win.get_title()}`);

    let current_workspace = win.get_workspace();
    let target_workspace = this.get_first_unoccupied_workspace();

    win.change_workspace(target_workspace);
    target_workspace.activate(global.get_current_time());
  }

  enable() {
    this.log_with_tag(`enabling extension`);

    this._handles.push(global.window_manager.connect('size-change', (_, act, change, from, to) => {
      let win = act.meta_window;
      if (this.should_ignore_window(win)) return;

      switch (change) {
        case Meta.SizeChange.MAXIMIZE:
        case Meta.SizeChange.FULLSCREEN:
          this.maximize(win);
          break;
        case Meta.SizeChange.UNMAXIMIZE:
        case Meta.SizeChange.UNFULLSCREEN:
          this.unmaximize(win);
          break;
        default:
          break;
      }
    }));

    this._handles.push(global.window_manager.connect('destroy', (_, act, change) => {
      let win = act.meta_window;
      if (this.should_ignore_window(win)) return;
      if (!win.fullscreen && win.get_maximized() !== Meta.MaximizeFlags.BOTH) return;

      this.unmaximize(win);
    }));

    this._handles.push(global.window_manager.connect('map', (_, act) => {
      let win = act.meta_window;
      if (this.should_ignore_window(win)) return;

      if (win.fullscreen || win.get_maximized() == Meta.MaximizeFlags.BOTH)
        this.maximize(win);
      else
        this.unmaximize(win);
    }));
  }

  disable() {
    this.log_with_tag(`disabling extension`);

    this._handles.splice(0).forEach(h => global.window_manager.disconnect(h));
  }
}


function init() {
  return new Extension();
}

