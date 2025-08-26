"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Upload, FileText, ImageIcon, Download, Trash2, Eye, 
  FileImage, FileArchive, FileVideo, FileAudio, FileCode,
  Plus, X, AlertCircle, CheckCircle
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface ProjectDocument {
  id: string
  name: string
  file: string
  file_type: 'document' | 'image' | 'presentation' | 'spreadsheet' | 'other'
  description: string
  uploaded_by: {
    id: string
    username: string
    first_name: string
    last_name: string
  }
  uploaded_at: string
  is_public: boolean
  file_size_mb: number
  file_extension: string
  is_image: boolean
}

interface ProjectFileManagerProps {
  projectId: string
  onFilesUpdated?: () => void
}

export default function ProjectFileManager({ projectId, onFilesUpdated }: ProjectFileManagerProps) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (projectId) {
      fetchProjectDocuments()
    }
  }, [projectId])

  const fetchProjectDocuments = async () => {
    try {
      setLoading(true)
      setError("")
      const token = localStorage.getItem('token')
      
      const response = await fetch(`http://localhost:8000/api/project-documents/by_project?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      } else {
        const errorText = await response.text()
        setError(`Erreur serveur: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    try {
      setUploading(true)
      setError("")
      const token = localStorage.getItem('token')
      
      const formData = new FormData()
      formData.append('project', projectId)
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })
      
      const response = await fetch('http://localhost:8000/api/project-documents/bulk_upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        setSuccess(`Fichiers téléchargés avec succès: ${result.uploaded_files.length} fichiers`)
        setSelectedFiles([])
        setShowUploadForm(false)
        fetchProjectDocuments()
        onFilesUpdated?.()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Erreur lors du téléchargement")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    } finally {
      setUploading(false)
    }
  }

  const downloadFile = async (document: ProjectDocument) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`http://localhost:8000/api/project-documents/${document.id}/download/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = document.name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError("Erreur lors du téléchargement du fichier")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    }
  }

  const deleteFile = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) return

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`http://localhost:8000/api/project-documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setSuccess("Fichier supprimé avec succès")
        fetchProjectDocuments()
        onFilesUpdated?.()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Erreur lors de la suppression")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    }
  }

  const getFileIcon = (document: ProjectDocument) => {
    if (document.is_image) return <ImageIcon className="h-5 w-5 text-blue-600" />
    
    switch (document.file_extension) {
      case '.pdf':
        return <FileText className="h-5 w-5 text-red-600" />
      case '.doc':
      case '.docx':
        return <FileText className="h-5 w-5 text-blue-600" />
      case '.xls':
      case '.xlsx':
        return <FileText className="h-5 w-5 text-green-600" />
      case '.ppt':
      case '.pptx':
        return <FileText className="h-5 w-5 text-orange-600" />
      case '.zip':
      case '.rar':
        return <FileArchive className="h-5 w-5 text-purple-600" />
      case '.mp4':
      case '.avi':
      case '.mov':
        return <FileVideo className="h-5 w-5 text-red-600" />
      case '.mp3':
      case '.wav':
        return <FileAudio className="h-5 w-5 text-green-600" />
      case '.js':
      case '.ts':
      case '.py':
      case '.java':
        return <FileCode className="h-5 w-5 text-gray-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) return `${(sizeInMB * 1024).toFixed(1)} KB`
    return `${sizeInMB.toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Documents du Projet
            </CardTitle>
            <CardDescription>
              Gérez les fichiers et images de votre projet
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter des fichiers
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Upload Form */}
        {showUploadForm && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-files" className="text-sm font-medium">
                  Sélectionner des fichiers
                </Label>
                <Input
                  ref={fileInputRef}
                  id="project-files"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="mt-2"
                  accept="*/*"
                />
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fichiers sélectionnés:</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="truncate">{file.name}</span>
                        <span className="text-gray-500 text-xs">
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  onClick={uploadFiles}
                  disabled={uploading || selectedFiles.length === 0}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Téléchargement..." : "Télécharger les fichiers"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadForm(false)
                    setSelectedFiles([])
                  }}
                  disabled={uploading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Fichiers du projet ({documents.length})
          </Label>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement des fichiers...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun fichier téléchargé pour ce projet</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(document)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {document.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{formatFileSize(document.file_size_mb)}</span>
                          <span>•</span>
                          <span>{document.file_type}</span>
                          <span>•</span>
                          <span>Ajouté par {document.uploaded_by.first_name || document.uploaded_by.username}</span>
                          <span>•</span>
                          <span>{formatDate(document.uploaded_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={document.is_public ? "default" : "secondary"}>
                        {document.is_public ? "Public" : "Privé"}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(document)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFile(document.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
