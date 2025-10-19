'use client'
import { useEffect, useState } from 'react'

export default function Thanks(){
  const [ok,setOk]=useState(false)
  useEffect(()=>{
    const id = new URLSearchParams(location.search).get('session_id')
    setOk(!!id)
  },[])
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Спасибо!</h1>
      <p className="mt-2">{ok?'Оплата подтверждена. Права скоро обновятся.':'Нет session_id.'}</p>
      <a className="mt-4 inline-block underline" href="/chat">Перейти в чат →</a>
    </div>
  )
}
