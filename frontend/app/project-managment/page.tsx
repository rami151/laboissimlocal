"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FolderPlus, X, Trash2, Users, User, CheckCircle, Clock, 
  AlertCircle, Target, BarChart3, Calendar, Users2, DollarSign,
  Eye, ClipboardList, Plus, Minus, Upload, FileText, ImageIcon, Image
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

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
  image: string | null;
  documents: string[];
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
  can_edit?: boolean;
  can_delete?: boolean;
  can_request_deletion?: boolean;
  has_pending_deletion_request?: boolean;
}

interface ProjectManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectManagement({ isOpen, onClose }: ProjectManagementProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectForm, setProjectForm] = useState({ 
    title: "", 
    description: "",
    objectives: "",
    methodology: "",
    results: "",
    start_date: "",
    end_date: "",
    funding: "",
    funding_company: "",
    funding_amount: ""
  })
  const [teamMembers, setTeamMembers] = useState<string[]>([""])
  const [projectImage, setProjectImage] = useState<File | null>(null)
  const [projectDocuments, setProjectDocuments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "create" | "view" | "edit">("list")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletionRequestModal, setDeletionRequestModal] = useState<{ isOpen: boolean; project: Project | null; reason: string }>({
    isOpen: false,
    project: null,
    reason: ""
  })
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentsInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && user) {
      fetchProjects()
    }
  }, [isOpen, user])

  // Debug edit form rendering
  useEffect(() => {
    if (viewMode === "edit" && editingProject) {
      console.log('Edit form should be visible for project:', editingProject)
    }
  }, [viewMode, editingProject])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError("")
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:8000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const projectsData = await response.json()
        setProjects(projectsData)
      } else {
        const errorText = await response.text()
        setError(`Erreur serveur: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError('Erreur de connexion au serveur. Vérifiez que le serveur Django est en cours d\'exécution.')
    } finally {
      setLoading(false)
    }
  }

  const startEditProject = (project: Project) => {
    console.log('Starting edit for project:', project)
    
    // Make sure we have the latest project data
    const currentProject = projects.find(p => p.id === project.id) || project
    
    setEditingProject({ ...currentProject })
    setViewMode("edit")
    
    // Clear any previously selected files
    setProjectImage(null)
    setProjectDocuments([])
    
    // Clear any previous errors
    setError("")
  }

  const viewProjectDetails = (project: Project) => {
    setSelectedProject(project)
    setViewMode("view")
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non spécifié"
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR')
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId))
        setSuccess("Projet supprimé avec succès")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError('Erreur lors de la suppression du projet')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletionRequest = async (project: Project) => {
    if (!deletionRequestModal.reason.trim()) {
      setError('Veuillez fournir une raison pour la demande de suppression')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/projects/${project.id}/request_deletion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: deletionRequestModal.reason
        })
      })
      
      if (response.ok) {
        setSuccess("Demande de suppression soumise avec succès")
        setTimeout(() => setSuccess(""), 3000)
        setDeletionRequestModal({ isOpen: false, project: null, reason: "" })
        fetchProjects() // Refresh to update has_pending_deletion_request
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la soumission de la demande de suppression')
      }
    } catch (error) {
      console.error('Error submitting deletion request:', error)
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!projectForm.title || !projectForm.description) {
      setError('Veuillez remplir au moins le titre et la description')
      return
    }

    try {
      setLoading(true)
      setError("")
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('Token d\'authentification manquant. Veuillez vous reconnecter.')
        return
      }
      
      // Filter out empty team members and convert array to string
      const filteredTeamMembers = teamMembers.filter(member => member.trim() !== "")
      const teamString = filteredTeamMembers.join(", ")
      
      // Create FormData to handle file uploads
      const formData = new FormData()
      
      // Add project data
      formData.append('title', projectForm.title)
      formData.append('description', projectForm.description)
      formData.append('objectives', projectForm.objectives || "")
      formData.append('methodology', projectForm.methodology || "")
      formData.append('results', projectForm.results || "")
      formData.append('start_date', projectForm.start_date || "")
      formData.append('end_date', projectForm.end_date || "")
      formData.append('team', teamString)
      formData.append('funding', projectForm.funding || "")
      formData.append('funding_company', projectForm.funding_company || "")
      formData.append('funding_amount', projectForm.funding_amount || "")
      
      // Add image file if selected
      if (projectImage) {
        formData.append('image', projectImage)
      }
      
      // Add document files
      projectDocuments.forEach((doc, index) => {
        formData.append(`documents`, doc)
      })
      
      const response = await fetch('http://localhost:8000/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (response.ok) {
        const newProject = await response.json()
        setProjects([newProject, ...projects])
        setProjectForm({ 
          title: "", 
          description: "",
          objectives: "",
          methodology: "",
          results: "",
          start_date: "",
          end_date: "",
          funding: "",
          funding_company: "",
          funding_amount: ""
        })
        setTeamMembers([""])
        setProjectImage(null)
        setProjectDocuments([])
        setViewMode("list")
        setSuccess("Projet créé avec succès")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        let errorMessage = `Erreur serveur: ${response.status} ${response.statusText}`
        
        try {
          const errorData = await response.json()
          if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (typeof errorData === 'object') {
            const fieldErrors = Object.entries(errorData)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ')
            
            if (fieldErrors) {
              errorMessage = `Erreurs de validation: ${fieldErrors}`
            }
          }
        } catch (e) {
          const errorText = await response.text()
          errorMessage = `Erreur serveur: ${response.status} ${response.statusText} - ${errorText}`
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Erreur de connexion au serveur. Vérifiez que le serveur Django est en cours d\'exécution.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProject = async () => {
    if (!editingProject) return

    try {
      setLoading(true)
      setError("")
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('Token d\'authentification manquant. Veuillez vous reconnecter.')
        return
      }
      
      // Create FormData to handle file uploads
      const formData = new FormData()
      
      // Add project data
      formData.append('title', editingProject.title)
      formData.append('description', editingProject.description)
      formData.append('objectives', editingProject.objectives || "")
      formData.append('methodology', editingProject.methodology || "")
      formData.append('results', editingProject.results || "")
      formData.append('start_date', editingProject.start_date || "")
      formData.append('end_date', editingProject.end_date || "")
      formData.append('team', editingProject.team || "")
      formData.append('funding', editingProject.funding || "")
      formData.append('funding_company', (editingProject as any).funding_company || "")
      formData.append('funding_amount', (editingProject as any).funding_amount || "")
      
      // Add new image if selected
      if (projectImage) {
        formData.append('image', projectImage)
      }
      
      // Add new document files
      projectDocuments.forEach((doc) => {
        formData.append('documents', doc)
      })
      
      const url = `http://localhost:8000/api/projects/${editingProject.id}`
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (response.ok) {
        const updatedProject = await response.json()
        
        // Update the projects list with the new data
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
        
        // Update the selected project if it's the same one
        if (selectedProject && selectedProject.id === updatedProject.id) {
          setSelectedProject(updatedProject)
        }
        
        // Update the editing project with the new data
        setEditingProject(updatedProject)
        
        // Stay in edit mode instead of switching to view mode
        setViewMode("edit")
        
        setSuccess("Projet modifié avec succès")
        setTimeout(() => setSuccess(""), 3000)
        
        // Clear uploaded files
        setProjectImage(null)
        setProjectDocuments([])
      } else {
        let errorMessage = `Erreur serveur: ${response.status} ${response.statusText}`
        
        try {
          const errorData = await response.json()
          if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (typeof errorData === 'object') {
            const fieldErrors = Object.entries(errorData)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ')
            
            if (fieldErrors) {
              errorMessage = `Erreurs de validation: ${fieldErrors}`
            }
          }
        } catch (e) {
          const errorText = await response.text()
          errorMessage = `Erreur serveur: ${response.status} ${response.statusText} - ${errorText}`
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error editing project:', error)
      setError('Erreur de connexion au serveur. Vérifiez que le serveur Django est en cours d\'exécution.')
    } finally {
      setLoading(false)
    }
  }

  const addTeamMemberField = () => {
    setTeamMembers([...teamMembers, ""])
  }

  const removeTeamMemberField = (index: number) => {
    if (teamMembers.length > 1) {
      const updatedMembers = [...teamMembers]
      updatedMembers.splice(index, 1)
      setTeamMembers(updatedMembers)
    }
  }

  const updateTeamMember = (index: number, value: string) => {
    const updatedMembers = [...teamMembers]
    updatedMembers[index] = value
    setTeamMembers(updatedMembers)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide')
        return
      }
      setProjectImage(file)
      setError("")
    }
  }

  const handleDocumentsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setProjectDocuments(prev => [...prev, ...files])
    }
  }

  const removeDocument = (index: number) => {
    setProjectDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const removeImage = () => {
    setProjectImage(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <>
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FolderPlus className="h-5 w-5 mr-2 text-indigo-600" />
            {viewMode === "create" ? "Créer un Projet" : 
             viewMode === "view" ? "Détails du Projet" : "Gestion des Projets"}
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
            if (viewMode !== "list") {
              setViewMode("list")
              setSelectedProject(null)
            } else {
              onClose()
            }
          }}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          {user?.role === 'admin' 
            ? "Gérez tous les projets de l'équipe" 
            : "Créez et gérez vos projets"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Success/Error Messages */}
          {success && (
            <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Create Project Form */}
          {viewMode === "create" && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Nouveau Projet</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="project-title">Titre du projet *</Label>
                    <Input
                      id="project-title"
                      value={projectForm.title}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Titre de votre projet..."
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="project-description">Description *</Label>
                    <Textarea
                      id="project-description"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description du projet..."
                      rows={3}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="project-objectives">
                      <Target className="h-4 w-4 inline mr-1" />
                      Objectifs
                    </Label>
                    <Textarea
                      id="project-objectives"
                      value={projectForm.objectives}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, objectives: e.target.value }))}
                      placeholder="Objectifs du projet..."
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="project-methodology">
                      <ClipboardList className="h-4 w-4 inline mr-1" />
                      Méthodologie
                    </Label>
                    <Textarea
                      id="project-methodology"
                      value={projectForm.methodology}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, methodology: e.target.value }))}
                      placeholder="Méthodologie utilisée..."
                      rows={2}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="project-results">
                      <BarChart3 className="h-4 w-4 inline mr-1" />
                      Résultat et impact
                    </Label>
                    <Textarea
                      id="project-results"
                      value={projectForm.results}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, results: e.target.value }))}
                      placeholder="Résultat et impact du projet..."
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="project-start-date">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date de début
                      </Label>
                      <Input
                        id="project-start-date"
                        type="date"
                        value={projectForm.start_date}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-end-date">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date de fin
                      </Label>
                      <Input
                        id="project-end-date"
                        type="date"
                        value={projectForm.end_date}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Team Members - Dynamic Fields */}
                  <div>
                    <Label className="flex items-center mb-2">
                      <Users2 className="h-4 w-4 mr-1" />
                      Équipe (membres)
                    </Label>
                    <div className="space-y-2">
                      {teamMembers.map((member, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={member}
                            onChange={(e) => updateTeamMember(index, e.target.value)}
                            placeholder={`Membre ${index + 1}`}
                            disabled={loading}
                          />
                          {teamMembers.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeTeamMemberField(index)}
                              className="h-10 w-10"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                          {index === teamMembers.length - 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={addTeamMemberField}
                              className="h-10 w-10"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ajoutez un membre par champ. Ils seront combinés en une seule chaîne pour l'envoi.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="project-funding">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Financement (Entreprise et Montant)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        id="project-funding-company"
                        value={projectForm.funding_company}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, funding_company: e.target.value }))}
                        placeholder="Nom de l'entreprise"
                        disabled={loading}
                      />
                      <Input
                        id="project-funding-amount"
                        type="number"
                        value={projectForm.funding_amount}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, funding_amount: e.target.value }))}
                        placeholder="Montant (ex: 10000)"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label className="flex items-center mb-2">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Image du projet
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {projectImage ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ImageIcon className="h-4 w-4 mr-2 text-green-600" />
                            <span className="text-sm truncate">{projectImage.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({formatFileSize(projectImage.size)})
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeImage}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Glissez-déposez une image ou cliquez pour parcourir</p>
                          <Input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="project-image"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Sélectionner une image
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Documents Upload */}
                  <div>
                    <Label className="flex items-center mb-2">
                      <FileText className="h-4 w-4 mr-1" />
                      Documents du projet
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {projectDocuments.length > 0 ? (
                        <div className="space-y-2 mb-3">
                          {projectDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                <span className="text-sm truncate">{doc.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({formatFileSize(doc.size)})
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDocument(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center mb-3">
                          <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Aucun document sélectionné</p>
                        </div>
                      )}
                      
                      <Input
                        ref={documentsInputRef}
                        type="file"
                        multiple
                        onChange={handleDocumentsUpload}
                        className="hidden"
                        id="project-documents"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => documentsInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Ajouter des documents
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  onClick={handleCreateProject}
                  disabled={loading || !projectForm.title || !projectForm.description}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  {loading ? "Création..." : "Créer le projet"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setViewMode("list")}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Edit Project Form */}
          {viewMode === "edit" && editingProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Modifier le Projet</h4>
                <Button variant="outline" size="sm" onClick={() => {
                  setViewMode("view")
                  setEditingProject(null)
                }}>
                  Annuler
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-project-title">Titre du projet *</Label>
                    <Input
                      id="edit-project-title"
                      value={editingProject.title}
                      onChange={(e) => setEditingProject(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="Titre de votre projet..."
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-project-description">Description *</Label>
                    <Textarea
                      id="edit-project-description"
                      value={editingProject.description}
                      onChange={(e) => setEditingProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Description du projet..."
                      rows={3}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-project-objectives">
                      <Target className="h-4 w-4 inline mr-1" />
                      Objectifs
                    </Label>
                    <Textarea
                      id="edit-project-objectives"
                      value={editingProject.objectives}
                      onChange={(e) => setEditingProject(prev => prev ? { ...prev, objectives: e.target.value } : null)}
                      placeholder="Objectifs du projet..."
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-project-methodology">
                      <ClipboardList className="h-4 w-4 inline mr-1" />
                      Méthodologie
                    </Label>
                    <Textarea
                      id="edit-project-methodology"
                      value={editingProject.methodology}
                      onChange={(e) => setEditingProject(prev => prev ? { ...prev, methodology: e.target.value } : null)}
                      placeholder="Méthodologie utilisée..."
                      rows={2}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-project-results">
                      <BarChart3 className="h-4 w-4 inline mr-1" />
                      Résultat et impact
                    </Label>
                    <Textarea
                      id="edit-project-results"
                      value={editingProject.results}
                      onChange={(e) => setEditingProject(prev => prev ? { ...prev, results: e.target.value } : null)}
                      placeholder="Résultat et impact du projet..."
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-project-start-date">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date de début
                      </Label>
                      <Input
                        id="edit-project-start-date"
                        type="date"
                        value={editingProject.start_date}
                        onChange={(e) => setEditingProject(prev => prev ? { ...prev, start_date: e.target.value } : null)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-project-end-date">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date de fin
                      </Label>
                      <Input
                        id="edit-project-end-date"
                        type="date"
                        value={editingProject.end_date}
                        onChange={(e) => setEditingProject(prev => prev ? { ...prev, end_date: e.target.value } : null)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-project-team">
                      <Users2 className="h-4 w-4 mr-1" />
                      Équipe (membres)
                    </Label>
                    <Input
                      id="edit-project-team"
                      value={editingProject.team}
                      onChange={(e) => setEditingProject(prev => prev ? { ...prev, team: e.target.value } : null)}
                      placeholder="Membres de l'équipe..."
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-project-funding">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Financement (Entreprise et Montant)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        id="edit-project-funding-company"
                        value={(editingProject as any).funding_company || ""}
                        onChange={(e) => setEditingProject(prev => prev ? { ...prev, funding_company: e.target.value } as any : null)}
                        placeholder="Nom de l'entreprise"
                        disabled={loading}
                      />
                      <Input
                        id="edit-project-funding-amount"
                        type="number"
                        value={(editingProject as any).funding_amount || ""}
                        onChange={(e) => setEditingProject(prev => prev ? { ...prev, funding_amount: e.target.value } as any : null)}
                        placeholder="Montant (ex: 10000)"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">
                  <Image className="h-4 w-4 inline mr-1" />
                  Image du projet
                </Label>
                
                {/* Current Image Display */}
                {editingProject.image && (
                  <div className="mb-4">
                    <Label className="block mb-2 text-sm text-gray-600">Image actuelle</Label>
                    <div className="border rounded-lg p-2">
                      <img 
                        src={`http://localhost:8000${editingProject.image}`} 
                        alt={editingProject.title}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  </div>
                )}

                {/* New Image Upload */}
                <div>
                  <Label className="block mb-2 text-sm text-gray-600">Changer l'image</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="edit-project-image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('edit-project-image')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {editingProject.image ? "Changer l'image" : "Ajouter une image"}
                    </Button>
                    {projectImage && (
                      <span className="text-sm text-green-600">
                        ✓ Nouvelle image sélectionnée
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Upload Section */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Documents du projet
                </Label>
                
                {/* Current Documents Display */}
                {editingProject.documents && editingProject.documents.length > 0 && (
                  <div className="mb-4">
                    <Label className="block mb-2 text-sm text-gray-600">Documents actuels</Label>
                    <div className="space-y-2">
                      {editingProject.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Documents Upload */}
                <div>
                  <Label className="block mb-2 text-sm text-gray-600">Ajouter des documents</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      ref={documentsInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                      multiple
                      onChange={handleDocumentsUpload}
                      className="hidden"
                      id="edit-project-documents"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => documentsInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Ajouter des documents
                    </Button>
                    {projectDocuments.length > 0 && (
                      <span className="text-sm text-green-600">
                        ✓ {projectDocuments.length} document(s) sélectionné(s)
                      </span>
                    )}
                  </div>
                  
                  {/* Display selected documents */}
                  {projectDocuments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {projectDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <span className="text-sm text-blue-700">{doc.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setProjectDocuments(prev => prev.filter((_, i) => i !== index))
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  onClick={handleEditProject}
                  disabled={loading || !editingProject.title || !editingProject.description}
                >
                  {loading ? "Modification..." : "Modifier le projet"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setViewMode("view")
                    setEditingProject(null)
                  }}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Project Details View */}
          {viewMode === "view" && selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Détails du Projet</h4>
                <Button variant="outline" size="sm" onClick={() => setViewMode("list")}>
                  Retour à la liste
                </Button>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-xl font-semibold text-gray-800">{selectedProject.title}</h5>
                  <Badge className={
                    selectedProject.is_validated 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }>
                    {selectedProject.is_validated ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {selectedProject.is_validated ? 'Validé' : 'En attente'}
                  </Badge>
                </div>

                {/* Project Image */}
                {selectedProject.image && (
                  <div className="mb-6">
                    <Label className="block mb-2">Image du projet</Label>
                    <div className="border rounded-lg p-2">
                      <img 
                        src={`http://localhost:8000${selectedProject.image}`} 
                        alt={selectedProject.title}
                        className="w-full h-48 object-cover rounded"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-600">Description</Label>
                      <p className="mt-1 text-gray-800">{selectedProject.description || "Non spécifié"}</p>
                    </div>

                    <div>
                      <Label className="text-gray-600 flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        Objectifs
                      </Label>
                      <p className="mt-1 text-gray-800">{selectedProject.objectives || "Non spécifié"}</p>
                    </div>

                    <div>
                      <Label className="text-gray-600 flex items-center">
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Méthodologie
                      </Label>
                      <p className="mt-1 text-gray-800">{selectedProject.methodology || "Non spécifié"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-600 flex items-center">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Résultat et impact
                      </Label>
                      <p className="mt-1 text-gray-800">{selectedProject.results || "Non spécifié"}</p>
                    </div>

                    <div>
                      <Label className="text-gray-600">Informations du Projet</Label>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Période:</span>
                          <span className="text-gray-800">
                            {formatDate(selectedProject.start_date)} - {formatDate(selectedProject.end_date)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Équipe:</span>
                          <span className="text-gray-800">{selectedProject.team || "Non spécifié"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Financement:</span>
                          <span className="text-gray-800">{selectedProject.funding || "Non spécifié"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Créé par:</span>
                          <span className="text-gray-800">{selectedProject.created_by.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Membres:</span>
                          <span className="text-gray-800">{selectedProject.members.length + 1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date de création:</span>
                          <span className="text-gray-800">{formatDate(selectedProject.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Projects List */}
          {viewMode === "list" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-800">
                  {user?.role === 'admin' ? 'Tous les projets' : 'Mes projets'}
                </h4>
                <Button 
                  onClick={() => setViewMode("create")}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Nouveau Projet
                </Button>
              </div>

              {loading && projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chargement des projets...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun projet pour le moment</p>
                  <p className="text-sm mt-1">Créez votre premier projet pour commencer</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div key={project.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 cursor-pointer" onClick={() => viewProjectDetails(project)}>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-800">{project.title}</h5>
                              <Badge className={
                                project.is_validated 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }>
                                {project.is_validated ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {project.is_validated ? 'Validé' : 'En attente'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {project.created_by.name}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(project.start_date)} - {formatDate(project.end_date)}
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {project.funding ? project.funding : 'Non spécifié'}
                              </span>
                              {project.image && (
                                <span className="flex items-center">
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  Image
                                </span>
                              )}
                              {project.documents && project.documents.length > 0 && (
                                <span className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {project.documents.length} doc(s)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            {/* Show Modifier button for team leads, Voir for others */}
                            {(user?.role === 'admin' || user?.role === 'chef_d_equipe') ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => startEditProject(project)}
                                disabled={loading}
                              >
                                <ClipboardList className="h-3 w-3 mr-1" />
                                Modifier
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => viewProjectDetails(project)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Voir
                              </Button>
                            )}
                            
                            {project.can_delete && !project.is_validated && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteProject(project.id)}
                                disabled={loading}
                                title="Supprimer le projet (non validé)"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {project.can_request_deletion && project.is_validated && !project.has_pending_deletion_request && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setDeletionRequestModal({ 
                                  isOpen: true, 
                                  project: project, 
                                  reason: "" 
                                })}
                                disabled={loading}
                                title="Demander la suppression du projet validé"
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Demander suppression
                              </Button>
                            )}
                            
                            {project.has_pending_deletion_request && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Demande en cours
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Deletion Request Modal */}
    {deletionRequestModal.isOpen && deletionRequestModal.project && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">
            Demande de suppression du projet
          </h3>
          <p className="text-gray-600 mb-4">
            Vous êtes sur le point de demander la suppression du projet <strong>"{deletionRequestModal.project.title}"</strong>.
            Cette demande sera examinée par un administrateur.
          </p>
          
          <div className="mb-4">
            <Label htmlFor="deletion-reason">Raison de la suppression *</Label>
            <Textarea
              id="deletion-reason"
              value={deletionRequestModal.reason}
              onChange={(e) => setDeletionRequestModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Expliquez pourquoi vous souhaitez supprimer ce projet..."
              className="mt-2"
              rows={4}
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeletionRequestModal({ isOpen: false, project: null, reason: "" })}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeletionRequest(deletionRequestModal.project!)}
              disabled={loading}
            >
              {loading ? "Envoi..." : "Soumettre la demande"}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
