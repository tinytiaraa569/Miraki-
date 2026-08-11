export async function resolveEffectivePermissions({ Permission, role, user }) {
  const grantIds = (user.overridePermissions?.grant ?? []).map(String)
  const revokeIds = (user.overridePermissions?.revoke ?? []).map(String)

  const baseIds = (role?.permissions ?? []).map(String)
  const effectiveIds = new Set(baseIds)
  for (const id of grantIds) effectiveIds.add(id)
  for (const id of revokeIds) effectiveIds.delete(id)

  if (effectiveIds.size === 0) return []

  return Permission.find({
    _id: { $in: [...effectiveIds] },
    isActive: true,
  })
    .select("key action category module label")
    .lean()
}

export function buildMenuFromPermissions(permissions) {
  const modules = new Set()
  for (const p of permissions) {
    if (p.module) modules.add(p.module)
  }
  return [...modules]
}