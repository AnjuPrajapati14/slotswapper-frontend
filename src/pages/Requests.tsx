import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon,
  ArrowRightIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { SwapRequest, SwapRequestStatus, Event, User } from '../types';
import { swapsAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';

const Requests: React.FC = () => {
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const fetchRequests = async () => {
    try {
      const [incomingResponse, outgoingResponse] = await Promise.all([
        swapsAPI.getIncomingRequests(),
        swapsAPI.getOutgoingRequests()
      ]);
      
      setIncomingRequests(incomingResponse.requests);
      setOutgoingRequests(outgoingResponse.requests);
    } catch (error: any) {
      toast.error('Failed to fetch swap requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup socket for real-time updates
  useSocket({
    onSwapRequestReceived: fetchRequests,
    onSwapRequestResponded: fetchRequests,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    try {
      const response = await swapsAPI.respondToSwapRequest(requestId, { accept });
      
      // Remove the request from incoming requests
      setIncomingRequests(prev => prev.filter(req => req._id !== requestId));
      
      toast.success(response.message);
      
      // Refresh requests to get updated data
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${accept ? 'accept' : 'reject'} swap request`);
    }
  };

  const getStatusBadge = (status: SwapRequestStatus) => {
    const styles = {
      [SwapRequestStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [SwapRequestStatus.ACCEPTED]: 'bg-green-100 text-green-800',
      [SwapRequestStatus.REJECTED]: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const RequestCard: React.FC<{ request: SwapRequest; isIncoming: boolean }> = ({ request, isIncoming }) => {
    const requester = request.requesterId as User;
    const targetUser = request.targetUserId as User;
    const requesterSlot = request.requesterSlotId as Event;
    const targetSlot = request.targetSlotId as Event;

    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {(isIncoming ? requester : targetUser).name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isIncoming ? requester.name : targetUser.name}
              </p>
              <p className="text-sm text-gray-500">
                {format(parseISO(request.createdAt), 'MMM d, yyyy at h:mm a')}
              </p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Their slot (what they're offering) */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                {isIncoming ? (
                  <ArrowRightIcon className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <ArrowLeftIcon className="h-4 w-4 text-blue-500 mr-2" />
                )}
                <h4 className="text-sm font-medium text-gray-900">
                  {isIncoming ? 'They offer' : 'You offered'}
                </h4>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{requesterSlot.title}</p>
                <p className="text-xs text-gray-600">
                  {format(parseISO(requesterSlot.startTime), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-600">
                  {format(parseISO(requesterSlot.startTime), 'h:mm a')} - {format(parseISO(requesterSlot.endTime), 'h:mm a')}
                </p>
              </div>
            </div>

            {/* Your slot (what you're giving up) */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                {isIncoming ? (
                  <ArrowLeftIcon className="h-4 w-4 text-blue-500 mr-2" />
                ) : (
                  <ArrowRightIcon className="h-4 w-4 text-green-500 mr-2" />
                )}
                <h4 className="text-sm font-medium text-gray-900">
                  {isIncoming ? 'For your' : 'They have'}
                </h4>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{targetSlot.title}</p>
                <p className="text-xs text-gray-600">
                  {format(parseISO(targetSlot.startTime), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-600">
                  {format(parseISO(targetSlot.startTime), 'h:mm a')} - {format(parseISO(targetSlot.endTime), 'h:mm a')}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons for incoming pending requests */}
          {isIncoming && request.status === SwapRequestStatus.PENDING && (
            <div className="flex space-x-3">
              <button
                onClick={() => handleRespondToRequest(request._id, true)}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Accept Swap
              </button>
              <button
                onClick={() => handleRespondToRequest(request._id, false)}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Reject
              </button>
            </div>
          )}

          {/* Status message for non-pending requests */}
          {request.status !== SwapRequestStatus.PENDING && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600">
                {request.status === SwapRequestStatus.ACCEPTED ? (
                  '✅ Swap completed successfully!'
                ) : (
                  '❌ Swap was rejected'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    );
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

  const pendingIncoming = incomingRequests.filter(req => req.status === SwapRequestStatus.PENDING);

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Swap Requests</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage incoming and outgoing slot swap requests.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('incoming')}
                className={`${
                  activeTab === 'incoming'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Incoming
                {pendingIncoming.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                    {pendingIncoming.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('outgoing')}
                className={`${
                  activeTab === 'outgoing'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Outgoing
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'incoming' ? (
            <div className="space-y-6">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No incoming requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    When someone wants to swap with your slots, they'll appear here.
                  </p>
                </div>
              ) : (
                incomingRequests.map((request) => (
                  <RequestCard key={request._id} request={request} isIncoming={true} />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {outgoingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No outgoing requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Swap requests you send to others will appear here.
                  </p>
                </div>
              ) : (
                outgoingRequests.map((request) => (
                  <RequestCard key={request._id} request={request} isIncoming={false} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Requests;