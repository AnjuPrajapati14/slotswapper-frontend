import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { XMarkIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { Event, User } from '../types';
import { swapsAPI } from '../utils/api';

interface SwapRequestModalProps {
  targetSlot: Event;
  mySwappableSlots: Event[];
  onSuccess: () => void;
  onClose: () => void;
}

const SwapRequestModal: React.FC<SwapRequestModalProps> = ({
  targetSlot,
  mySwappableSlots,
  onSuccess,
  onClose,
}) => {
  const [selectedMySlot, setSelectedMySlot] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const targetOwner = targetSlot.userId as User;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMySlot) {
      toast.error('Please select one of your slots to offer');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await swapsAPI.createSwapRequest({
        mySlotId: selectedMySlot,
        theirSlotId: targetSlot._id,
      });
      
      toast.success(response.message);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create swap request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Request Slot Swap
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Target Slot Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">You want this slot:</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Event:</span> {targetSlot.title}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Owner:</span> {targetOwner.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Date:</span> {format(parseISO(targetSlot.startTime), 'EEEE, MMM d, yyyy')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Time:</span> {format(parseISO(targetSlot.startTime), 'h:mm a')} - {format(parseISO(targetSlot.endTime), 'h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowsRightLeftIcon className="h-8 w-8 text-primary-500" />
              </div>

              {/* My Slots Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Select one of your swappable slots to offer:</h4>
                <div className="space-y-3">
                  {mySwappableSlots.map((slot) => (
                    <label
                      key={slot._id}
                      className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                        selectedMySlot === slot._id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mySlot"
                        value={slot._id}
                        checked={selectedMySlot === slot._id}
                        onChange={(e) => setSelectedMySlot(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{slot.title}</div>
                            <div className="text-gray-500">
                              {format(parseISO(slot.startTime), 'MMM d, yyyy')} • {format(parseISO(slot.startTime), 'h:mm a')} - {format(parseISO(slot.endTime), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-full border-2 ${
                            selectedMySlot === slot._id
                              ? 'border-primary-600 bg-primary-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedMySlot === slot._id && (
                            <div className="h-full w-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex">
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      How it works
                    </h4>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        When you submit this request, {targetOwner.name} will receive a notification.
                        They can choose to accept or reject your swap proposal. If accepted, you'll
                        get their slot and they'll get yours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !selectedMySlot}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending Request...' : 'Send Swap Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapRequestModal;