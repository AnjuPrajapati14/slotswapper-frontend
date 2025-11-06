import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Event, EventStatus, CreateEventData } from '../types';
import { eventsAPI } from '../utils/api';

interface EventModalProps {
  event?: Event | null;
  onSave: (event: Event) => void;
  onClose: () => void;
}

interface EventForm {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: EventStatus;
}

const EventModal: React.FC<EventModalProps> = ({ event, onSave, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!event;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventForm>();

  const startDate = watch('startDate');
  //const startTime = watch('startTime');
  const endDate = watch('endDate');

  useEffect(() => {
    if (event) {
      const startDateTime = new Date(event.startTime);
      const endDateTime = new Date(event.endTime);
      
      setValue('title', event.title);
      setValue('startDate', startDateTime.toISOString().split('T')[0]);
      setValue('startTime', startDateTime.toTimeString().slice(0, 5));
      setValue('endDate', endDateTime.toISOString().split('T')[0]);
      setValue('endTime', endDateTime.toTimeString().slice(0, 5));
      setValue('status', event.status);
    } else {
      // Set default values for new event
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setValue('startDate', now.toISOString().split('T')[0]);
      setValue('startTime', now.toTimeString().slice(0, 5));
      setValue('endDate', oneHourLater.toISOString().split('T')[0]);
      setValue('endTime', oneHourLater.toTimeString().slice(0, 5));
      setValue('status', EventStatus.BUSY);
    }
  }, [event, setValue]);

  // Auto-update end date when start date changes
  useEffect(() => {
    if (startDate && (!endDate || endDate < startDate)) {
      setValue('endDate', startDate);
    }
  }, [startDate, endDate, setValue]);

  const onSubmit = async (data: EventForm) => {
    setIsLoading(true);
    
    try {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`);

      // Validation
      if (endDateTime <= startDateTime) {
        toast.error('End time must be after start time');
        setIsLoading(false);
        return;
      }

      const eventData: CreateEventData = {
        title: data.title,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: data.status,
      };

      let response;
      if (isEditing) {
        response = await eventsAPI.updateEvent(event!._id, eventData);
      } else {
        response = await eventsAPI.createEvent(eventData);
      }

      onSave(response.event);
      toast.success(response.message);
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} event`);
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

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isEditing ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Event Title
                </label>
                <input
                  {...register('title', {
                    required: 'Title is required',
                    minLength: {
                      value: 1,
                      message: 'Title cannot be empty',
                    },
                  })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter event title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    {...register('startDate', { required: 'Start date is required' })}
                    type="date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    {...register('startTime', { required: 'Start time is required' })}
                    type="time"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    {...register('endDate', { required: 'End date is required' })}
                    type="date"
                    min={startDate}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    {...register('endTime', { required: 'End time is required' })}
                    type="time"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  disabled={event?.status === EventStatus.SWAP_PENDING}
                >
                  <option value={EventStatus.BUSY}>Busy</option>
                  <option value={EventStatus.SWAPPABLE}>Swappable</option>
                </select>
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;