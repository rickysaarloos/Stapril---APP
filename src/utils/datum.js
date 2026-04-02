export function vandaagISO() {
  const nu = new Date()
  const jaar = nu.getFullYear()
  const maand = String(nu.getMonth() + 1).padStart(2, '0')
  const dag = String(nu.getDate()).padStart(2, '0')
  return `${jaar}-${maand}-${dag}`
}

export function stappenDocId(uid, datum = vandaagISO()) {
  return `${uid}_${datum}`
}

export function dagVanMaand() {
  return new Date().getDate()
}

export function dagVanApril() {
  const nu = new Date()
  const start = new Date(nu.getFullYear(), 3, 1)
  const diff = Math.floor((nu - start) / (1000 * 60 * 60 * 24)) + 1
  return Math.min(Math.max(diff, 1), 30)
}