import type { CapacitorElectronConfig } from '@capacitor-community/electron';
import { getCapacitorElectronConfig, setupElectronDeepLinking } from '@capacitor-community/electron';
import type { BrowserWindow, MenuItemConstructorOptions } from 'electron';
import { app, dialog, MenuItem } from 'electron';
import electronIsDev from 'electron-is-dev';
import unhandled from 'electron-unhandled';
import { autoUpdater, UpdateInfo } from 'electron-updater';

import { ElectronCapacitorApp, setupContentSecurityPolicy } from './setup';


// Graceful handling of unhandled errors.
unhandled();



// Define our menu templates (these are optional)
const trayMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [new MenuItem({ label: 'Quit App', role: 'quit' })];
const appMenuBarMenuTemplate: (MenuItemConstructorOptions | MenuItem)[] = [
  { role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu' },
  { role: 'viewMenu' },
];


// Get Config options from capacitor.config
const capacitorFileConfig: CapacitorElectronConfig = getCapacitorElectronConfig();

// Initialize our app. You can pass menu templates into the app here.
// const myCapacitorApp = new ElectronCapacitorApp(capacitorFileConfig);
const myCapacitorApp = new ElectronCapacitorApp(capacitorFileConfig, trayMenuTemplate, appMenuBarMenuTemplate);

// If deeplinking is enabled then we will set it up here.
if (capacitorFileConfig.electron?.deepLinkingEnabled) {
  setupElectronDeepLinking(myCapacitorApp, {
    customProtocol: capacitorFileConfig.electron.deepLinkingCustomProtocol ?? 'mycapacitorapp',
  });
}


// If we are in Dev mode, use the file watcher components.
if (electronIsDev) {
  // setupReloadWatcher(myCapacitorApp);
}


// Run Application
(async () => {

  await app.whenReady(); // Wait for electron app to be ready.

  setupContentSecurityPolicy(myCapacitorApp.getCustomURLScheme()); // Security - Set Content-Security-Policy based on whether or not we are in dev mode.

  await myCapacitorApp.init(); // Initialize our app, build windows, and load content.


  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.checkForUpdates(); // Check for updates if we are in a packaged app.

  showMsg(app.getVersion())

  autoUpdater.on('update-available', (info:UpdateInfo) => {
    showMsg('update available')
    const path = autoUpdater.downloadUpdate()
    showMsg(path)
  })

  autoUpdater.on('update-not-available', (info:UpdateInfo) => {
    showMsg('update not available')
  })

  autoUpdater.on('update-downloaded', (info:UpdateInfo) => {
    showMsg('update downloaded successfully')
  })

  autoUpdater.on('error', (info) => {
    showMsg('autoUpdater error')
  })






})();



let mainWindow: BrowserWindow;

const showMsg = (message) => {
  setTimeout(_=> {
    dialog.showMessageBox(mainWindow, {
      message,
    });
  }, 1000)
}



// When the dock icon is clicked.
app.on('activate', async function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (myCapacitorApp.getMainWindow().isDestroyed()) {
    await myCapacitorApp.init();
  }
});




// Handle when all of our windows are close (platforms have their own expectations).
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// Place all ipc or other electron api calls and custom functionality under this line
