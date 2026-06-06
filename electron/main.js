import { app, BrowserWindow, ipcMain, shell } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    win.loadURL(devServerUrl)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildReportHtml(description, results) {
  const items = results
    .map(
      (result) => `
        <li>
          <h2><a href="${escapeHtml(result.url)}">${escapeHtml(result.fullName)}</a></h2>
          <p>${escapeHtml(result.description || 'No description provided.')}</p>
          <p><strong>Stars:</strong> ${escapeHtml(result.stars)}</p>
        </li>`
    )
    .join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tool Seeker Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; line-height: 1.5; }
      h1 { margin-bottom: 0; }
      p.meta { color: #555; margin-top: 4px; }
      ul { list-style: none; padding: 0; }
      li { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
      a { color: #0b5fff; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>Tool Seeker Report</h1>
    <p class="meta">Query: ${escapeHtml(description)}</p>
    <p class="meta">Generated: ${escapeHtml(new Date().toISOString())}</p>
    <ul>${items || '<li>No matching repositories found.</li>'}</ul>
  </body>
</html>`
}

ipcMain.handle('generate-report', async (_event, description) => {
  const queryText = String(description || '').trim()
  if (!queryText) {
    throw new Error('Please enter a description.')
  }

  const query = encodeURIComponent(`${queryText} tool agent`)
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'marvelagents-toolseeker'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`GitHub search failed with status ${response.status}.`)
  }

  const payload = await response.json()
  const results = (payload.items || []).map((item) => ({
    fullName: item.full_name,
    description: item.description,
    url: item.html_url,
    stars: item.stargazers_count
  }))

  const reportHtml = buildReportHtml(queryText, results)
  const reportPath = path.join(app.getPath('documents'), `toolseeker-report-${Date.now()}.html`)
  await fs.writeFile(reportPath, reportHtml, 'utf8')

  return { reportPath, reportHtml, results }
})

ipcMain.handle('open-report', async (_event, reportPath) => {
  if (!reportPath) {
    return
  }
  await shell.openPath(reportPath)
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
