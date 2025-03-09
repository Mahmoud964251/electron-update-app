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



  setTimeout( _=> {


    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.checkForUpdates(); // Check for updates if we are in a packaged app.


    autoUpdater.on('update-available', async (info:UpdateInfo) => {

      const dialoge = await showMsg(`Update available: ${info.version}. Do you want to download it?`, ['Yes', 'No']);

      if (dialoge == 0) return autoUpdater.downloadUpdate();

      showMsg('Update skipped');

    })

    autoUpdater.on('update-not-available', (info:UpdateInfo) => {
      showMsg('update not available')
    })

    autoUpdater.on('update-downloaded', async (info:UpdateInfo) => {

      const dialoge = await showMsg('Update downloaded successfully. Restart to apply?', ['Restart Now', 'Later']);

      if (dialoge == 0) autoUpdater.quitAndInstall();

    })

    autoUpdater.on('error', (info) => {
      showMsg('autoUpdater error')
    })


  }, 4000)




})();



let mainWindow: BrowserWindow;

const showMsg = async (message: string, buttons: string[] = ['OK']): Promise<number> => {
  const result = await dialog.showMessageBox(mainWindow, { message, buttons });
  return result.response; // Return the index of the button clicked
};








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
