import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getEvents, createEvent } from "@/lib/calendar";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('start');
    const timeMax = searchParams.get('end');

    if (!timeMin || !timeMax) {
      return Response.json({ error: "Faltan parámetros start y end" }, { status: 400 });
    }

    const events = await getEvents(session.accessToken, timeMin, timeMax);
    return Response.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();
    const newEvent = await createEvent(session.accessToken, data);
    return Response.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
