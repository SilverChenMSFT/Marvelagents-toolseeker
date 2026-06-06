import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('toolSeeker', {
  generateReport: (description) => ipcRenderer.invoke('generate-report', description),
  openReport: (reportPath) => ipcRenderer.invoke('open-report', reportPath)
})
