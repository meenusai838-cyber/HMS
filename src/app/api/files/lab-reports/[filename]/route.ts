import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readUploadedFile } from "@/lib/file-storage";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const STAFF_ROLES = new Set(["LAB", "DOCTOR", "FRONT_DESK", "ADMIN"]);

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

  const { filename } = await context.params;

  const order = await prisma.labOrder.findFirst({
    where: { reportStoredName: filename },
    include: { patient: true },
  });
  if (!order) {
    return new Response(null, { status: 404 });
  }

  const isStaff = STAFF_ROLES.has(session.user.role);
  const isOwner = session.user.role === "PATIENT" && order.patient.userId === session.user.id;
  if (!isStaff && !isOwner) {
    return new Response(null, { status: 403 });
  }

  const buffer = await readUploadedFile("lab-reports", filename);
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${order.reportFileName ?? filename}"`,
    },
  });
}
