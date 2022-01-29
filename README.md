# Full Screen to Workspace: Gnome extension

### Objective:
To simulate macos windowing/workspace behavior as close as possible.

### Inspiration:
Inspired by and extends functionality of [fullscreenworkspace-satran.in](https://github.com/satran/fullscreenworkspace-satran.in "Gnome Shell Extension Fullscreen to Workspace")

### Reference:
* https://gjs-docs.gnome.org/meta9~9_api/
* https://gjs-docs.gnome.org/shell01~0.1_api/

### Design notes:
* Designed to work with multiple monitors, but workspaces enabled only on primary monitor.
* Window operations on secondary monitors will be ignored.
* A workspace is marked as occupied if a window is fullscreened in it.

### Workflow outline:
* If window operation is on secondary display, do not change anything.
* On new window:
  * If new window is restored,
  * If new window is maximized
* When maximizing existing window or a new maximized window is opened:
  * if current workspace has existing windows, create a new workspace to the right of current, move window to it and switch focus to it.
  * if current workspace has no windows, continue in current workspace.
* When restoring existing window or a new restored window is opened:
  * move window to first unoccupied workspace and switch to it.
