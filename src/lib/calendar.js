import { google } from 'googleapis';

/**
 * Crea una instancia cliente de Google Calendar usando el token de acceso del usuario
 */
export function getCalendarClient(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

/**
 * Obtiene los eventos de un rango de fechas
 */
export async function getEvents(accessToken, timeMin, timeMax) {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin,
    timeMax: timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items;
}

/**
 * Crea un nuevo evento en Google Calendar
 */
export async function createEvent(accessToken, eventData) {
  const calendar = getCalendarClient(accessToken);
  
  const description = `
Detalles del Cliente:
Nombre: ${eventData.customerName}
Teléfono: ${eventData.phoneNumber}
Dirección: ${eventData.address}

Detalles de la Reparación:
Electrodoméstico: ${eventData.appliance}
Problema/Queja: ${eventData.complaint}
`.trim();

  const event = {
    summary: `Reparación: ${eventData.customerName} - ${eventData.appliance}`,
    description: description,
    start: {
      dateTime: eventData.startTime,
      timeZone: 'America/Mexico_City', // Podría ser dinámico o configurable
    },
    end: {
      dateTime: eventData.endTime,
      timeZone: 'America/Mexico_City',
    },
    extendedProperties: {
      private: {
        customerName: eventData.customerName,
        phoneNumber: eventData.phoneNumber,
        address: eventData.address,
        appliance: eventData.appliance,
        complaint: eventData.complaint,
        isApplianceRepairEvent: 'true'
      }
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data;
}

/**
 * Actualiza un evento (ej. al cambiar fecha/hora o editar detalles)
 */
export async function updateEvent(accessToken, eventId, eventData) {
  const calendar = getCalendarClient(accessToken);
  
  // Primero obtenemos el evento actual para no sobreescribir datos que no enviamos
  const currentEvent = await calendar.events.get({
    calendarId: 'primary',
    eventId: eventId,
  });

  const updatedEvent = {
    ...currentEvent.data,
    start: {
      dateTime: eventData.startTime || currentEvent.data.start.dateTime,
      timeZone: currentEvent.data.start.timeZone,
    },
    end: {
      dateTime: eventData.endTime || currentEvent.data.end.dateTime,
      timeZone: currentEvent.data.end.timeZone,
    },
  };

  // Si enviamos detalles nuevos, actualizamos resumen y descripción
  if (eventData.customerName) {
    updatedEvent.summary = `Reparación: ${eventData.customerName} - ${eventData.appliance || ''}`;
    updatedEvent.description = `
Detalles del Cliente:
Nombre: ${eventData.customerName}
Teléfono: ${eventData.phoneNumber}
Dirección: ${eventData.address}

Detalles de la Reparación:
Electrodoméstico: ${eventData.appliance}
Problema/Queja: ${eventData.complaint}
`.trim();
    
    updatedEvent.extendedProperties = {
      private: {
        ...updatedEvent.extendedProperties?.private,
        customerName: eventData.customerName,
        phoneNumber: eventData.phoneNumber,
        address: eventData.address,
        appliance: eventData.appliance,
        complaint: eventData.complaint,
      }
    };
  }

  const response = await calendar.events.update({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: updatedEvent,
  });

  return response.data;
}

/**
 * Elimina un evento
 */
export async function deleteEvent(accessToken, eventId) {
  const calendar = getCalendarClient(accessToken);
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
  return true;
}
