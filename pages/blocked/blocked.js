(() => {
  const params = new URLSearchParams(window.location.search)
  const reason = decodeURIComponent(params.get('reason') || '')
  const time   = decodeURIComponent(params.get('time')   || '')
  const url    = decodeURIComponent(params.get('url')    || '')
  const info   = decodeURIComponent(params.get('info')   || '')
  const isDev  = params.get('isDev') === 'true'

  document.title = reason ? `Blocked: ${reason}` : 'Page Blocked'
  document.getElementById('reason').textContent = reason || 'Page Blocked'
  document.getElementById('url').textContent = url
  document.getElementById('time').textContent = time ? `Blocked at ${time}` : ''

  const pinSection    = document.getElementById('pin-section')
  const pinInput      = document.getElementById('pin-input')
  const pinSubmit     = document.getElementById('pin-submit')
  const pinError      = document.getElementById('pin-error')
  const details       = document.getElementById('details')
  const detailContent = document.getElementById('details-content')

  function revealDetails() {
    pinSection.style.display = 'none'
    details.style.display = 'block'
    try {
      detailContent.textContent = JSON.stringify(JSON.parse(info), null, 2)
    } catch {
      detailContent.textContent = info || '(no details available)'
    }
  }

  async function hashPin(pin) {
    const data = new TextEncoder().encode(pin)
    const buf  = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  async function validateAndReveal() {
    const pin = pinInput.value.trim()
    if (!pin) {
      pinError.textContent = 'Please enter a PIN.'
      return
    }
    const stored = await browser.storage.local.get(['pinHash'])
    const storedHash = stored.pinHash?.v
    if (!storedHash) {
      pinError.textContent = 'No PIN configured.'
      return
    }
    const hash = await hashPin(pin)
    if (hash !== storedHash) {
      pinError.textContent = 'Incorrect PIN.'
      return
    }
    revealDetails()
  }

  if (isDev) {
    pinInput.value = '111111'
    revealDetails()
    return
  }

  pinSubmit.addEventListener('click', validateAndReveal)
  pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') validateAndReveal() })
})()
