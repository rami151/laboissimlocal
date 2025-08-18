"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { jwtDecode } from "jwt-decode";

interface User {
  id: string
  email: string
  name: string
  password: string
  role: "member" | "admin"
  status: "active" | "banned" | "pending"
  lastLogin?: string
  date_joined: string
  verified: boolean
}

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  category: string
  message: string
  status: "new" | "read" | "replied"
  createdAt: string
}

interface AccountRequest {
  id: string
  name: string
  email: string
  password: string
  reason: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

interface InternalMessage {
  id: string
  senderId: string
  receiverId: string
  subject: string
  message: string
  status: "unread" | "read"
  createdAt: string
  senderName: string
  receiverName: string
  replyToId?: string
  conversationId: string
}

interface AuthContextType {
  user: User | null
  users: User[]
  messages: ContactMessage[]
  accountRequests: AccountRequest[]
  internalMessages: InternalMessage[]
  connectedUsers: User[]
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  // Admin functions
  createUser: (userData: Omit<User, "id" | "createdAt">) => void
  banUser: (userId: string) => void
  unbanUser: (userId: string) => void
  deleteUser: (userId: string) => void
  updateUserRole: (userId: string, role: "member" | "admin") => void
  addMessage: (message: Omit<ContactMessage, "id" | "createdAt" | "status">) => void
  updateMessageStatus: (messageId: string, status: ContactMessage["status"]) => void
  addAccountRequest: (request: Omit<AccountRequest, "id" | "createdAt" | "status">) => void
  updateAccountRequest: (requestId: string, status: AccountRequest["status"]) => void
  // Internal messaging
  sendInternalMessage: (receiverId: string, subject: string, message: string, replyToId?: string) => void
  markMessageAsRead: (messageId: string) => void
  getConversation: (userId: string) => InternalMessage[]
  getConversations: () => { userId: string; userName: string; lastMessage: InternalMessage; unreadCount: number }[]
  getUnreadCount: (userId?: string) => number
  getNotifications: () => {
    newMessages: number
    pendingRequests: number
    unreadInternalMessages: number
  }
  setUserFromJWT: (token: string) => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([])
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>([])
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize with default data
    const defaultUsers: User[] = [
      {
        id: "1",
        email: "admin@research.com",
        name: "Administrateur",
        password: "admin123",
        role: "admin",
        status: "active",
        lastLogin: new Date().toISOString(),
        createdAt: "2023-01-01T00:00:00Z",
        verified: true,
      },
      {
        id: "2",
        email: "member@research.com",
        name: "Membre Test",
        password: "member123",
        role: "member",
        status: "active",
        lastLogin: new Date(Date.now() - 86400000).toISOString(),
        createdAt: "2023-06-01T00:00:00Z",
        verified: true,
      },
    ]

    const defaultMessages: ContactMessage[] = [
      {
        id: "1",
        name: "Dr. Marie Dupont",
        email: "marie.dupont@university.fr",
        subject: "Collaboration de recherche",
        category: "collaboration",
        message: "Bonjour, je suis intéressée par une collaboration sur vos travaux en IA éthique...",
        status: "new",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "2",
        name: "Jean Martin",
        email: "jean.martin@student.fr",
        subject: "Demande de stage",
        category: "stage",
        message: "Je suis étudiant en master et souhaiterais effectuer un stage dans votre laboratoire...",
        status: "read",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]

    const defaultRequests: AccountRequest[] = [
      {
        id: "1",
        name: "Dr. Sophie Laurent",
        email: "sophie.laurent@research.fr",
        password: "sophie123",
        reason: "Chercheuse en biotechnologie souhaitant rejoindre l'équipe",
        status: "pending",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ]

    const defaultInternalMessages: InternalMessage[] = [
      {
        id: "1",
        senderId: "2",
        receiverId: "1",
        subject: "Question sur le projet IA",
        message: "Bonjour, j'aurais quelques questions concernant le projet d'IA éthique...",
        status: "unread",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        senderName: "Membre Test",
        receiverName: "Administrateur",
        conversationId: "conv_1_2",
      },
    ]

    // Load from localStorage or use defaults
    const storedUsers = localStorage.getItem("users")
    const storedMessages = localStorage.getItem("messages")
    const storedRequests = localStorage.getItem("accountRequests")
    const storedInternalMessages = localStorage.getItem("internalMessages")

    setUsers(storedUsers ? JSON.parse(storedUsers) : defaultUsers)
    setMessages(storedMessages ? JSON.parse(storedMessages) : defaultMessages)
    setAccountRequests(storedRequests ? JSON.parse(storedRequests) : defaultRequests)
    setInternalMessages(storedInternalMessages ? JSON.parse(storedInternalMessages) : defaultInternalMessages)

    // Always check for JWT token and fetch user profile if present
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) {
      // Try to fetch user profile from backend
      fetch("http://localhost:8000/api/user/", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error("Invalid token");
          return res.json();
        })
        .then(userData => {
          const user: User = {
            id: userData.id.toString(),
            email: userData.email,
            name: userData.username,
            password: "",
            role: userData.is_staff || userData.is_superuser ? "admin" : "member",
            status: "active",
            lastLogin: new Date().toISOString(),
            date_joined: userData.date_joined || new Date().toISOString(),
            verified: true,
          };
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          setConnectedUsers([user]);
        })
        .catch(() => {
          setUser(null);
          setConnectedUsers([]);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      // Fallback: try to load user from localStorage (for demo/local mode)
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setConnectedUsers([userData]);
      }
      setLoading(false);
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:8000/api/token/email/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.access) {
        localStorage.setItem("token", data.access); // Store JWT token

        // Fetch user data from backend
        const userRes = await fetch("http://localhost:8000/api/user/", {
          headers: {
            "Authorization": `Bearer ${data.access}`,
          },
        });
        if (!userRes.ok) return false;
        const userData = await userRes.json();
        // Map backend user fields to frontend User type
        const user: User = {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.username,
          password: "",
          role: userData.is_staff || userData.is_superuser ? "admin" : "member",
          status: "active",
          lastLogin: new Date().toISOString(),
          date_joined: userData.date_joined || new Date().toISOString(),
          verified: true,
        };
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        setConnectedUsers([user]);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null)
    setConnectedUsers([])
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  const createUser = (userData: Omit<User, "id" | "date_joined">) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      date_joined: new Date().toISOString(),
      verified: true,
    }
    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
  }

  const banUser = (userId: string) => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, status: "banned" as const } : u))
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))

    if (user?.id === userId) {
      logout()
    }
  }

  const unbanUser = (userId: string) => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, status: "active" as const } : u))
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
  }

  const deleteUser = (userId: string) => {
    const updatedUsers = users.filter((u) => u.id !== userId)
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))

    if (user?.id === userId) {
      logout()
    }
  }

  const updateUserRole = (userId: string, role: "member" | "admin") => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, role } : u))
    setUsers(updatedUsers)
    localStorage.setItem("users", JSON.stringify(updatedUsers))

    if (user?.id === userId) {
      const updatedUser = { ...user, role }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const addMessage = (messageData: Omit<ContactMessage, "id" | "createdAt" | "status">) => {
    const newMessage: ContactMessage = {
      ...messageData,
      id: Date.now().toString(),
      status: "new",
      createdAt: new Date().toISOString(),
    }
    const updatedMessages = [newMessage, ...messages]
    setMessages(updatedMessages)
    localStorage.setItem("messages", JSON.stringify(updatedMessages))
  }

  const updateMessageStatus = (messageId: string, status: ContactMessage["status"]) => {
    const updatedMessages = messages.map((m) => (m.id === messageId ? { ...m, status } : m))
    setMessages(updatedMessages)
    localStorage.setItem("messages", JSON.stringify(updatedMessages))
  }

  const addAccountRequest = (requestData: Omit<AccountRequest, "id" | "createdAt" | "status">) => {
    const newRequest: AccountRequest = {
      ...requestData,
      id: Date.now().toString(),
      status: "pending",
      createdAt: new Date().toISOString(),
    }
    const updatedRequests = [newRequest, ...accountRequests]
    setAccountRequests(updatedRequests)
    localStorage.setItem("accountRequests", JSON.stringify(updatedRequests))
  }

  const updateAccountRequest = (requestId: string, status: AccountRequest["status"]) => {
    const updatedRequests = accountRequests.map((r) => (r.id === requestId ? { ...r, status } : r))
    setAccountRequests(updatedRequests)
    localStorage.setItem("accountRequests", JSON.stringify(updatedRequests))

    if (status === "approved") {
      const request = accountRequests.find((r) => r.id === requestId)
      if (request) {
        createUser({
          email: request.email,
          name: request.name,
          password: request.password,
          role: "member",
          status: "active",
          verified: true,
        })
      }
    }
  }

  const generateConversationId = (userId1: string, userId2: string) => {
    const sortedIds = [userId1, userId2].sort()
    return `conv_${sortedIds[0]}_${sortedIds[1]}`
  }

  const sendInternalMessage = (receiverId: string, subject: string, message: string, replyToId?: string) => {
    if (!user) return

    const receiver = users.find((u) => u.id === receiverId)
    if (!receiver) return

    const conversationId = generateConversationId(user.id, receiverId)

    const newMessage: InternalMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId,
      subject,
      message,
      status: "unread",
      createdAt: new Date().toISOString(),
      senderName: user.name,
      receiverName: receiver.name,
      replyToId,
      conversationId,
    }

    const updatedMessages = [newMessage, ...internalMessages]
    setInternalMessages(updatedMessages)
    localStorage.setItem("internalMessages", JSON.stringify(updatedMessages))
  }

  const markMessageAsRead = (messageId: string) => {
    const updatedMessages = internalMessages.map((m) => (m.id === messageId ? { ...m, status: "read" as const } : m))
    setInternalMessages(updatedMessages)
    localStorage.setItem("internalMessages", JSON.stringify(updatedMessages))
  }

  const getConversation = (userId: string) => {
    if (!user) return []
    const conversationId = generateConversationId(user.id, userId)
    return internalMessages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  const getConversations = () => {
    if (!user) return []

    const conversationMap = new Map<
      string,
      { userId: string; userName: string; lastMessage: InternalMessage; unreadCount: number }
    >()

    internalMessages
      .filter((m) => m.senderId === user.id || m.receiverId === user.id)
      .forEach((message) => {
        const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId
        const otherUserName = message.senderId === user.id ? message.receiverName : message.senderName

        if (
          !conversationMap.has(otherUserId) ||
          new Date(message.createdAt) > new Date(conversationMap.get(otherUserId)!.lastMessage.createdAt)
        ) {
          const unreadCount = internalMessages.filter(
            (m) => m.senderId === otherUserId && m.receiverId === user.id && m.status === "unread",
          ).length

          conversationMap.set(otherUserId, {
            userId: otherUserId,
            userName: otherUserName,
            lastMessage: message,
            unreadCount,
          })
        }
      })

    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime(),
    )
  }

  const getUnreadCount = (userId?: string) => {
    if (!user) return 0
    if (userId) {
      return internalMessages.filter((m) => m.senderId === userId && m.receiverId === user.id && m.status === "unread")
        .length
    }
    return internalMessages.filter((m) => m.receiverId === user.id && m.status === "unread").length
  }

  const getNotifications = () => {
    return {
      newMessages: messages.filter((m) => m.status === "new").length,
      pendingRequests: accountRequests.filter((r) => r.status === "pending").length,
      unreadInternalMessages: getUnreadCount(),
    }
  }

  const setUserFromJWT = useCallback((token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      // Map JWT fields to your User type as needed
      const user: User = {
        id: decoded.user_id?.toString() || decoded.sub || "",
        email: decoded.email || "",
        name: decoded.name || decoded.email?.split("@")[0] || "",
        password: "",
        role: "member", // You can adjust this if your JWT includes role
        status: "active",
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        verified: true,
      };
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      setConnectedUsers([user]);
    } catch (e) {
      // Invalid token
      setUser(null);
      setConnectedUsers([]);
      localStorage.removeItem("user");
    }
  }, [setUser, setConnectedUsers]);

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        messages,
        accountRequests,
        internalMessages,
        connectedUsers,
        login,
        logout,
        loading,
        createUser,
        banUser,
        unbanUser,
        deleteUser,
        updateUserRole,
        addMessage,
        updateMessageStatus,
        addAccountRequest,
        updateAccountRequest,
        sendInternalMessage,
        markMessageAsRead,
        getConversation,
        getConversations,
        getUnreadCount,
        getNotifications,
        setUserFromJWT, // Export this function
        setUser, // Export setUser for Google login
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
