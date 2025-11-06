import React, { useState, useEffect } from 'react';
import { format, parseISO, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import EventModal from '../components/EventModal';
import { Event, EventStatus } from '../types';
import { eventsAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';

const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getEvents();
      setEvents(response.events);
    } catch (error: any) {
      toast.error('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup socket for real-time updates
  useSocket({
    onSwapRequestReceived: fetchEvents,
    onSwapRequestResponded: fetchEvents,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventsAPI.deleteEvent(eventId);
      setEvents(events.filter(e => e._id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleToggleSwappable = async (event: Event) => {
    const newStatus = event.status === EventStatus.SWAPPABLE ? EventStatus.BUSY : EventStatus.SWAPPABLE;
    
    try {
      const response = await eventsAPI.updateEventStatus(event._id, newStatus);
      setEvents(events.map(e => e._id === event._id ? response.event : e));
      toast.success(`Event marked as ${newStatus.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update event');
    }
  };

  const handleEventSaved = (savedEvent: Event) => {
    if (editingEvent) {
      setEvents(events.map(e => e._id === savedEvent._id ? savedEvent : e));
    } else {
      setEvents([...events, savedEvent]);
    }
    setShowModal(false);
    setEditingEvent(null);
  };

  const getStatusBadge = (status: EventStatus) => {
    const styles = {
      [EventStatus.BUSY]: 'bg-gray-100 text-gray-800',
      [EventStatus.SWAPPABLE]: 'bg-green-100 text-green-800',
      [EventStatus.SWAP_PENDING]: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const sortedEvents = events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">My Calendar</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your events and mark them as swappable for others to request.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleCreateEvent}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Event
            </button>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleCreateEvent}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Event
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedEvents.map((event) => (
                        <tr key={event._id} className={isAfter(new Date(), parseISO(event.endTime)) ? 'opacity-60' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {format(parseISO(event.startTime), 'MMM d, yyyy')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(parseISO(event.startTime), 'h:mm a')} - {format(parseISO(event.endTime), 'h:mm a')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(event.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            {event.status !== EventStatus.SWAP_PENDING && (
                              <>
                                <button
                                  onClick={() => handleToggleSwappable(event)}
                                  className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${
                                    event.status === EventStatus.SWAPPABLE
                                      ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                                  }`}
                                >
                                  {event.status === EventStatus.SWAPPABLE ? 'Make Busy' : 'Make Swappable'}
                                </button>
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {event.status === EventStatus.SWAP_PENDING && (
                              <span className="text-xs text-gray-500">Swap pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <EventModal
          event={editingEvent}
          onSave={handleEventSaved}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
        />
      )}
    </Layout>
  );
};

export default Dashboard;