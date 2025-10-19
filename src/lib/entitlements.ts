import { prisma } from '@/server/db/prisma'
export async function getEntitlements(userId: string) {
  let e = await prisma.entitlement.findUnique({ where:{ userId }})
  if (!e) e = await prisma.entitlement.create({ data:{ userId } as any })
  return e
}
export async function recomputeEntitlements(userId: string) {
  const sub = await prisma.subscription.findUnique({ where:{ userId }})
  const plan = sub?.plan ?? 'FREE'
  const map = { FREE:{plus:false,pro:false,tts:false,max:0}, PLUS:{plus:true,pro:false,tts:true,max:30}, PRO:{plus:true,pro:true,tts:true,max:9999} }
  await prisma.entitlement.upsert({
    where:{ userId },
    update:{ plus:map[plan].plus, pro:map[plan].pro, tts:map[plan].tts, maxFaceTimeMinutes:map[plan].max } as any,
    create:{ userId, plus:map[plan].plus, pro:map[plan].pro, tts:map[plan].tts, maxFaceTimeMinutes:map[plan].max } as any,
  })
}
