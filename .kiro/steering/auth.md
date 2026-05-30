---
inclusion: always
---

Since we are using clerk authentication with convex backend, on the client side we anyway have proxy(formerly middleware) for protection, on convex side:

Use authentication state in your Convex functions
If the client is authenticated, you can access the information stored in the JWT via ctx.auth.getUserIdentity.

If the client isn't authenticated, ctx.auth.getUserIdentity will return null.

convex/messages.ts (TS)

import { query } from "./\_generated/server";

export const getForCurrentUser = query({
args: {},
handler: async (ctx) => {
const identity = await ctx.auth.getUserIdentity();
if (identity === null) {
throw new Error("Not authenticated");
}
return await ctx.db
.query("messages")
.filter((q) => q.eq(q.field("author"), identity.email))
.collect();
},
});

Accessing user information client-side
To access the authenticated user's information, use Clerk's User object, which can be accessed using Clerk's useUser() hook.
example: components/Badge.tsx TS
export default function Badge() {
const { user } = useUser();
return <span>Logged in as {user.fullName}</span>;
}
