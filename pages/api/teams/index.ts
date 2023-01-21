import type { NextApiRequest, NextApiResponse } from "next";
import z from "zod";
import { prisma } from "@/lib/server/prisma";
import { addTeamMember } from "@/lib/server/team";
import { getCurrentUser } from "@/lib/server/user";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case "POST":
        return await handlePOST(req, res);
      case "GET":
        return await handleGET(req, res);
      default:
        res.setHeader("Allow", "POST, GET");
        throw new Error(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    return res.status(400).json({
      data: null,
      error: {
        message: error.message,
      },
    });
  }
}

// Create a new team
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const schema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
  });

  const { name, slug } = schema.parse(req.body);

  const existingTeam = await prisma.team.count({
    where: {
      slug,
    },
  });

  if (existingTeam > 0) {
    throw new Error("Team already exists");
  }

  const newTeam = await prisma.team.create({
    data: {
      name,
      slug,
    },
  });

  const currentUser = await getCurrentUser(req);

  await addTeamMember({
    teamId: newTeam.id,
    userId: currentUser.id,
    role: "OWNER",
  });

  return res.status(201).json({
    data: newTeam,
    error: null,
  });
};

// Get all teams for the current user
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const currentUser = await getCurrentUser(req);

  const teams = await prisma.team.findMany({
    where: {
      members: {
        some: {
          userId: currentUser.id,
        },
      },
    },
  });

  return res.status(200).json({
    data: teams,
    error: null,
  });
};
