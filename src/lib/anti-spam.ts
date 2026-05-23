import { subMinutes } from "date-fns";

import { prisma } from "@/lib/prisma";

export async function getOutgoingMessageVelocity(businessId: string) {
  const oneMinuteAgo = subMinutes(new Date(), 1);
  const tenMinutesAgo = subMinutes(new Date(), 10);

  const [count1m, count10m] = await Promise.all([
    prisma.message.count({
      where: {
        businessId,
        direction: "outgoing",
        createdAt: { gte: oneMinuteAgo },
      },
    }),
    prisma.message.count({
      where: {
        businessId,
        direction: "outgoing",
        createdAt: { gte: tenMinutesAgo },
      },
    }),
  ]);

  const warning =
    count1m >= 15 || count10m >= 60
      ? "Volume pesan tinggi. Hindari spam dan pastikan customer memberi consent."
      : null;

  return {
    count1m,
    count10m,
    warning,
  };
}
