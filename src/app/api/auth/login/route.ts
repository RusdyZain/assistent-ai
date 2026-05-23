import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticate, createSessionToken, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Email atau password tidak valid" }, { status: 400 });
    }

    const business = await authenticate(parsed.data.email, parsed.data.password);
    if (!business) {
      return NextResponse.json({ error: "Login gagal" }, { status: 401 });
    }

    const token = await createSessionToken({
      businessId: business.id,
      email: business.email,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      business: {
        id: business.id,
        name: business.name,
        ownerName: business.ownerName,
        email: business.email,
      },
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan saat login" }, { status: 500 });
  }
}
