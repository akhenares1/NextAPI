import { prisma } from "@/lib/prisma";

type Role = "admin" | "member";

export const addTeamMember = async (params: {
  teamId: number;
  userId: number;
  role: Role;
}) => {
  const { teamId, userId, role } = params;

  return await prisma.teamMember.create({
    data: {
      teamId,
      userId,
      role,
    },
  });
};

export const getTeamWithMembers = async (slug: string) => {
  return await prisma.team.findUniqueOrThrow({
    where: {
      slug,
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });
};
