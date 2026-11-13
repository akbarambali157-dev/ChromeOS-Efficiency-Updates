# ChromeOS Efficiency Updates 2.3.0

## Workspace profiles
- Added up to eight named shortcut workspaces.
- Each workspace has its own shortcut collection; switching workspaces does not delete the others.
- Existing installations automatically migrate their current shortcuts into a Default workspace.
- Added create, switch and delete controls, with duplicate-name protection and a limit of eight profiles.
- Workspace profiles and the active workspace are included in backup export and validated during import.

## Maintenance
- Removed an obsolete stray expression from task backup validation.
- Preserved the 2.1.0 dark-mode and wallpaper improvements and the 2.2.0 task manager.
- Kept Manifest V3 and minimum Chrome 103 compatibility.

## Verification
- JavaScript syntax, manifest JSON, HTML insertion points and CSS block balance were checked.
- Browser runtime testing on ChromeOS is still required.
