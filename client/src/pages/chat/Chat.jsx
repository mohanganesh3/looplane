import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import chatService from '../../services/chatService';
import { LoadingSpinner, Alert } from '../../components/common';

const Chat = () => {
  const { user } = useAuth();
  const { socket, isConnected, joinRoom, leaveRoom, sendMessage, markAsRead, sendTyping, isUserOnline } = useSocket();
  const [searchParams] = useSearchParams();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();

    // Check if we need to open a specific conversation
    const userId = searchParams.get('userId');
    if (userId) {
      openConversationWithUser(userId);
    }
  }, [searchParams]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // New message received
    socket.on('message:new', (message) => {
      if (message.conversationId === activeConversation?._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        markAsRead(message.conversationId);
      }
      // Update conversations list
      updateConversationLastMessage(message);
    });

    // Typing indicator
    socket.on('user:typing', ({ conversationId, userId, isTyping }) => {
      if (conversationId === activeConversation?._id) {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: isTyping
        }));
      }
    });

    // Message read
    socket.on('message:read', ({ conversationId, userId }) => {
      if (conversationId === activeConversation?._id) {
        setMessages(prev => prev.map(msg => ({
          ...msg,
          read: true
        })));
      }
    });

    return () => {
      socket.off('message:new');
      socket.off('user:typing');
      socket.off('message:read');
    };
  }, [socket, activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join/leave rooms when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      joinRoom(activeConversation._id);
      markAsRead(activeConversation._id);
    }
    return () => {
      if (activeConversation) {
        leaveRoom(activeConversation._id);
      }
    };
  }, [activeConversation?._id]);

  const fetchConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const openConversationWithUser = async (userId) => {
    try {
      const data = await chatService.getOrCreateConversation(userId);
      setActiveConversation(data.conversation);
      fetchMessages(data.conversation._id);
    } catch (err) {
      setError('Failed to open conversation');
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data.messages || []);
    } catch (err) {
      setError('Failed to load messages');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateConversationLastMessage = (message) => {
    setConversations(prev => prev.map(conv => 
      conv._id === message.conversationId
        ? { ...conv, lastMessage: message, updatedAt: new Date() }
        : conv
    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      const data = await chatService.sendMessage(activeConversation._id, messageContent);
      setMessages(prev => [...prev, data.message]);
      sendMessage(activeConversation._id, data.message);
      updateConversationLastMessage(data.message);
    } catch (err) {
      setError('Failed to send message');
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = useCallback((e) => {
    setNewMessage(e.target.value);

    if (activeConversation && isConnected) {
      sendTyping(activeConversation._id, true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(activeConversation._id, false);
      }, 2000);
    }
  }, [activeConversation, isConnected, sendTyping]);

  const selectConversation = (conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation._id);
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p._id !== user?._id);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading chats..." />;
  }

  return (
    <div className="pt-16 h-screen flex bg-gray-100">
      {/* Conversations Sidebar */}
      <ConversationsList
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={selectConversation}
        getOtherParticipant={getOtherParticipant}
        isUserOnline={isUserOnline}
        currentUserId={user?._id}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <ChatHeader 
              participant={getOtherParticipant(activeConversation)}
              isOnline={isUserOnline(getOtherParticipant(activeConversation)?._id)}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message._id || index}
                  message={message}
                  isOwn={message.sender?._id === user?._id || message.sender === user?._id}
                />
              ))}
              
              {/* Typing Indicator */}
              {Object.values(typingUsers).some(Boolean) && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput
              value={newMessage}
              onChange={handleTyping}
              onSubmit={handleSendMessage}
              disabled={sendingMessage}
            />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>

      {error && (
        <div className="absolute bottom-4 right-4">
          <Alert type="error" message={error} onClose={() => setError('')} />
        </div>
      )}
    </div>
  );
};

// Conversations List Component
const ConversationsList = ({ conversations, activeConversation, onSelectConversation, getOtherParticipant, isUserOnline, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv => {
    const participant = getOtherParticipant(conv);
    const name = `${participant?.firstName || ''} ${participant?.lastName || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-80 bg-white border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <i className="fas fa-comments text-emerald-500 mr-2"></i>
          Messages
        </h2>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <i className="fas fa-inbox text-4xl mb-2"></i>
            <p>No conversations yet</p>
          </div>
        ) : (
          filteredConversations.map(conversation => {
            const participant = getOtherParticipant(conversation);
            const isActive = activeConversation?._id === conversation._id;
            const isOnline = isUserOnline(participant?._id);

            return (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={`flex items-center p-4 cursor-pointer transition border-b ${
                  isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <img
                    src={participant?.profilePhoto || '/images/default-avatar.png'}
                    alt={participant?.firstName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {participant?.firstName} {participant?.lastName?.charAt(0)}.
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessage?.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage?.content || 'Start a conversation'}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="ml-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">{conversation.unreadCount}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Chat Header Component
const ChatHeader = ({ participant, isOnline }) => {
  return (
    <div className="bg-white border-b p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="relative">
          <img
            src={participant?.profilePhoto || '/images/default-avatar.png'}
            alt={participant?.firstName}
            className="w-10 h-10 rounded-full object-cover"
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div className="ml-3">
          <h3 className="font-semibold text-gray-800">
            {participant?.firstName} {participant?.lastName?.charAt(0)}.
          </h3>
          <p className="text-sm text-gray-500">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-500 hover:text-emerald-500 rounded-full hover:bg-gray-100">
          <i className="fas fa-phone"></i>
        </button>
        <button className="p-2 text-gray-500 hover:text-emerald-500 rounded-full hover:bg-gray-100">
          <i className="fas fa-ellipsis-v"></i>
        </button>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-emerald-500 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`flex items-center mt-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : ''}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            <i className={`fas fa-check${message.read ? '-double text-blue-500' : ''} ml-1`}></i>
          )}
        </div>
      </div>
    </div>
  );
};

// Message Input Component
const MessageInput = ({ value, onChange, onSubmit, disabled }) => {
  return (
    <form onSubmit={onSubmit} className="bg-white border-t p-4">
      <div className="flex items-center space-x-3">
        <button type="button" className="p-2 text-gray-500 hover:text-emerald-500 rounded-full hover:bg-gray-100">
          <i className="fas fa-paperclip"></i>
        </button>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </form>
  );
};

// Empty Chat Component
const EmptyChat = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-comments text-gray-400 text-4xl"></i>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Messages</h3>
        <p className="text-gray-500">Select a conversation to start chatting</p>
      </div>
    </div>
  );
};

// Helper function to format time
const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export default Chat;
