const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

function setupAutoUpdater(getWindow, log) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', async () => {
    const result = await dialog.showMessageBox(getWindow(), {
      type: 'info',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update available',
      message: 'A new version is available. Download now?'
    });

    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on('update-downloaded', async () => {
    const result = await dialog.showMessageBox(getWindow(), {
      type: 'info',
      buttons: ['Install and restart', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update ready',
      message: 'Update downloaded. Install and restart now?'
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (error) => {
    log(`Updater error: ${error.message}`);
  });
}

function checkForUpdates() {
  autoUpdater.checkForUpdates();
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates
};
