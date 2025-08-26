"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  MessageSquare,
  UserPlus,
  Settings,
  BarChart3,
  Shield,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Save,
  Activity,
  UserCheck,
  Mail,
  Send,
  Clock,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useContentManager, type SiteContent } from "@/lib/content-manager";

interface Project {
  id: string;
  title: string;
  description: string;
  objectives: string;
  methodology: string;
  results: string;
  start_date: string;
  end_date: string;
  team: string;
  funding: string;
  funding_company: string;
  funding_amount: string;
  image: string | null;
  created_by: {
    id: string;
    name: string;
  };
  members: Array<{
    id: string;
    name: string;
  }>;
  is_validated: boolean;
  created_at: string;
  updated_at: string;
}

interface DeletionRequest {
  id: string;
  project: number; // backend returns project id
  project_title?: string; // convenience from serializer
  requested_by: {
    id: string | number;
    username?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
  reason: string;
  admin_notes: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: {
    id: string | number;
    username?: string;
    full_name?: string;
  } | null;
}

export default function AdminPage() {
  const auth = useAuth();
  const {
    user,
    loading,
    users = [],
    messages = [],
    accountRequests = [],
    internalMessages = [],
    connectedUsers = [],
    banUser,
    unbanUser,
    deleteUser,
    updateUserRole,
    updateMessageStatus,
    updateAccountRequest,
    sendInternalMessage,
    markMessageAsRead,
    getConversation,
    getUnreadCount = () => 0,
  } = auth || {};
  const { content, updateContent } = useContentManager();
  const [editingContent, setEditingContent] = useState<SiteContent>(content);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messageForm, setMessageForm] = useState({ subject: "", message: "" });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectToReject, setProjectToReject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loadingDeletionRequests, setLoadingDeletionRequests] = useState(false);
  const [deletionRequestsError, setDeletionRequestsError] = useState<string>("");
  const [selectedDeletionRequest, setSelectedDeletionRequest] = useState<DeletionRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  // Validation UI enhancements state
  const [validationTab, setValidationTab] = useState<"pending" | "validated">("pending");
  const [validationSearch, setValidationSearch] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [approvalMode, setApprovalMode] = useState<"creation" | "deletion">("creation");
  const [deletionSearch, setDeletionSearch] = useState("");
  const [selectedDeletionIds, setSelectedDeletionIds] = useState<string[]>([]);
  const isCreationMode = approvalMode === 'creation';
  const isDeletionMode = approvalMode === 'deletion';
  const router = useRouter();

  useEffect(() => {
    if (
      !loading &&
      (
        !user || !(
          user.role === "admin" || (user as any).is_staff || (user as any).is_superuser
        )
      )
    ) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === "admin" || (user as any).is_staff || (user as any).is_superuser)) {
      fetchProjects();
      fetchDeletionRequests();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === "admin" || (user as any).is_staff || (user as any).is_superuser;
    if (!isAdmin) return;
    if (activeTab === "deletion-requests" || activeTab === "settings") {
      fetchDeletionRequests();
    }
  }, [user, activeTab]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      // Try both possible token keys
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (!accessToken) {
        console.error('No authentication token found');
        setLoadingProjects(false);
        return;
      }

      console.log('Fetching projects with token:', accessToken.substring(0, 20) + '...');
      
      // First, let's test if the API is accessible
      try {
        const testResponse = await fetch('/api/projects/public');
        console.log('Public projects test response:', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Public projects available:', testData.length);
        }
      } catch (testError) {
        console.log('Public projects test failed:', testError);
      }
      
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Projects data received:', data);
        console.log('Number of projects:', data.length);
        setProjects(data);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        console.error('Response status:', response.status);
        
        // Try to get more details about the error
        if (response.status === 401) {
          console.error('Authentication failed - token might be invalid');
        } else if (response.status === 403) {
          console.error('Permission denied - user might not have admin access');
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const toggleSelectProject = (projectId: string) => {
    setSelectedProjectIds(prev => prev.includes(projectId)
      ? prev.filter(id => id !== projectId)
      : [...prev, projectId]
    );
  };

  const selectAllPendingFiltered = () => {
    const ids = projects
      .filter(p => !p.is_validated)
      .filter(p => {
        if (!validationSearch.trim()) return true;
        const q = validationSearch.toLowerCase();
        const fields = [
          p.title,
          p.description,
          p.objectives,
          p.created_by?.name,
        ].filter(Boolean) as string[];
        return fields.some(f => f.toLowerCase().includes(q));
      })
      .map(p => p.id);
    setSelectedProjectIds(ids);
  };

  const clearSelected = () => setSelectedProjectIds([]);

  const bulkValidateSelected = async () => {
    if (selectedProjectIds.length === 0) return;
    const confirmMsg = `Approuver ${selectedProjectIds.length} projet(s) ?`;
    if (!confirm(confirmMsg)) return;
    for (const id of selectedProjectIds) {
      // sequential to avoid API rate issues; UI is small scale
      // eslint-disable-next-line no-await-in-loop
      await validateProject(id);
    }
    clearSelected();
    setSuccessMessage(`${selectedProjectIds.length} projet(s) approuvés.`);
    setTimeout(() => setSuccessMessage("") , 2500);
  };

  const validateProject = async (projectId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (!accessToken) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ is_validated: true }),
      });
      
      console.log('Validate project response status:', response.status);
      
      if (response.ok) {
        // Update local state
        setProjects(prev => prev.map(project => 
          project.id === projectId 
            ? { ...project, is_validated: true }
            : project
        ));
        setSuccessMessage("Projet validé avec succès !");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        const errorText = await response.text();
        console.error('Error validating project:', errorText);
      }
    } catch (error) {
      console.error('Error validating project:', error);
    }
  };

  const rejectProject = async (projectId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (!accessToken) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      console.log('Reject project response status:', response.status);
      
      if (response.ok) {
        // Remove from local state
        setProjects(prev => prev.filter(project => project.id !== projectId));
        setSuccessMessage("Projet rejeté avec succès !");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        const errorText = await response.text();
        console.error('Error rejecting project:', errorText);
      }
    } catch (error) {
      console.error('Error rejecting project:', error);
    }
  };

  const updateProject = async (project: Project) => {
    try {
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (!accessToken) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          objectives: project.objectives,
          methodology: project.methodology,
          results: project.results,
          start_date: project.start_date,
          end_date: project.end_date,
          funding: project.funding,
          funding_company: project.funding_company,
          funding_amount: project.funding_amount,
          is_validated: project.is_validated,
        }),
      });
      
      console.log('Update project response status:', response.status);
      
      if (response.ok) {
        // Update local state
        setProjects(prev => prev.map(p => 
          p.id === project.id ? project : p
        ));
        setSuccessMessage("Projet modifié avec succès !");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        const errorText = await response.text();
        console.error('Error updating project:', errorText);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const fetchDeletionRequests = async () => {
    setLoadingDeletionRequests(true);
    try {
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (!accessToken) {
        console.error('No authentication token found');
        setLoadingDeletionRequests(false);
        return;
      }

      const response = await fetch('/api/project-deletion-requests', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeletionRequests(data);
        setDeletionRequestsError("");
      } else {
        const text = await response.text();
        console.error('Error fetching deletion requests:', response.status, text);
        setDeletionRequestsError(`Erreur serveur (${response.status}) lors du chargement des demandes`);
      }
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      setDeletionRequestsError('Erreur de connexion au serveur');
    } finally {
      setLoadingDeletionRequests(false);
    }
  };

  const approveDeletionRequest = async (requestId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (!accessToken) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/project-deletion-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          admin_notes: adminNotes
        }),
      });
      
      if (response.ok) {
        setSuccessMessage("Demande de suppression approuvée et projet supprimé !");
        setTimeout(() => setSuccessMessage(""), 5000);
        fetchDeletionRequests(); // Refresh the list
        setAdminNotes("");
        setSelectedDeletionRequest(null);
      } else {
        const errorData = await response.json();
        console.error('Error approving deletion request:', errorData);
      }
    } catch (error) {
      console.error('Error approving deletion request:', error);
    }
  };

  const rejectDeletionRequest = async (requestId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (!accessToken) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/project-deletion-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          admin_notes: adminNotes
        }),
      });
      
      if (response.ok) {
        setSuccessMessage("Demande de suppression rejetée !");
        setTimeout(() => setSuccessMessage(""), 5000);
        fetchDeletionRequests(); // Refresh the list
        setAdminNotes("");
        setSelectedDeletionRequest(null);
      } else {
        const errorData = await response.json();
        console.error('Error rejecting deletion request:', errorData);
      }
    } catch (error) {
      console.error('Error rejecting deletion request:', error);
    }
  };

  const toggleSelectDeletion = (requestId: string) => {
    setSelectedDeletionIds(prev => prev.includes(requestId)
      ? prev.filter(id => id !== requestId)
      : [...prev, requestId]
    );
  };

  const selectAllDeletionFiltered = () => {
    const ids = deletionRequests
      .filter(req => req.status === 'pending')
      .filter(req => {
        if (!deletionSearch.trim()) return true;
        const q = deletionSearch.toLowerCase();
        const fields = [
          req.project_title,
          req.requested_by?.full_name,
          req.requested_by?.username,
          req.reason,
        ].filter(Boolean) as string[];
        return fields.some(f => f.toLowerCase().includes(q));
      })
      .map(req => req.id as unknown as string);
    setSelectedDeletionIds(ids);
  };

  const clearSelectedDeletion = () => setSelectedDeletionIds([]);

  const bulkApproveDeletion = async () => {
    if (selectedDeletionIds.length === 0) return;
    const confirmMsg = `Approuver ${selectedDeletionIds.length} demande(s) de suppression ?`;
    if (!confirm(confirmMsg)) return;
    for (const id of selectedDeletionIds) {
      // eslint-disable-next-line no-await-in-loop
      await approveDeletionRequest(id as unknown as string);
    }
    clearSelectedDeletion();
    setSuccessMessage(`${selectedDeletionIds.length} demande(s) approuvées.`);
    setTimeout(() => setSuccessMessage("") , 2500);
  };

  const bulkRejectDeletion = async () => {
    if (selectedDeletionIds.length === 0) return;
    const confirmMsg = `Rejeter ${selectedDeletionIds.length} demande(s) de suppression ?`;
    if (!confirm(confirmMsg)) return;
    for (const id of selectedDeletionIds) {
      // eslint-disable-next-line no-await-in-loop
      await rejectDeletionRequest(id as unknown as string);
    }
    clearSelectedDeletion();
    setSuccessMessage(`${selectedDeletionIds.length} demande(s) rejetées.`);
    setTimeout(() => setSuccessMessage("") , 2500);
  };

  if (loading) {
    return null; // or a spinner
  }
  if (!user || !(user.role === "admin" || (user as any).is_staff || (user as any).is_superuser)) {
    return null;
  }

  const handleContentSave = () => {
    if (typeof updateContent === 'function') {
      updateContent(editingContent);
    }
  };

  const handleInputChange = (
    section: keyof SiteContent,
    field: string,
    value: string | number
  ) => {
    setEditingContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSendMessage = () => {
    if (selectedUser && messageForm.subject && messageForm.message && typeof sendInternalMessage === 'function') {
      sendInternalMessage(
        selectedUser,
        messageForm.subject,
        messageForm.message
      );
      setMessageForm({ subject: "", message: "" });
      setSelectedUser(null);
    }
  };

  const stats = {
    totalUsers: users?.length || 0,
    activeUsers: users?.filter((u) => u.status === "active")?.length || 0,
    bannedUsers: users?.filter((u) => u.status === "banned")?.length || 0,
    newMessages: messages?.filter((m) => m.status === "new")?.length || 0,
    pendingRequests: accountRequests?.filter((r) => r.status === "pending")?.length || 0,
    connectedNow: connectedUsers?.length || 0,
    unreadInternalMessages: typeof getUnreadCount === 'function' ? getUnreadCount() : 0,
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  };

  return (
   
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gradient heading-modern mb-2">
                Administration
              </h1>
              <p className="text-professional">
                Gestion complète de la plateforme
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="gradient-primary text-white px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Administrateur
              </Badge>
              {stats.unreadInternalMessages > 0 && (
                <Badge className="bg-red-500 text-white px-3 py-1">
                  {stats.unreadInternalMessages} nouveaux messages
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-8 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-xl p-1">
            <TabsTrigger
              value="dashboard"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="flex items-center space-x-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Demandes</span>
            </TabsTrigger>
            <TabsTrigger
              value="internal"
              className="flex items-center space-x-2"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Messagerie</span>
              {stats.unreadInternalMessages > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                  {stats.unreadInternalMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Contenu</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Validation Projets</span>
            </TabsTrigger>
            {/* Deletion requests tab removed; integrated into Validation Projets */}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <motion.div
              variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  {
                    label: "Utilisateurs",
                    value: stats.totalUsers,
                    icon: Users,
                    color: "indigo",
                  },
                  {
                    label: "Actifs",
                    value: stats.activeUsers,
                    icon: Activity,
                    color: "green",
                  },
                  {
                    label: "Bannis",
                    value: stats.bannedUsers,
                    icon: Ban,
                    color: "red",
                  },
                  {
                    label: "Messages",
                    value: stats.newMessages,
                    icon: MessageSquare,
                    color: "blue",
                    notification: stats.newMessages > 0,
                  },
                  {
                    label: "Demandes",
                    value: stats.pendingRequests,
                    icon: UserPlus,
                    color: "amber",
                    notification: stats.pendingRequests > 0,
                  },
                  {
                    label: "Connectés",
                    value: stats.connectedNow,
                    icon: Activity,
                    color: "purple",
                  },
                  {
                    label: "Messagerie",
                    value: stats.unreadInternalMessages,
                    icon: Mail,
                    color: "red",
                    notification: stats.unreadInternalMessages > 0,
                  },
                ].map((stat, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="card-professional border-0 shadow-lg hover-lift relative">
                      {stat.notification && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                      <CardContent className="p-4 text-center">
                        <div
                          className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mx-auto mb-3`}
                        >
                          <stat.icon
                            className={`h-6 w-6 text-${stat.color}-600`}
                          />
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                          {stat.value}
                        </div>
                        <div className="text-sm text-slate-600">
                          {stat.label}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="card-professional border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
                      Messages récents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {messages.slice(0, 3).map((message) => (
                        <div
                          key={message.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-slate-800">
                              {message.name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {message.subject}
                            </p>
                          </div>
                          <Badge
                            className={
                              message.status === "new"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {message.status === "new" ? "Nouveau" : "Lu"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-professional border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserPlus className="h-5 w-5 mr-2 text-amber-600" />
                      Demandes de compte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {accountRequests.slice(0, 3).map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-slate-800">
                              {request.name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {request.email}
                            </p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700">
                            En attente
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Deletion Requests Tab removed - integrated into Validation Projets */}

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Gestion des utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            userItem.status === "active"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          <Users
                            className={`h-5 w-5 ${
                              userItem.status === "active"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {userItem.name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {userItem.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              className={
                                userItem.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : userItem.role === "chef_d_equipe"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
                              }
                            >
                              {userItem.role === "admin"
                                ? "Admin"
                                : userItem.role === "chef_d_equipe"
                                ? "Chef d'équipe"
                                : "Membre"}
                            </Badge>

                            <Badge
                              className={
                                userItem.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }
                            >
                              {userItem.status === "active" ? "Actif" : "Banni"}
                            </Badge>
                            {userItem.verified && (
                              <Badge className="bg-blue-100 text-blue-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Vérifié
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(userItem.id)}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Select
                          value={userItem.role}
                          onValueChange={(
                            role: "member" | "admin" | "chef_d_equipe"
                          ) => updateUserRole(userItem.id, role)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Membre</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="chef_d_equipe">
                              Chef d'équipe
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {userItem.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => banUser(userItem.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unbanUser(userItem.id)}
                            className="border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(userItem.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Modal */}
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedUser(null)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-xl p-6 w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold mb-4">
                    Envoyer un message à{" "}
                    {users.find((u) => u.id === selectedUser)?.name}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Sujet</Label>
                      <Input
                        id="subject"
                        value={messageForm.subject}
                        onChange={(e) =>
                          setMessageForm((prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                        placeholder="Sujet du message"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={messageForm.message}
                        onChange={(e) =>
                          setMessageForm((prev) => ({
                            ...prev,
                            message: e.target.value,
                          }))
                        }
                        placeholder="Votre message..."
                        rows={4}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSendMessage}
                        className="btn-modern text-white flex-1"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedUser(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
                  Messages reçus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-800">
                            {message.name}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {message.email}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              message.status === "new"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {message.status === "new"
                              ? "Nouveau"
                              : message.status === "read"
                              ? "Lu"
                              : "Répondu"}
                          </Badge>
                          <Badge variant="outline">{message.category}</Badge>
                        </div>
                      </div>
                      <h5 className="font-medium text-slate-800 mb-2">
                        {message.subject}
                      </h5>
                      <p className="text-slate-700 mb-4">{message.message}</p>
                      <div className="flex items-center space-x-2">
                        {message.status === "new" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateMessageStatus(message.id, "read")
                            }
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Marquer comme lu
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateMessageStatus(message.id, "replied")
                          }
                          className="border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Marquer comme répondu
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Requests Tab */}
          <TabsContent value="requests">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-amber-600" />
                  Demandes de compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accountRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-800">
                            {request.name}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {request.email}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            request.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : request.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {request.status === "pending"
                            ? "En attente"
                            : request.status === "approved"
                            ? "Approuvé"
                            : "Rejeté"}
                        </Badge>
                      </div>
                      <p className="text-slate-700 mb-4">{request.reason}</p>
                      {request.status === "pending" && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              updateAccountRequest(request.id, "approved")
                            }
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAccountRequest(request.id, "rejected")
                            }
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Internal Messaging Tab */}
          <TabsContent value="internal">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-indigo-600" />
                  Messagerie interne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {internalMessages
                    .filter(
                      (m) => m.receiverId === user.id || m.senderId === user.id
                    )
                    .map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg ${
                          message.status === "unread" &&
                          message.receiverId === user.id
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-slate-800">
                              {message.senderId === user.id
                                ? `À: ${message.receiverName}`
                                : `De: ${message.senderName}`}
                            </h4>
                            <p className="text-sm text-slate-500">
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {message.status === "unread" &&
                              message.receiverId === user.id && (
                                <Badge className="bg-red-100 text-red-700">
                                  Non lu
                                </Badge>
                              )}
                            {message.senderId === user.id && (
                              <Badge className="bg-blue-100 text-blue-700">
                                Envoyé
                              </Badge>
                            )}
                          </div>
                        </div>
                        <h5 className="font-medium text-slate-800 mb-2">
                          {message.subject}
                        </h5>
                        <p className="text-slate-700 mb-4">{message.message}</p>
                        {message.status === "unread" &&
                          message.receiverId === user.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markMessageAsRead(message.id)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Marquer comme lu
                            </Button>
                          )}
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Edit className="h-5 w-5 mr-2 text-indigo-600" />
                    Gestion du contenu
                  </div>
                  <Button
                    onClick={handleContentSave}
                    className="btn-modern text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="hero" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="hero">Accueil</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                    <TabsTrigger value="about">À propos</TabsTrigger>
                    <TabsTrigger value="team">Équipe</TabsTrigger>
                    <TabsTrigger value="expertise">Expertise</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="hero" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hero-title">Titre principal</Label>
                        <Input
                          id="hero-title"
                          value={editingContent.hero.title}
                          onChange={(e) =>
                            handleInputChange("hero", "title", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hero-subtitle">Sous-titre</Label>
                        <Input
                          id="hero-subtitle"
                          value={editingContent.hero.subtitle}
                          onChange={(e) =>
                            handleInputChange(
                              "hero",
                              "subtitle",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="hero-description">Description</Label>
                      <Textarea
                        id="hero-description"
                        value={editingContent.hero.description}
                        onChange={(e) =>
                          handleInputChange(
                            "hero",
                            "description",
                            e.target.value
                          )
                        }
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="researchers">Chercheurs</Label>
                        <Input
                          id="researchers"
                          type="number"
                          value={editingContent.stats.researchers}
                          onChange={(e) =>
                            handleInputChange(
                              "stats",
                              "researchers",
                              Number.parseInt(e.target.value)
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="publications">Publications</Label>
                        <Input
                          id="publications"
                          type="number"
                          value={editingContent.stats.publications}
                          onChange={(e) =>
                            handleInputChange(
                              "stats",
                              "publications",
                              Number.parseInt(e.target.value)
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="awards">Prix reçus</Label>
                        <Input
                          id="awards"
                          type="number"
                          value={editingContent.stats.awards}
                          onChange={(e) =>
                            handleInputChange(
                              "stats",
                              "awards",
                              Number.parseInt(e.target.value)
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="events">Événements</Label>
                        <Input
                          id="events"
                          type="number"
                          value={editingContent.stats.events}
                          onChange={(e) =>
                            handleInputChange(
                              "stats",
                              "events",
                              Number.parseInt(e.target.value)
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="about" className="space-y-6">
                    <div>
                      <Label htmlFor="history-title">Titre de l'histoire</Label>
                      <Input
                        id="history-title"
                        value={editingContent.about.history.title}
                        onChange={(e) =>
                          setEditingContent((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              history: {
                                ...prev.about.history,
                                title: e.target.value,
                              },
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Contenu de l'histoire</Label>
                      {editingContent.about.history.content.map(
                        (paragraph, index) => (
                          <div key={index} className="mt-2">
                            <Textarea
                              value={paragraph}
                              onChange={(e) => {
                                const newContent = [
                                  ...editingContent.about.history.content,
                                ];
                                newContent[index] = e.target.value;
                                setEditingContent((prev) => ({
                                  ...prev,
                                  about: {
                                    ...prev.about,
                                    history: {
                                      ...prev.about.history,
                                      content: newContent,
                                    },
                                  },
                                }));
                              }}
                              rows={3}
                              placeholder={`Paragraphe ${index + 1}`}
                            />
                          </div>
                        )
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setEditingContent((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              history: {
                                ...prev.about.history,
                                content: [...prev.about.history.content, ""],
                              },
                            },
                          }));
                        }}
                      >
                        Ajouter un paragraphe
                      </Button>
                    </div>

                    <div>
                      <Label>Valeurs</Label>
                      {editingContent.about.history.values.map(
                        (value, index) => (
                          <div
                            key={index}
                            className="mt-2 p-4 border rounded-lg"
                          >
                            <Input
                              value={value.title}
                              onChange={(e) => {
                                const newValues = [
                                  ...editingContent.about.history.values,
                                ];
                                newValues[index] = {
                                  ...newValues[index],
                                  title: e.target.value,
                                };
                                setEditingContent((prev) => ({
                                  ...prev,
                                  about: {
                                    ...prev.about,
                                    history: {
                                      ...prev.about.history,
                                      values: newValues,
                                    },
                                  },
                                }));
                              }}
                              placeholder="Titre de la valeur"
                              className="mb-2"
                            />
                            <Textarea
                              value={value.description}
                              onChange={(e) => {
                                const newValues = [
                                  ...editingContent.about.history.values,
                                ];
                                newValues[index] = {
                                  ...newValues[index],
                                  description: e.target.value,
                                };
                                setEditingContent((prev) => ({
                                  ...prev,
                                  about: {
                                    ...prev.about,
                                    history: {
                                      ...prev.about.history,
                                      values: newValues,
                                    },
                                  },
                                }));
                              }}
                              placeholder="Description de la valeur"
                              rows={2}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="team" className="space-y-6">
                    <div>
                      <Label>Membres de l'équipe</Label>
                      {editingContent.about.team.map((member, index) => (
                        <div
                          key={index}
                          className="mt-4 p-4 border rounded-lg space-y-4"
                        >
                          <div className="grid md:grid-cols-2 gap-4">
                            <Input
                              value={member.name}
                              onChange={(e) => {
                                const newTeam = [...editingContent.about.team];
                                newTeam[index] = {
                                  ...newTeam[index],
                                  name: e.target.value,
                                };
                                setEditingContent((prev) => ({
                                  ...prev,
                                  about: { ...prev.about, team: newTeam },
                                }));
                              }}
                              placeholder="Nom"
                            />
                            <Input
                              value={member.role}
                              onChange={(e) => {
                                const newTeam = [...editingContent.about.team];
                                newTeam[index] = {
                                  ...newTeam[index],
                                  role: e.target.value,
                                };
                                setEditingContent((prev) => ({
                                  ...prev,
                                  about: { ...prev.about, team: newTeam },
                                }));
                              }}
                              placeholder="Rôle"
                            />
                          </div>
                          <Textarea
                            value={member.bio}
                            onChange={(e) => {
                              const newTeam = [...editingContent.about.team];
                              newTeam[index] = {
                                ...newTeam[index],
                                bio: e.target.value,
                              };
                              setEditingContent((prev) => ({
                                ...prev,
                                about: { ...prev.about, team: newTeam },
                              }));
                            }}
                            placeholder="Biographie"
                            rows={3}
                          />
                          <Input
                            value={member.education}
                            onChange={(e) => {
                              const newTeam = [...editingContent.about.team];
                              newTeam[index] = {
                                ...newTeam[index],
                                education: e.target.value,
                              };
                              setEditingContent((prev) => ({
                                ...prev,
                                about: { ...prev.about, team: newTeam },
                              }));
                            }}
                            placeholder="Éducation"
                          />
                          <Input
                            value={member.expertise.join(", ")}
                            onChange={(e) => {
                              const newTeam = [...editingContent.about.team];
                              newTeam[index] = {
                                ...newTeam[index],
                                expertise: e.target.value.split(", "),
                              };
                              setEditingContent((prev) => ({
                                ...prev,
                                about: { ...prev.about, team: newTeam },
                              }));
                            }}
                            placeholder="Expertise (séparée par des virgules)"
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setEditingContent((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              team: [
                                ...prev.about.team,
                                {
                                  id: `member-${Date.now()}`,
                                  name: "",
                                  role: "",
                                  bio: "",
                                  expertise: [],
                                  education: "",
                                  publications: 0,
                                  citations: 0,
                                },
                              ],
                            },
                          }));
                        }}
                      >
                        Ajouter un membre
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="expertise" className="space-y-6">
                    <div>
                      <Label>Domaines d'expertise</Label>
                      {editingContent.about.expertise.map((domain, index) => (
                        <div
                          key={index}
                          className="mt-4 p-4 border rounded-lg space-y-4"
                        >
                          <Input
                            value={domain.title}
                            onChange={(e) => {
                              const newExpertise = [
                                ...editingContent.about.expertise,
                              ];
                              newExpertise[index] = {
                                ...newExpertise[index],
                                title: e.target.value,
                              };
                              setEditingContent((prev) => ({
                                ...prev,
                                about: {
                                  ...prev.about,
                                  expertise: newExpertise,
                                },
                              }));
                            }}
                            placeholder="Titre du domaine"
                          />
                          <Textarea
                            value={domain.description}
                            onChange={(e) => {
                              const newExpertise = [
                                ...editingContent.about.expertise,
                              ];
                              newExpertise[index] = {
                                ...newExpertise[index],
                                description: e.target.value,
                              };
                              setEditingContent((prev) => ({
                                ...prev,
                                about: {
                                  ...prev.about,
                                  expertise: newExpertise,
                                },
                              }));
                            }}
                            placeholder="Description"
                            rows={3}
                          />
                          <Input
                            value={domain.skills.join(", ")}
                            onChange={(e) => {
                              const newExpertise = [
                                ...editingContent.about.expertise,
                              ];
                              newExpertise[index] = {
                                ...newExpertise[index],
                                skills: e.target.value.split(", "),
                              };
                              setEditingContent((prev) => ({
                                ...prev,
                                about: {
                                  ...prev.about,
                                  expertise: newExpertise,
                                },
                              }));
                            }}
                            placeholder="Compétences (séparées par des virgules)"
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setEditingContent((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              expertise: [
                                ...prev.about.expertise,
                                {
                                  title: "",
                                  description: "",
                                  skills: [],
                                },
                              ],
                            },
                          }));
                        }}
                      >
                        Ajouter un domaine
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-email">Email</Label>
                        <Input
                          id="contact-email"
                          value={editingContent.contact.email}
                          onChange={(e) =>
                            handleInputChange(
                              "contact",
                              "email",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-phone">Téléphone</Label>
                        <Input
                          id="contact-phone"
                          value={editingContent.contact.phone}
                          onChange={(e) =>
                            handleInputChange(
                              "contact",
                              "phone",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-address">Adresse</Label>
                        <Textarea
                          id="contact-address"
                          value={editingContent.contact.address}
                          onChange={(e) =>
                            handleInputChange(
                              "contact",
                              "address",
                              e.target.value
                            )
                          }
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-hours">Horaires</Label>
                        <Input
                          id="contact-hours"
                          value={editingContent.contact.hours}
                          onChange={(e) =>
                            handleInputChange(
                              "contact",
                              "hours",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="research-team-name">
                          Research Team name
                        </Label>
                        <Input
                          type="text"
                          id="research-team-name"
                          value={editingContent.footer?.teamName || ""}
                          onChange={(e) =>
                            setEditingContent((prev) => ({
                              ...prev,
                              footer: {
                                ...prev.footer,
                                teamName: e.target.value,
                              },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="research-team-intro">
                          Research Team introduction
                        </Label>
                        <Textarea
                          id="research-team-intro"
                          value={editingContent.footer?.teamIntroduction || ""}
                          onChange={(e) =>
                            setEditingContent((prev) => ({
                              ...prev,
                              footer: {
                                ...prev.footer,
                                teamIntroduction: e.target.value,
                              },
                            }))
                          }
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                    {/* Domaines de Recherche Section */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">
                        Domaines de Recherche
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4, 5].map((num, idx) => (
                          <div key={num} className="flex flex-col">
                            <Label className="mb-1">{num}</Label>
                            <Input
                              type="text"
                              value={
                                editingContent.footer?.researchDomains?.[idx] ||
                                ""
                              }
                              onChange={(e) => {
                                const newDomains = editingContent.footer
                                  ?.researchDomains
                                  ? [...editingContent.footer.researchDomains]
                                  : ["", "", "", "", ""];
                                newDomains[idx] = e.target.value;
                                setEditingContent((prev) => ({
                                  ...prev,
                                  footer: {
                                    ...prev.footer,
                                    researchDomains: newDomains,
                                  },
                                }));
                              }}
                              placeholder={`Domaine de recherche ${num}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-8">
                      <Label htmlFor="footer-copyright">Copyright</Label>
                      <Input
                        id="footer-copyright"
                        type="text"
                        value={editingContent.footer?.copyright || ""}
                        onChange={(e) =>
                          setEditingContent((prev) => ({
                            ...prev,
                            footer: {
                              ...prev.footer,
                              copyright: e.target.value,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Validation Tab - NEW CODE */}
          <TabsContent value="settings">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-indigo-600" />
                    Validation des Projets
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-md overflow-hidden border border-indigo-200">
                      <button
                        className={`px-3 py-1 text-sm ${approvalMode === 'creation' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'}`}
                        onClick={() => setApprovalMode('creation')}
                      >
                        Créations
                      </button>
                      <button
                        className={`px-3 py-1 text-sm ${approvalMode === 'deletion' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'}`}
                        onClick={() => setApprovalMode('deletion')}
                      >
                        Suppressions
                      </button>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Success Message */}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <p className="text-green-800 font-medium">{successMessage}</p>
                      </div>
                    </motion.div>
                  )}

                  {isCreationMode && (
                  <div>
                  {/* Project Statistics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-amber-800">En attente</p>
                          <p className="text-2xl font-bold text-amber-600">
                            {projects.filter(p => !p.is_validated).length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-amber-600" />
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Validés</p>
                          <p className="text-2xl font-bold text-green-600">
                            {projects.filter(p => p.is_validated).length}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </div>
                  

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2">
                      Projets en attente de validation
                    </h4>
                    {projects.filter(p => !p.is_validated).length > 0 && (
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          placeholder="Rechercher un projet..."
                          value={validationSearch}
                          onChange={(e) => setValidationSearch(e.target.value)}
                          className="w-64"
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={selectAllPendingFiltered}>Tout sélectionner</Button>
                          <Button size="sm" variant="outline" onClick={clearSelected}>Effacer</Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={selectedProjectIds.length === 0} onClick={bulkValidateSelected}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approuver sélection ({selectedProjectIds.length})
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-4">
                      {loadingProjects ? (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
                          <p className="text-slate-600">Chargement des projets...</p>
                        </div>
                      ) : projects.filter(p => !p.is_validated).length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600">
                            Aucun projet en attente de validation
                          </p>
                          <p className="text-sm text-slate-500 mt-2">
                            Les projets soumis par les utilisateurs apparaîtront ici
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {projects
                            .filter(project => !project.is_validated)
                            .filter(project => {
                              if (!validationSearch.trim()) return true;
                              const q = validationSearch.toLowerCase();
                              const fields = [project.title, project.description, project.objectives, project.created_by?.name]
                                .filter(Boolean) as string[];
                              return fields.some(f => f.toLowerCase().includes(q));
                            })
                            .map((project) => (
                              <div
                                key={project.id}
                                className="p-4 bg-white rounded-lg shadow-md border-l-4 border-amber-500"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <Checkbox
                                        checked={selectedProjectIds.includes(project.id)}
                                        onCheckedChange={() => toggleSelectProject(project.id)}
                                      />
                                      <h5 className="font-semibold text-slate-800">
                                        {project.title}
                                      </h5>
                                    </div>
                                    <p className="text-slate-700 mb-3 line-clamp-3">
                                      {project.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                                      <div>
                                        <span className="font-medium">Créé par:</span> {project.created_by.name}
                                      </div>
                                      <div>
                                        <span className="font-medium">Date:</span> {new Date(project.created_at).toLocaleDateString()}
                                      </div>
                                      {project.start_date && (
                                        <div>
                                          <span className="font-medium">Début:</span> {new Date(project.start_date).toLocaleDateString()}
                                        </div>
                                      )}
                                      {project.end_date && (
                                        <div>
                                          <span className="font-medium">Fin:</span> {new Date(project.end_date).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                    {project.objectives && (
                                      <div className="mt-3">
                                        <span className="font-medium text-sm text-slate-700">Objectifs:</span>
                                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{project.objectives}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                                                 <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                   <div className="flex items-center space-x-2">
                                     <Badge variant="outline" className="border-amber-300 text-amber-700">
                                       <Clock className="h-3 w-3 mr-1" />
                                       En attente
                                     </Badge>
                                     {project.members.length > 0 && (
                                       <Badge variant="outline" className="border-blue-300 text-blue-700">
                                         <Users className="h-3 w-3 mr-1" />
                                         {project.members.length} membre(s)
                                       </Badge>
                                     )}
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => setSelectedProject(project)}
                                       className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                     >
                                       <Edit className="h-4 w-4 mr-1" />
                                       Modifier
                                     </Button>
                                     <Button
                                       size="sm"
                                       onClick={() => validateProject(project.id)}
                                       className="bg-green-600 hover:bg-green-700 text-white"
                                     >
                                       <CheckCircle className="h-4 w-4 mr-1" />
                                       Approuver
                                     </Button>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => setProjectToReject(project)}
                                       className="border-red-300 text-red-600 hover:bg-red-50"
                                     >
                                       <XCircle className="h-4 w-4 mr-1" />
                                       Rejeter
                                     </Button>
                                   </div>
                                 </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2">
                      Projets validés récemment
                    </h4>
                    <div className="space-y-4">
                      {loadingProjects ? (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
                          <p className="text-slate-600">Chargement des projets...</p>
                        </div>
                      ) : projects.filter(p => p.is_validated).length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                          <p className="text-slate-600">
                            Aucun projet validé récemment
                          </p>
                          <p className="text-sm text-slate-500 mt-2">
                            Les projets validés apparaîtront ici
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {projects
                            .filter(project => project.is_validated)
                            .slice(0, 5) // Show only the 5 most recent validated projects
                            .map((project) => (
                              <div
                                key={project.id}
                                className="p-4 bg-white rounded-lg shadow-md border-l-4 border-green-500"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-slate-800 mb-2">
                                      {project.title}
                                    </h5>
                                    <p className="text-slate-700 mb-3 line-clamp-2">
                                      {project.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                                      <div>
                                        <span className="font-medium">Créé par:</span> {project.created_by.name}
                                      </div>
                                      <div>
                                        <span className="font-medium">Validé le:</span> {new Date(project.updated_at).toLocaleDateString()}
                                      </div>
                                      {project.start_date && (
                                        <div>
                                          <span className="font-medium">Début:</span> {new Date(project.start_date).toLocaleDateString()}
                                        </div>
                                      )}
                                      {project.end_date && (
                                        <div>
                                          <span className="font-medium">Fin:</span> {new Date(project.end_date).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Badge className="bg-green-100 text-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Validé
                                  </Badge>
                                </div>
                                                                  <div className="pt-3 border-t border-slate-200">
                                   <div className="flex items-center justify-between">
                                     {project.members.length > 0 && (
                                       <Badge variant="outline" className="border-blue-300 text-blue-700">
                                         <Users className="h-3 w-3 mr-1" />
                                         {project.members.length} membre(s)
                                       </Badge>
                                     )}
                                     <div className="flex items-center space-x-2">
                                       <Button
                                         size="sm"
                                         variant="outline"
                                         onClick={() => setSelectedProject(project)}
                                         className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                       >
                                         <Edit className="h-4 w-4 mr-1" />
                                         Modifier
                                       </Button>
                                                                                <Button
                                           size="sm"
                                           variant="outline"
                                           onClick={() => {
                                             if (confirm(`Êtes-vous sûr de vouloir supprimer le projet \"${project.title}\" ?`)) {
                                               rejectProject(project.id);
                                             }
                                           }}
                                           className="border-red-300 text-red-600 hover:bg-red-50"
                                         >
                                           <Trash2 className="h-4 w-4 mr-1" />
                                           Supprimer
                                         </Button>
                                     </div>
                                   </div>
                                 </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                  )}
                  {/* Deletion Requests Section */}
                  {isDeletionMode && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Demandes de suppression en attente
                    </h4>
                    <div className="flex items-center justify-between mb-3">
                      <Input
                        placeholder="Rechercher une demande..."
                        value={deletionSearch}
                        onChange={(e) => setDeletionSearch(e.target.value)}
                        className="w-64"
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={selectAllDeletionFiltered}>Tout sélectionner</Button>
                        <Button size="sm" variant="outline" onClick={clearSelectedDeletion}>Effacer</Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={selectedDeletionIds.length === 0} onClick={bulkApproveDeletion}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Approuver ({selectedDeletionIds.length})
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" disabled={selectedDeletionIds.length === 0} onClick={bulkRejectDeletion}>
                          <XCircle className="h-4 w-4 mr-1" /> Rejeter ({selectedDeletionIds.length})
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
 
                       {loadingDeletionRequests ? (
                         <div className="text-center py-4">
                           <Activity className="h-8 w-8 text-red-400 mx-auto mb-2 animate-spin" />
                           <p className="text-red-600 text-sm">Chargement des demandes...</p>
                         </div>
                       ) : deletionRequestsError ? (
                         <div className="text-center py-4">
                           <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                           <p className="text-red-600 text-sm">{deletionRequestsError}</p>
                         </div>
                       ) : deletionRequests.filter(req => req.status === 'pending').length === 0 ? (
                         <div className="text-center py-4">
                           <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                           <p className="text-green-600 text-sm">
                             Aucune demande de suppression en attente
                           </p>
                         </div>
                       ) : (
                         <div className="space-y-3">
                           {deletionRequests
                             .filter(req => req.status === 'pending')
                             .filter(req => {
                               if (!deletionSearch.trim()) return true;
                               const q = deletionSearch.toLowerCase();
                               const fields = [
                                 req.project_title,
                                 req.requested_by?.full_name,
                                 req.requested_by?.username,
                                 req.reason,
                               ].filter(Boolean) as string[];
                               return fields.some(f => f.toLowerCase().includes(q));
                             })
                             .map((request) => (
                               <div
                                 key={request.id}
                                 className="p-3 bg-white rounded-lg shadow-sm border-l-4 border-red-500"
                               >
                                 <div className="flex items-start justify-between mb-2">
                                   <div className="flex-1">
                                     <h5 className="font-medium text-red-800 mb-1">
                                       {request.project_title || `Projet ID: ${request.project}`}
                                     </h5>
                                     <p className="text-sm text-red-700 mb-2">
                                       <span className="font-medium">Demandé par:</span> {request.requested_by?.full_name || request.requested_by?.username || 'Utilisateur inconnu'}
                                     </p>
                                     <p className="text-sm text-red-600 mb-2">
                                       <span className="font-medium">Raison:</span> {request.reason}
                                     </p>
                                     <p className="text-xs text-red-500">
                                       <span className="font-medium">Date:</span> {new Date(request.requested_at).toLocaleDateString()}
                                     </p>
                                   </div>
                                 </div>
                                 <div className="flex items-center justify-between pt-2 border-t border-red-200">
                                   <div className="flex items-center space-x-2">
                                     <Checkbox
                                       checked={selectedDeletionIds.includes(request.id as unknown as string)}
                                       onCheckedChange={() => toggleSelectDeletion(request.id as unknown as string)}
                                     />
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => setSelectedDeletionRequest(request)}
                                       className="border-red-300 text-red-600 hover:bg-red-50"
                                     >
                                       <Eye className="h-3 w-3 mr-1" />
                                       Voir détails
                                     </Button>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <Button
                                       size="sm"
                                       onClick={() => approveDeletionRequest(request.id)}
                                       className="bg-green-600 hover:bg-green-700 text-white"
                                     >
                                       <CheckCircle className="h-3 w-3 mr-1" />
                                       Approuver
                                     </Button>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => rejectDeletionRequest(request.id)}
                                       className="border-red-300 text-red-600 hover:bg-red-50"
                                     >
                                       <XCircle className="h-3 w-3 mr-1" />
                                       Rejeter
                                     </Button>
                                   </div>
                                 </div>
                               </div>
                             ))}
                         </div>
                       )}
                     </div>
                   </div>
                   )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deletion Requests Tab removed; merged into settings */}
        </Tabs>

        {/* Project Editing Modal */}
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  Modifier le projet: {selectedProject.title}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProject(null)}
                  className="border-gray-300"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title">Titre</Label>
                    <Input
                      id="edit-title"
                      value={selectedProject.title}
                      onChange={(e) => setSelectedProject(prev => prev ? {...prev, title: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-created-by">Créé par</Label>
                    <Input
                      id="edit-created-by"
                      value={selectedProject.created_by.name}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedProject.description}
                    onChange={(e) => setSelectedProject(prev => prev ? {...prev, description: e.target.value} : null)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-objectives">Objectifs</Label>
                  <Textarea
                    id="edit-objectives"
                    value={selectedProject.objectives}
                    onChange={(e) => setSelectedProject(prev => prev ? {...prev, objectives: e.target.value} : null)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-methodology">Méthodologie</Label>
                  <Textarea
                    id="edit-methodology"
                    value={selectedProject.methodology}
                    onChange={(e) => setSelectedProject(prev => prev ? {...prev, methodology: e.target.value} : null)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-results">Résultats</Label>
                  <Textarea
                    id="edit-results"
                    value={selectedProject.results}
                    onChange={(e) => setSelectedProject(prev => prev ? {...prev, results: e.target.value} : null)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-start-date">Date de début</Label>
                    <Input
                      id="edit-start-date"
                      type="date"
                      value={selectedProject.start_date ? selectedProject.start_date.split('T')[0] : ''}
                      onChange={(e) => setSelectedProject(prev => prev ? {...prev, start_date: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end-date">Date de fin</Label>
                    <Input
                      id="edit-end-date"
                      type="date"
                      value={selectedProject.end_date ? selectedProject.end_date.split('T')[0] : ''}
                      onChange={(e) => setSelectedProject(prev => prev ? {...prev, end_date: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-funding">Financement</Label>
                    <Input
                      id="edit-funding"
                      value={selectedProject.funding}
                      onChange={(e) => setSelectedProject(prev => prev ? {...prev, funding: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-funding-company">Entreprise de financement</Label>
                    <Input
                      id="edit-funding-company"
                      value={selectedProject.funding_company}
                      onChange={(e) => setSelectedProject(prev => prev ? {...prev, funding_company: e.target.value} : null)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-funding-amount">Montant du financement</Label>
                  <Input
                    id="edit-funding-amount"
                    value={selectedProject.funding_amount}
                    onChange={(e) => setSelectedProject(prev => prev ? {...prev, funding_amount: e.target.value} : null)}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-validated"
                    checked={selectedProject.is_validated}
                    onChange={(e) => setSelectedProject(prev => prev ? {...prev, is_validated: e.target.checked} : null)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-validated">Projet validé</Label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={async () => {
                    if (selectedProject) {
                      await updateProject(selectedProject);
                      setSelectedProject(null);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les modifications
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProject(null)}
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Project Rejection Confirmation Modal */}
        {projectToReject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setProjectToReject(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <XCircle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-xl font-bold text-slate-800">
                  Rejeter le projet
                </h3>
              </div>
              <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir rejeter le projet <strong>"{projectToReject.title}"</strong> ? 
                Cette action est irréversible et supprimera définitivement le projet.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    rejectProject(projectToReject.id);
                    setProjectToReject(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter définitivement
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setProjectToReject(null)}
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Deletion Request Examination Modal */}
        {selectedDeletionRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDeletionRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  Examiner la demande de suppression: {selectedDeletionRequest.project_title || selectedDeletionRequest.project}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDeletionRequest(null)}
                  className="border-gray-300"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Project Information */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-800 mb-3">Informations du projet</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Titre:</span> {selectedDeletionRequest.project_title || selectedDeletionRequest.project}
                    </div>
                    <div>
                      <span className="font-medium">Demandé par:</span> {selectedDeletionRequest.requested_by.full_name || selectedDeletionRequest.requested_by.username}
                    </div>
                    <div>
                      <span className="font-medium">Date de la demande:</span> {new Date(selectedDeletionRequest.requested_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Statut:</span> 
                      <Badge className="ml-2 bg-amber-100 text-amber-700">
                        <Clock className="h-3 w-3 mr-1" />
                        En attente
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Deletion Reason */}
                <div>
                  <Label htmlFor="deletion-reason" className="text-base font-medium">Raison de la suppression</Label>
                  <div className="mt-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-amber-800">{selectedDeletionRequest.reason}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="admin-notes" className="text-base font-medium">Notes administratives</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ajoutez des notes sur votre décision..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => approveDeletionRequest(selectedDeletionRequest.id)}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver la suppression
                  </Button>
                  <Button
                    onClick={() => rejectDeletionRequest(selectedDeletionRequest.id)}
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter la demande
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDeletionRequest(null)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
     
  );
  
}
