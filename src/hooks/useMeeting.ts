"use client";

import { useState, useEffect, useCallback } from 'react';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'participant';
  joinedAt: string;
  isMuted: boolean;
  isVideoOff: boolean;
  hasScreenShare: boolean;
  isAudioOnly: boolean;
}

interface MeetingRoom {
  id: string;
  name: string;
  host: string;
  participantCount: number;
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
  isPrivate: boolean;
  settings: {
    allowScreenShare: boolean;
    allowChat: boolean;
    requirePassword: boolean;
    recordingEnabled: boolean;
  };
}

interface MeetingState {
  room: MeetingRoom | null;
  participants: Participant[];
  currentParticipant: Participant | null;
  isLoading: boolean;
  error: string | null;
}

export function useMeeting() {
  const [meetingState, setMeetingState] = useState<MeetingState>({
    room: null,
    participants: [],
    currentParticipant: null,
    isLoading: false,
    error: null
  });

  const createRoom = useCallback(async (roomName: string, hostName: string, isPrivate = false) => {
    setMeetingState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/meetings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, hostName, isPrivate })
      });

      const data = await response.json();
      if (data.success) {
        setMeetingState(prev => ({
          ...prev,
          room: data.room,
          isLoading: false
        }));
        return data.room;
      } else {
        throw new Error(data.error || 'Failed to create room');
      }
    } catch (error) {
      setMeetingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create room',
        isLoading: false
      }));
      return null;
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, userName: string, userAvatar?: string) => {
    setMeetingState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/meetings/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, userAvatar })
      });

      const data = await response.json();
      if (data.success) {
        setMeetingState(prev => ({
          ...prev,
          room: data.room,
          currentParticipant: data.participant,
          isLoading: false
        }));
        
        // Load participants
        await loadParticipants(roomId);
        return data;
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (error) {
      setMeetingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join room',
        isLoading: false
      }));
      return null;
    }
  }, []);

  const loadParticipants = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/meetings/${roomId}/participants`);
      const data = await response.json();
      if (data.success) {
        setMeetingState(prev => ({ ...prev, participants: data.participants }));
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  }, []);

  const leaveRoom = useCallback(async (roomId: string, userId: string) => {
    try {
      await fetch(`http://127.0.0.1:5000/api/meetings/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      setMeetingState({
        room: null,
        participants: [],
        currentParticipant: null,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  }, []);

  const updateParticipantStatus = useCallback(async (roomId: string, userId: string, status: {
    isMuted?: boolean;
    isVideoOff?: boolean;
    hasScreenShare?: boolean;
  }) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/meetings/${roomId}/participants/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status)
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setMeetingState(prev => ({
          ...prev,
          participants: prev.participants.map(p => 
            p.id === userId ? { ...p, ...data.participant } : p
          ),
          currentParticipant: prev.currentParticipant?.id === userId 
            ? { ...prev.currentParticipant, ...data.participant }
            : prev.currentParticipant
        }));
      }
    } catch (error) {
      console.error('Failed to update participant status:', error);
    }
  }, []);

  const getActiveRooms = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/meetings');
      const data = await response.json();
      return data.success ? data.rooms : [];
    } catch (error) {
      console.error('Failed to get active rooms:', error);
      return [];
    }
  }, []);

  return {
    ...meetingState,
    createRoom,
    joinRoom,
    leaveRoom,
    updateParticipantStatus,
    loadParticipants,
    getActiveRooms
  };
}
