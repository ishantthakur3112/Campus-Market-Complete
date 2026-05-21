import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// IMPORT YOUR CUSTOM AXIOS INSTANCE
import api, { API_BASE_URL } from "../config/api"; 

import "./ChatPage.css";

function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const token = localStorage.getItem("token");
  const fallbackUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = user || fallbackUser;
  const currentUserId = currentUser?._id || currentUser?.id || "";

  const preselectedConversationId = location.state?.conversationId;

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedConversationIdRef = useRef(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?._id || null;
  }, [selectedConversation]);

  const formatTime = useCallback((value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  const getOtherParticipant = useCallback(
    (conversation) =>
      conversation?.participants?.find((participant) => {
        const participantId = participant?._id || participant?.id;
        return participantId !== currentUserId;
      }),
    [currentUserId]
  );

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aTime = new Date(a.lastMessageAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.lastMessageAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [conversations]);

  const fetchConversations = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingConversations(true);

      // CHANGED: Using unified api client instance for automated token header mapping
      const res = await api.get("/api/chat/conversations");
      const data = res.data;

      const safeData = Array.isArray(data) ? data : [];
      setConversations(safeData);

      if (preselectedConversationId) {
        const matchedConversation = safeData.find(
          (conversation) => conversation._id === preselectedConversationId
        );

        if (matchedConversation) {
          setSelectedConversation(matchedConversation);
          return;
        }
      }

      setSelectedConversation((prev) => {
        if (prev?._id) {
          const stillExists = safeData.find((item) => item._id === prev._id);
          if (stillExists) return stillExists;
        }
        return safeData[0] || null;
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, [token, preselectedConversationId]);

  const fetchMessages = useCallback(
    async (conversationId) => {
      if (!token || !conversationId) return;

      try {
        setLoadingMessages(true);

        // CHANGED: Transitioned message array fetches to clean custom api Axios method
        const res = await api.get(`/api/chat/conversations/${conversationId}/messages`);

        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [token]
  );

  const updateConversationPreview = useCallback((message) => {
    setConversations((prev) => {
      const exists = prev.some(
        (conversation) => conversation._id === message.conversationId
      );

      if (!exists) return prev;

      return prev.map((conversation) =>
        conversation._id === message.conversationId
          ? {
              ...conversation,
              lastMessage: message.text,
              lastMessageAt: message.createdAt,
              updatedAt: message.createdAt,
            }
          : conversation
      );
    });
  }, []);

  const handleSelectConversation = useCallback((conversation) => {
    if (!conversation?._id) return;
    setSelectedConversation(conversation);
  }, []);

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();

      const trimmedText = messageText.trim();
      const activeConversationId = selectedConversation?._id;

      if (!trimmedText || !activeConversationId || sendingMessage) return;

      try {
        setSendingMessage(true);

        // CHANGED: Using custom instance for real-time outbound message payloads
        const res = await api.post("/api/chat/messages", {
          conversationId: activeConversationId,
          text: trimmedText,
        });

        const data = res.data;
        setMessageText("");

        setMessages((prev) => {
          const exists = prev.some((msg) => msg._id === data._id);
          if (exists) return prev;
          return [...prev, data];
        });

        updateConversationPreview({
          conversationId: activeConversationId,
          text: data.text,
          createdAt: data.createdAt,
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not send message");
      } finally {
        setSendingMessage(false);
      }
    },
    [
      messageText,
      selectedConversation?._id,
      sendingMessage,
      token,
      updateConversationPreview,
    ]
  );

  useEffect(() => {
    if (!token || !isLoggedIn) return;
    fetchConversations();
  }, [token, isLoggedIn, fetchConversations]);

  useEffect(() => {
    if (!token || !isLoggedIn) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    const handleNewMessage = (newMessage) => {
      updateConversationPreview(newMessage);

      if (newMessage.conversationId !== selectedConversationIdRef.current) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    };

    const handleConversationUpdated = ({
      conversationId,
      lastMessage,
      createdAt,
    }) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === conversationId
            ? {
                ...conversation,
                lastMessage,
                lastMessageAt: createdAt || new Date().toISOString(),
                updatedAt: createdAt || new Date().toISOString(),
              }
            : conversation
        )
      );
    };

    socket.on("new-message", handleNewMessage);
    socket.on("conversation-updated", handleConversationUpdated);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("conversation-updated", handleConversationUpdated);
      socket.disconnect();
    };
  }, [token, isLoggedIn, updateConversationPreview]);

  useEffect(() => {
    const conversationId = selectedConversation?._id;
    const socket = socketRef.current;

    if (!conversationId || !socket) return;

    fetchMessages(conversationId);
    socket.emit("join-conversation", conversationId);

    return () => {
      socket.emit("leave-conversation", conversationId);
    };
  }, [selectedConversation?._id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length]);

  if (!token || !isLoggedIn) {
    return (
      <main className="chat-page">
        <div className="chat-empty-state">
          <h2>Please login to access chat</h2>
          <p>You need an account before you can message sellers.</p>
          <button type="button" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="chat-page">
      <div className="chat-layout">
        <aside className="chat-sidebar" aria-label="Conversation list">
          <div className="chat-sidebar-header">
            <p className="chat-tag">MESSAGES</p>
            <h2>Your Chats</h2>
          </div>

          {loadingConversations ? (
            <p className="chat-info">Loading conversations...</p>
          ) : sortedConversations.length === 0 ? (
            <p className="chat-info">No conversations yet.</p>
          ) : (
            <div className="conversation-list">
              {sortedConversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);

                return (
                  <button
                    key={conversation._id}
                    type="button"
                    className={`conversation-item ${
                      selectedConversation?._id === conversation._id
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                    aria-pressed={
                      selectedConversation?._id === conversation._id
                    }
                  >
                    <div className="conversation-avatar" aria-hidden="true">
                      {otherUser?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div className="conversation-content">
                      <div className="conversation-top">
                        <h3>{otherUser?.name || "User"}</h3>
                        <span className="conversation-time">
                          {formatTime(
                            conversation.lastMessageAt || conversation.updatedAt
                          )}
                        </span>
                      </div>
                      <p>{conversation.lastMessage || "Start chatting"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="chat-main">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div>
                  <p className="chat-tag">PRIVATE CHAT</p>
                  <h2>
                    {getOtherParticipant(selectedConversation)?.name ||
                      "Conversation"}
                  </h2>
                </div>
              </div>

              <div className="messages-box" aria-live="polite">
                {loadingMessages ? (
                  <p className="chat-info">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="chat-info">
                    No messages yet. Start the conversation.
                  </p>
                ) : (
                  messages.map((message) => {
                    const senderId =
                      message.sender?._id || message.sender?.id || message.sender;

                    const isOwnMessage = senderId === currentUserId;

                    return (
                      <div
                        key={message._id}
                        className={`message-row ${
                          isOwnMessage ? "own" : "other"
                        }`}
                      >
                        <div className="message-bubble">
                          <p>{message.text}</p>
                          <span>{formatTime(message.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !messageText.trim()}
                >
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <h2>Select a conversation</h2>
              <p>Your messages will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ChatPage;