"use client";

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import esMX from 'date-fns/locale/es';
import { useSession, signIn, signOut } from "next-auth/react";
import { Plus, LogOut, Calendar as CalendarIcon, RefreshCw, X, Trash2 } from 'lucide-react';

const locales = {
  'es': esMX,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

export default function Scheduler() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '', phoneNumber: '', address: '', appliance: '', complaint: '',
    startTime: '', endTime: ''
  });

  useEffect(() => {
    if (session?.accessToken) {
      fetchEvents();
    }
  }, [session]);

  const fetchEvents = async () => {
    setLoading(true);
    // Para propósitos de demostración, cargamos el mes actual y un poco más
    const start = new Date();
    start.setDate(1); start.setMonth(start.getMonth() - 1);
    const end = new Date();
    end.setMonth(end.getMonth() + 2);

    try {
      const res = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        const formattedEvents = (data || []).map(item => {
          const props = item.extendedProperties?.private || {};
          return {
            id: item.id,
            title: item.summary,
            start: new Date(item.start.dateTime || item.start.date),
            end: new Date(item.end.dateTime || item.end.date),
            isApplianceRepairEvent: props.isApplianceRepairEvent === 'true',
            customerName: props.customerName || '',
            phoneNumber: props.phoneNumber || '',
            address: props.address || '',
            appliance: props.appliance || '',
            complaint: props.complaint || '',
            originalItem: item
          };
        });
        setEvents(formattedEvents);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent(null);
    setFormData({
      customerName: '', phoneNumber: '', address: '', appliance: '', complaint: '',
      startTime: format(start, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(end, "yyyy-MM-dd'T'HH:mm")
    });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setFormData({
      customerName: event.customerName,
      phoneNumber: event.phoneNumber,
      address: event.address,
      appliance: event.appliance,
      complaint: event.complaint,
      startTime: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(event.end, "yyyy-MM-dd'T'HH:mm")
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isNew = !selectedEvent;
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/calendar' : `/api/calendar/${selectedEvent.id}`;

    const payload = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString()
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchEvents();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !confirm('¿Estás seguro de que quieres eliminar esta cita?')) return;
    try {
      const res = await fetch(`/api/calendar/${selectedEvent.id}`, { method: 'DELETE' });
      if (res.ok) {
        setIsModalOpen(false);
        fetchEvents();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEventDrop = async ({ event, start, end }) => {
    if (!event.isApplianceRepairEvent) return; // Only allow dragging our own events
    
    // Optimistic update
    const updatedEvents = events.map(e => e.id === event.id ? { ...e, start, end } : e);
    setEvents(updatedEvents);

    const payload = {
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString()
    };

    try {
      const res = await fetch(`/api/calendar/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        // Revert on error
        fetchEvents();
      }
    } catch (error) {
      console.error(error);
      fetchEvents();
    }
  };

  if (status === "loading") return <div className="loading">Cargando...</div>;

  if (!session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <CalendarIcon size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h1>Scheduler</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Inicia sesión para gestionar citas.</p>
        <button onClick={() => signIn('google')} className="btn">
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  return (
    <>
      <header>
        <h1>Calendario de Reparaciones</h1>
        <div className="user-info">
          <button onClick={fetchEvents} className="btn-outline" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '8px' }}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
          <img src={session.user.image} alt="Avatar" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{session.user.name}</span>
            <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', textAlign: 'left', fontSize: '0.8rem' }}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventDrop}
        resizable
        messages={{
          next: "Sig",
          previous: "Ant",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda"
        }}
        eventPropGetter={(event) => {
          if (event.isApplianceRepairEvent) {
            return { style: { backgroundColor: 'var(--primary)' } };
          }
          return { style: { backgroundColor: 'var(--text-muted)' } }; // Otros eventos de Google
        }}
      />

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEvent ? 'Editar Cita' : 'Nueva Cita'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre del Cliente</label>
                <input required className="input-field" type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input required className="input-field" type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input required className="input-field" type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Electrodoméstico</label>
                <input required className="input-field" type="text" value={formData.appliance} placeholder="Ej. Refrigerador LG, Lavadora Whirlpool" onChange={e => setFormData({...formData, appliance: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Descripción de Avería</label>
                <textarea required className="input-field" rows="3" value={formData.complaint} onChange={e => setFormData({...formData, complaint: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Inicio</label>
                  <input required className="input-field" type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Fin</label>
                  <input required className="input-field" type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>
              </div>

              <div className="modal-footer">
                {selectedEvent && selectedEvent.isApplianceRepairEvent && (
                  <button type="button" onClick={handleDelete} className="btn btn-danger" style={{ marginRight: 'auto' }}><Trash2 size={16} /> Eliminar</button>
                )}
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancelar</button>
                <button type="submit" className="btn">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
