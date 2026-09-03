const crypto = require('crypto');

class RoomManager {
  constructor() {
    // Map of roomId -> room object
    this.rooms = new Map();
    // Map of socketId -> { roomId, user }
    this.socketMap = new Map();
    // Maximum messages cached per room
    this.maxMessagesPerRoom = 200;
    // Auto-purge messages older than 30 minutes (30 * 60 * 1000 ms)
    this.messageTtl = 30 * 60 * 1000;

    // Background interval to clean up expired messages every 30 seconds
    setInterval(() => {
      this.purgeExpiredMessages();
    }, 30 * 1000);
  }

  /**
   * Find a room by ID or Name (case-insensitive)
   */
  findRoom(roomIdOrName) {
    if (!roomIdOrName) return null;
    const clean = roomIdOrName.trim();
    const cleanUpper = clean.toUpperCase();
    if (this.rooms.has(cleanUpper)) {
      return this.rooms.get(cleanUpper);
    }
    if (this.rooms.has(clean)) {
      return this.rooms.get(clean);
    }
    const lower = clean.toLowerCase();
    for (const room of this.rooms.values()) {
      if (room.name && room.name.toLowerCase() === lower) {
        return room;
      }
    }
    return null;
  }

  /**
   * Purge messages older than 30 minutes from all rooms
   */
  purgeExpiredMessages() {
    const cutoff = Date.now() - this.messageTtl;
    for (const room of this.rooms.values()) {
      if (room.messages && room.messages.length > 0) {
        room.messages = room.messages.filter(m => m.timestamp >= cutoff);
      }
    }
  }

  /**
   * Hashes a room password with salt
   */
  hashPassword(password) {
    if (!password) return null;
    return crypto.createHash('sha256').update(password.trim()).digest('hex');
  }

  /**
   * Verify a provided password against the room's stored password hash
   */
  verifyPassword(room, password) {
    if (!room.hasPassword) return true;
    if (!password) return false;
    const inputHash = this.hashPassword(password);
    return room.passwordHash === inputHash;
  }

  /**
   * Create or retrieve a custom room
   */
  createRoom({
    roomId,
    name,
    password,
    isPrivate = false,
    hostUser = null,
    maxUsers = 50,
    allowAudioCalls = true,
    allowVideoCalls = true,
    allowMediaUploads = true,
    allowMemberChat = true
  }) {
    const cleanId = roomId.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toUpperCase();
    
    if (this.rooms.has(cleanId)) {
      const existing = this.rooms.get(cleanId);
      return { success: false, error: 'Room ID already exists. Please choose a different ID or join it directly.', room: existing };
    }

    const hasPassword = Boolean(password && password.trim().length > 0);
    const passwordHash = hasPassword ? this.hashPassword(password) : null;

    const room = {
      id: cleanId,
      name: name || cleanId,
      hasPassword,
      passwordHash,
      isCustom: true,
      isPrivate,
      maxUsers,
      allowAudioCalls: allowAudioCalls !== false,
      allowVideoCalls: allowVideoCalls !== false,
      allowMediaUploads: allowMediaUploads !== false,
      allowMemberChat: allowMemberChat !== false,
      createdAt: Date.now(),
      hostId: hostUser ? hostUser.id : null,
      hostName: hostUser ? hostUser.name : null,
      users: new Map(),
      callParticipants: new Map(),
      messages: [],
      typingUsers: new Set()
    };

    this.rooms.set(cleanId, room);
    return { success: true, room };
  }

  /**
   * Update settings for an existing room (Host only)
   */
  updateRoomSettings(roomId, hostUserId, settings = {}) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Verify user is the host
    if (room.hostId && room.hostId !== hostUserId) {
      return { success: false, error: 'Permission denied: Only the room host can update room settings' };
    }

    if (settings.name && settings.name.trim()) {
      room.name = settings.name.trim();
    }

    if (typeof settings.allowAudioCalls === 'boolean') {
      room.allowAudioCalls = settings.allowAudioCalls;
    }

    if (typeof settings.allowVideoCalls === 'boolean') {
      room.allowVideoCalls = settings.allowVideoCalls;
    }

    if (typeof settings.allowMediaUploads === 'boolean') {
      room.allowMediaUploads = settings.allowMediaUploads;
    }

    if (typeof settings.allowMemberChat === 'boolean') {
      room.allowMemberChat = settings.allowMemberChat;
    }

    if (typeof settings.maxUsers === 'number') {
      room.maxUsers = settings.maxUsers;
    }

    if (typeof settings.password === 'string') {
      const trimmedPwd = settings.password.trim();
      if (trimmedPwd) {
        room.hasPassword = true;
        room.passwordHash = this.hashPassword(trimmedPwd);
      } else {
        room.hasPassword = false;
        room.passwordHash = null;
      }
    }

    return { success: true, room: this.getRoomPublicInfo(roomId) };
  }

  /**
   * Get active group call state for a room
   */
  getRoomCallState(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || !room.callParticipants) {
      return { isLive: false, participants: [] };
    }
    return {
      isLive: room.callParticipants.size > 0,
      participantCount: room.callParticipants.size,
      participants: Array.from(room.callParticipants.values())
    };
  }

  /**
   * Add a participant to the room's group call
   */
  addCallParticipant(roomId, socketId, user, isVideo = true) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    if (!room.callParticipants) {
      room.callParticipants = new Map();
    }

    const participant = {
      socketId,
      id: user.id || socketId,
      name: user.name || 'Anonymous',
      avatar: user.avatar || user.name,
      isVideo,
      isMuted: false,
      isCameraOff: !isVideo,
      joinedAt: Date.now()
    };

    room.callParticipants.set(socketId, participant);
    return { 
      success: true, 
      participant, 
      callState: this.getRoomCallState(roomId),
      existingParticipants: Array.from(room.callParticipants.values()).filter(p => p.socketId !== socketId)
    };
  }

  /**
   * Remove a participant from the room's group call
   */
  removeCallParticipant(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || !room.callParticipants) return null;
    room.callParticipants.delete(socketId);
    return this.getRoomCallState(roomId);
  }

  /**
   * Get an existing room or create an auto-network room
   */
  getOrCreateAutoRoom(autoRoomData) {
    const { roomId, roomName, isLocal, networkType } = autoRoomData;
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        name: roomName,
        hasPassword: false,
        passwordHash: null,
        isCustom: false,
        isLocal,
        networkType,
        allowAudioCalls: true,
        allowVideoCalls: true,
        allowMediaUploads: true,
        createdAt: Date.now(),
        users: new Map(),
        callParticipants: new Map(),
        messages: [],
        typingUsers: new Set()
      });
    }

    return this.rooms.get(roomId);
  }

  /**
   * Get room metadata safe for client consumption
   */
  getRoomPublicInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      name: room.name,
      hasPassword: room.hasPassword,
      isCustom: room.isCustom || false,
      userCount: room.users.size,
      maxUsers: room.maxUsers || 50,
      createdAt: room.createdAt,
      hostId: room.hostId,
      hostName: room.hostName,
      allowAudioCalls: room.allowAudioCalls !== false,
      allowVideoCalls: room.allowVideoCalls !== false,
      allowMediaUploads: room.allowMediaUploads !== false,
      allowMemberChat: room.allowMemberChat !== false,
      activeCall: this.getRoomCallState(roomId)
    };
  }

  /**
   * Add a user to a room
   */
  addUser(socketId, roomId, user, password = '') {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room does not exist' };
    }

    if (room.hasPassword && !this.verifyPassword(room, password)) {
      return { success: false, error: 'Incorrect room password', requiresPassword: true };
    }

    if (room.maxUsers && room.users.size >= room.maxUsers) {
      return { success: false, error: 'Room is full' };
    }

    this.removeUser(socketId);

    const userData = {
      socketId,
      id: user.id || socketId,
      name: user.name || 'Anonymous',
      avatar: user.avatar || user.name || 'avatar',
      color: user.color || '#3b82f6',
      device: user.device || 'desktop',
      isHost: Boolean(room.hostId && (room.hostId === user.id || room.hostId === user.name || room.hostId === socketId)),
      joinedAt: Date.now()
    };

    room.users.set(socketId, userData);
    this.socketMap.set(socketId, { roomId, user: userData });

    return { success: true, room, user: userData };
  }

  /**
   * Remove user by socket ID
   */
  removeUser(socketId) {
    const mapping = this.socketMap.get(socketId);
    if (!mapping) return null;

    const { roomId, user } = mapping;
    const room = this.rooms.get(roomId);

    if (room) {
      room.users.delete(socketId);
      room.typingUsers.delete(user.name);
      if (room.callParticipants) {
        room.callParticipants.delete(socketId);
      }

      if (room.isCustom && room.users.size === 0) {
        setTimeout(() => {
          const current = this.rooms.get(roomId);
          if (current && current.users.size === 0) {
            this.rooms.delete(roomId);
          }
        }, 10 * 60 * 1000);
      }
    }

    this.socketMap.delete(socketId);
    return { 
      roomId, 
      user, 
      remainingUsers: room ? Array.from(room.users.values()) : [],
      callState: room ? this.getRoomCallState(roomId) : { isLive: false, participants: [] }
    };
  }

  /**
   * Add a message to a room
   */
  addMessage(roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const fullMessage = {
      id: message.id || crypto.randomUUID(),
      roomId,
      sender: message.sender,
      text: message.text || '',
      type: message.type || 'text',
      fileUrl: message.fileUrl || null,
      fileName: message.fileName || null,
      fileSize: message.fileSize || null,
      audioDuration: message.audioDuration || null,
      reactions: {},
      timestamp: Date.now()
    };

    room.messages.push(fullMessage);
    if (room.messages.length > this.maxMessagesPerRoom) {
      room.messages.shift();
    }

    return fullMessage;
  }

  /**
   * Add or toggle emoji reaction
   */
  toggleReaction(roomId, messageId, emoji, userName) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const msg = room.messages.find(m => m.id === messageId);
    if (!msg) return null;

    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [];
    }

    const idx = msg.reactions[emoji].indexOf(userName);
    if (idx > -1) {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(userName);
    }

    return { messageId, reactions: msg.reactions };
  }

  /**
   * Typing state updates
   */
  setTyping(roomId, userName, isTyping) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    if (isTyping) {
      room.typingUsers.add(userName);
    } else {
      room.typingUsers.delete(userName);
    }

    return Array.from(room.typingUsers);
  }

  /**
   * Get users in room
   */
  getUsers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.users.values());
  }

  /**
   * Get messages in room (filtering out anything older than 30 mins)
   */
  getMessages(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    const cutoff = Date.now() - this.messageTtl;
    room.messages = room.messages.filter(m => m.timestamp >= cutoff);
    return room.messages;
  }
}

module.exports = new RoomManager();
