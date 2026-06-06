import './style.css'

document.querySelector('#app').innerHTML = `
  <main class="container">
    <h1>Marvel Agents Tool Seeker</h1>
    <p>Describe the tools or agents you want. We'll search GitHub and generate an HTML report.</p>
    <form id="search-form">
      <label for="description">Tool or agent description</label>
      <textarea id="description" rows="4" placeholder="e.g. AI coding agents for automated PR reviews"></textarea>
      <button type="submit">Find matching tools</button>
    </form>
    <p id="status" role="status"></p>
    <div id="report-actions" class="hidden">
      <button id="open-report" type="button">Open generated HTML report</button>
    </div>
    <iframe id="report-preview" title="Generated report preview"></iframe>
  </main>
`

const form = document.querySelector('#search-form')
const status = document.querySelector('#status')
const reportActions = document.querySelector('#report-actions')
const openReportButton = document.querySelector('#open-report')
const reportPreview = document.querySelector('#report-preview')

let currentReportPath = ''

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const description = document.querySelector('#description').value

  status.textContent = 'Searching GitHub and generating report...'
  reportActions.classList.add('hidden')
  reportPreview.srcdoc = ''

  try {
    const result = await window.toolSeeker.generateReport(description)
    currentReportPath = result.reportPath
    status.textContent = `Found ${result.results.length} matching repositories. Report saved to ${result.reportPath}`
    reportPreview.srcdoc = result.reportHtml
    reportActions.classList.remove('hidden')
  } catch (error) {
    status.textContent = error.message || 'Failed to generate report.'
  }
})

openReportButton.addEventListener('click', async () => {
  if (currentReportPath) {
    await window.toolSeeker.openReport(currentReportPath)
  }
})
