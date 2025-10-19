'use client'
export default function Account(){
  async function manage(){
    const r = await fetch('/api/portal', { method:'POST' })
    const { url } = await r.json()
    location.href = url
  }
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Аккаунт</h1>
      <button className="mt-4 rounded border px-3 py-2" onClick={manage}>Manage subscription</button>
    </div>
  )
}
