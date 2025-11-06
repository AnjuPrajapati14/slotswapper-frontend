import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowsRightLeftIcon, UserIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import SwapRequestModal from '../components/SwapRequestModal';
import { Event, EventStatus, User } from '../types';
import { swapsAPI, eventsAPI } from '../utils/api';

const Marketplace: React.FC = () => {
  const [swappableSlots, setSwappableSlots] = useState<Event[]>([]);
  const [mySwappableSlots, setMySwappableSlots] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Event | null>(null);

  const fetchData = async () => {
    try {
      const [swappableSlotsResponse, myEventsResponse] = await Promise.all([
        swapsAPI.getSwappableSlots(),
        eventsAPI.getEvents()
      ]);
      
      setSwappableSlots(swappableSlotsResponse.slots);
      setMySwappableSlots(
        myEventsResponse.events.filter(event => event.status === EventStatus.SWAPPABLE)
      );
    } catch (error: any) {
      toast.error('Failed to fetch marketplace data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestSwap = (slot: Event) => {
    if (mySwappableSlots.length === 0) {
      toast.error('You need to have swappable slots to request a swap');
      return;
    }
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleSwapRequested = () => {
    setShowModal(false);
    setSelectedSlot(null);
    // Refresh data to reflect updated slot statuses
    fetchData();
  };

  const getSlotOwner = (slot: Event): User => {
    return slot.userId as User;
  };

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
            <h1 className="text-2xl font-semibold text-gray-900">Marketplace</h1>
            <p className="mt-2 text-sm text-gray-700">
              Browse swappable time slots from other users and request swaps.
            </p>
          </div>
        </div>

        {mySwappableSlots.length === 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No swappable slots
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You need to mark some of your events as "swappable" before you can request swaps.
                    Go to your <a href="/dashboard" className="font-medium underline">dashboard</a> to make events swappable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              {swappableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowsRightLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No swappable slots</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are currently no slots available for swapping. Check back later!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {swappableSlots.map((slot) => {
                    const owner = getSlotOwner(slot);
                    return (
                      <div
                        key={slot._id}
                        className="relative group bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Swappable
                            </span>
                            <div className="flex items-center text-sm text-gray-500">
                              <UserIcon className="h-4 w-4 mr-1" />
                              {owner.name}
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                              {slot.title}
                            </h3>
                            
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Date:</span> {format(parseISO(slot.startTime), 'EEEE, MMM d, yyyy')}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Time:</span> {format(parseISO(slot.startTime), 'h:mm a')} - {format(parseISO(slot.endTime), 'h:mm a')}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Duration:</span> {Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60))} minutes
                              </p>
                            </div>
                          </div>

                          <div className="mt-6">
                            <button
                              onClick={() => handleRequestSwap(slot)}
                              disabled={mySwappableSlots.length === 0}
                              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
                              Request Swap
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedSlot && (
        <SwapRequestModal
          targetSlot={selectedSlot}
          mySwappableSlots={mySwappableSlots}
          onSuccess={handleSwapRequested}
          onClose={() => {
            setShowModal(false);
            setSelectedSlot(null);
          }}
        />
      )}
    </Layout>
  );
};

export default Marketplace;