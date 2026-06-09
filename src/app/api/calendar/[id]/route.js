import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { updateEvent, deleteEvent } from "@/lib/calendar";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    
    const updatedEvent = await updateEvent(session.accessToken, id, data);
    return Response.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await deleteEvent(session.accessToken, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
