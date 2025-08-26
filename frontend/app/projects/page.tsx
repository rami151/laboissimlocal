"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, ArrowRight, Calendar, Users, ExternalLink, Download, ArrowLeft, Clock, CheckCircle } from "lucide-react"
import { Label } from "@/components/ui/label"

interface Project {
  id: string
  title: string
  description: string
  objectives: string
  methodology: string
  results: string
  start_date: string
  end_date: string
  team: string
  funding: string
  image: string | null
  created_by: {
    id: string
    name: string
  }
  members: Array<{
    id: string
    name: string
  }>
  is_validated: boolean
  created_at: string
  updated_at: string
}

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const getImageSrc = (img?: string | null) => {
    if (!img) return "/placeholder.svg"
    const src = img.startsWith("http") ? img : (img.startsWith("/") ? `http://localhost:8000${img}` : `http://localhost:8000/${img}`)
    return src
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      <Button onClick={onBack} variant="ghost" className="text-violet-600 hover:text-violet-700 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux projets
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="relative overflow-hidden">
              <Image
                src={getImageSrc(project.image)}
                alt={project.title}
                width={800}
                height={400}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge
                  className={`${
                    project.is_validated
                      ? "bg-green-600"
                      : "bg-amber-600"
                  } text-white`}
                >
                  {project.is_validated ? "Validé" : "En attente de validation"}
                </Badge>
                <Badge className="bg-gradient-primary text-white">
                  {project.created_by.name}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-3xl text-gray-800">{project.title}</CardTitle>
              <p className="text-gray-600 text-lg">{project.description}</p>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Objectifs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {project.objectives ? project.objectives.split("\n").filter(line => line.trim()).map((objective, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 bg-violet-600 rounded-full p-1">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{objective}</span>
                  </li>
                )) : (
                  <li className="text-gray-500 italic">Aucun objectif spécifié</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Méthodologie</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {project.methodology ? project.methodology.split("\n").filter(line => line.trim()).map((method, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 bg-electric-600 rounded-full p-1">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{method}</span>
                  </li>
                )) : (
                  <li className="text-gray-500 italic">Aucune méthodologie spécifiée</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Résultats et Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {project.results ? project.results.split("\n").filter(line => line.trim()).map((result, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 bg-green-600 rounded-full p-1">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{result}</span>
                  </li>
                )) : (
                  <li className="text-gray-500 italic">Aucun résultat spécifié</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Publications Associées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This section will be populated by a separate API call or data */}
                <p className="text-sm text-gray-600">Aucune publication associée pour le moment.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Informations du Projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Période</h4>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-1">Équipe</h4>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {project.team ? project.team : "Non spécifiée"}
                </div>
                {project.members && project.members.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {project.members.map((member, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {member.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-1">Financement</h4>
                <p className="text-gray-600">{project.funding_company}</p>
                <p className="text-lg font-semibold text-violet-600">{project.funding_amount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* This section will be populated by a separate API call or data */}
                <p className="text-sm text-gray-600">Aucun document associé pour le moment.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

export default function ProjectsPage() {
  const getImageSrc = (img?: string | null) => {
    if (!img) return "/placeholder.svg"
    const src = img.startsWith("http") ? img : (img.startsWith("/") ? `http://localhost:8000${img}` : `http://localhost:8000/${img}`)
    return src
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testServerConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/')
        console.log('Server is reachable:', response.status)
        return true
      } catch (err) {
        console.log('Server is not reachable:', err)
        return false
      }
    }

    const fetchProjects = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // First test if server is reachable
        const serverReachable = await testServerConnection()
        if (!serverReachable) {
          throw new Error("Le serveur Django n'est pas accessible. Vérifiez qu'il est en cours d'exécution sur le port 8000.")
        }
        
        console.log('Fetching projects from: http://localhost:8000/api/projects/public')
        const response = await fetch('http://localhost:8000/api/projects/public')
        console.log('Response status:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Error response:', errorText)
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
        }
        
        const data: Project[] = await response.json()
        console.log('Projects data:', data)
        console.log('Number of projects:', data.length)
        
        if (data.length === 0) {
          console.log('No projects found in the database')
        }
        
        setProjects(data)
      } catch (err) {
        console.error('Error fetching projects:', err)
        if (err instanceof Error && err.message.includes('Failed to fetch')) {
          setError("Impossible de se connecter au serveur. Vérifiez que le serveur Django est en cours d'exécution sur le port 8000.")
        } else {
          setError(err instanceof Error ? err.message : "Erreur lors de la récupération des projets.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchProjects, 30000)
    return () => clearInterval(interval)
  }, [])

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || 
      (selectedCategory === "validated" && project.is_validated) ||
      (selectedCategory === "pending" && !project.is_validated)
    
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "validated" && project.is_validated) ||
      (selectedStatus === "pending" && !project.is_validated)

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Only show validated projects by default
  const validatedProjects = projects.filter(project => project.is_validated)
  const displayProjects = selectedStatus === "all" && selectedCategory === "all" ? validatedProjects : filteredProjects

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "validated", label: "Validés" },
    { value: "pending", label: "En attente de validation" }
  ]
  
  const statuses = [
    { value: "all", label: "Tous les statuts" },
    { value: "validated", label: "Validés" },
    { value: "pending", label: "En attente de validation" }
  ]

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-electric-50 to-violet-100 pt-20">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-electric-600 to-violet-600 bg-clip-text text-transparent mb-6 animate-rotate-gradient bg-[length:200%_auto]">
            Nos Projets de Recherche
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chargement des projets...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-electric-50 to-violet-100 pt-20">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-electric-600 to-violet-600 bg-clip-text text-transparent mb-6 animate-rotate-gradient bg-[length:200%_auto]">
              Nos Projets de Recherche
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              {error}
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Vérifiez que le serveur Django est en cours d'exécution sur le port 8000
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
              >
                Réessayer
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-electric-50 to-violet-100 pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-electric-600 to-violet-600 bg-clip-text text-transparent mb-6 animate-rotate-gradient bg-[length:200%_auto]">
            Nos Projets de Recherche
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Découvrez les projets innovants sur lesquels notre équipe travaille actuellement et les résultats de nos
            recherches passées.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="bg-white/80 backdrop-blur-sm"
          >
            Actualiser les projets
          </Button>
        </motion.div>

        {selectedProject ? (
          <ProjectDetail
            project={projects.find((p) => p.id === selectedProject)!}
            onBack={() => setSelectedProject(null)}
          />
        ) : (
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un projet..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select onValueChange={(value) => setSelectedCategory(value)} defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => setSelectedStatus(value)} defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Projects Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayProjects.length > 0 ? (
                displayProjects.map((project) => (
                  <motion.div key={project.id} variants={fadeInUp}>
                    <Card
                      className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col cursor-pointer group"
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <div className="relative overflow-hidden">
                        <Image
                          src={getImageSrc(project.image)}
                          alt={project.title}
                          width={500}
                          height={300}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge
                            className={`${
                              project.is_validated
                                ? "bg-green-600"
                                : "bg-amber-600"
                            } text-white`}
                          >
                            {project.is_validated ? "Validé" : "En attente de validation"}
                          </Badge>
                          <Badge className="bg-gradient-primary text-white">
                            {project.created_by.name}
                          </Badge>
                        </div>
                      </div>
                      <CardHeader className="flex-grow">
                        <CardTitle className="text-xl group-hover:text-violet-600 transition-colors">
                          {project.title}
                        </CardTitle>
                        <p className="text-gray-600">{project.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {project.team ? project.team : "Équipe non spécifiée"} • {project.funding ? project.funding : "Financement non spécifié"}
                          </div>
                          <ArrowRight className="h-4 w-4 text-violet-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  {projects.length === 0 ? (
                    <div>
                      <p className="text-gray-500 text-lg mb-2">Aucun projet validé disponible pour le moment.</p>
                      <p className="text-gray-400 text-sm mb-4">
                        Les projets créés par les utilisateurs et validés par l'administrateur apparaîtront ici.
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <p>• Créez un projet dans la section "Gestion des Projets"</p>
                        <p>• L'administrateur doit valider le projet</p>
                        <p>• Les projets validés seront visibles publiquement</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 text-lg mb-2">Aucun projet trouvé avec ces critères.</p>
                      <p className="text-gray-400 text-sm">Essayez de modifier vos filtres de recherche.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
