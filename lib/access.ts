export class AccessError extends Error {
  constructor(public status: 401 | 403) {
    super(
      status === 401
        ? "管理者ログインが必要です。"
        : "このアカウントには管理者権限がありません。",
    );
  }
}
export function assertAdmin(
  user: { id: string } | null,
  allowedIds: readonly string[],
) {
  if (!user) throw new AccessError(401);
  if (!allowedIds.includes(user.id)) throw new AccessError(403);
  return user;
}
