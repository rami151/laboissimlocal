"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { user } = useAuth()

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

  const events = [
    {
      id: "event-1",
      title: "Séminaire Intelligence Artificielle Éthique",
      description: "Présentation des dernières avancées en IA éthique et discussion sur les implications sociétales",
      date: "2024-12-15",
      time: "14:00",
      endTime: "17:00",
      location: "Amphithéâtre A, Bâtiment Principal",
      category: "Séminaire",
      speaker: "Prof. Jean Martin",
      attendees: 45,
      maxAttendees: 80,
      status: "À venir",
      registrationUrl: "#",
      image: "/placeholder.svg?height=200&width=400",
      requiresAuth: true,
    },
    {
      id: "event-2",
      title: "Workshop Médecine Personnalisée",
      description: "Atelier pratique sur les techniques de séquençage génomique et l'analyse de données multi-omiques",
      date: "2024-12-18",
      time: "09:00",
      endTime: "16:00",
      location: "Laboratoire de Biotechnologie",
      category: "Workshop",
      speaker: "Dr. Sophie Dubois",
      attendees: 12,
      maxAttendees: 20,
      status: "À venir",
      registrationUrl: "#",
      image: "/placeholder.svg?height=200&width=400",
      requiresAuth: true,
    },
    {
      id: "event-3",
      title: "Conférence Internationale sur les Énergies Renouvelables",
      description:
        "Conférence de trois jours sur les innovations en matière d'énergies renouvelables et de développement durable",
      date: "2024-12-22",
      time: "09:00",
      endTime: "18:00",
      location: "Centre de Conférences International",
      category: "Conférence",
      speaker: "Dr. Thomas Leroy",
      attendees: 156,
      maxAttendees: 200,
      status: "À venir",
      registrationUrl: "#",
      image: "/placeholder.svg?height=200&width=400",
      requiresAuth: false, // Public event
    },
    {
      id: "event-4",
      title: "Journée Portes Ouvertes du Laboratoire",
      description: "Découvrez nos installations de recherche et rencontrez notre équipe de chercheurs",
      date: "2025-01-10",
      time: "10:00",
      endTime: "16:00",
      location: "Campus Universitaire",
      category: "Portes Ouvertes",
      speaker: "Équipe complète",
      attendees: 0,
      maxAttendees: 150,
      status: "À venir",
      registrationUrl: "#",
      image: "/placeholder.svg?height=200&width=400",
      requiresAuth: false, // Public event
    },
    {
      id: "event-5",
      title: "Symposium Nanotechnologie et Applications Médicales",
      description: "Présentation des dernières recherches en nanotechnologie appliquée à la médecine",
      date: "2025-01-15",
      time: "13:30",
      endTime: "17:30",
      location: "Auditorium Principal",
      category: "Symposium",
      speaker: "Dr. Li Chen",
      attendees: 23,
      maxAttendees: 100,
      status: "À venir",
      registrationUrl: "#",
      image: "/placeholder.svg?height=200&width=400",
      requiresAuth: true,
    },
    {
      id: "event-6",
      title: "Colloque Informatique Quantique",
      description: "Discussions sur les avancées récentes en informatique quantique et cryptographie post-quantique",
      date: "2024-11-20",
      time: "14:00",
      endTime: "18:00",
      location: "Salle de Conférence B",
      category: "Colloque",
      speaker: "Dr. Carlos Garcia",
      attendees: 67,
      maxAttendees: 75,
      status: "Terminé",
      registrationUrl: "#",
      image: "/placeholder.svg?height=200&width=400",
      requiresAuth: true,
    },
    {
      id: "event-7",
      title: "Réunion Mensuelle de l'Équipe",
      description: "Réunion interne pour faire le point sur les projets en cours et planifier les prochaines étapes",
      date: "2024-12-05",
      time: "10:00",
      endTime: "12:00",
      location: "Salle de Réunion 301",
      category: "Réunion",
      speaker: "Prof. Jean Martin",
      attendees: 25,
      maxAttendees: 30,
      status: "Terminé",
      registrationUrl: "#",
      image: "/placeholder.svg?height=200&width=400",
      requiresAuth: true,
    },
    {
      id: "event-8",
      title: "Formation Éthique de la Recherche",
      description: "Session de formation obligatoire sur l'éthique de la recherche et l'intégrité scientifique",
      date: "2025-02-03",
      time: "09:00",
      endTime: "12:00",
      location: "Salle de Formation",
      category: "Formation",
      speaker: "Comité d'Éthique",
      attendees: 8,
      maxAttendees: 40,
      status: "À venir",
      registrationUrl: "#",
      image: "/placeholder.svg?height=200&width=400",
      requiresAuth: true,
    },
  ]

  const categories = Array.from(new Set(events.map((event) => event.category)))

  const filteredEvents = events.filter((event) => {
    return selectedCategory === "all" || event.category === selectedCategory
  })

  const upcomingEvents = filteredEvents.filter((event) => event.status === "À venir")
  const pastEvents = filteredEvents.filter((event) => event.status === "Terminé")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const canRegister = (event: any) => {
    if (!event.requiresAuth) return true // Public events
    return user && user.verified && user.status === "active" // Private events require verified account
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Calendar className="h-10 w-10 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-electric-600 to-violet-600 bg-clip-text text-transparent mb-6 animate-rotate-gradient bg-[length:200%_auto]">
            Événements
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos séminaires, workshops, conférences et autres événements scientifiques.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={
                selectedCategory === "all"
                  ? "bg-gradient-primary text-white"
                  : "border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white"
              }
            >
              Tous
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "bg-gradient-primary text-white"
                    : "border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Événements à Venir</h2>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <motion.div key={event.id} variants={fadeInUp}>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="relative overflow-hidden">
                      <div className="w-full h-48 bg-gradient-to-br from-violet-400 to-electric-400 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-white/80" />
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-gradient-primary text-white">{event.category}</Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-600 text-white">{event.status}</Badge>
                      </div>
                      {event.requiresAuth && (
                        <div className="absolute bottom-4 left-4">
                          <Badge className="bg-amber-600 text-white">Membres uniquement</Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader className="flex-grow">
                      <CardTitle className="text-xl text-gray-800 mb-2">{event.title}</CardTitle>
                      <p className="text-gray-600 text-sm mb-4">{event.description}</p>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-violet-600" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-violet-600" />
                          {event.time} - {event.endTime}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-violet-600" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-violet-600" />
                          {event.attendees}/{event.maxAttendees} participants
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-3">
                        <div className="text-sm text-gray-600">
                          <strong>Intervenant:</strong> {event.speaker}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                          />
                        </div>
                        {canRegister(event) ? (
                          <Button className="w-full bg-gradient-primary hover:opacity-90 text-white">S'inscrire</Button>
                        ) : event.requiresAuth ? (
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-2">Connexion requise</p>
                            <Button variant="outline" className="w-full" disabled>
                              Inscription fermée
                            </Button>
                          </div>
                        ) : (
                          <Button className="w-full bg-gradient-primary hover:opacity-90 text-white">S'inscrire</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">Aucun événement à venir dans cette catégorie.</p>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Past Events */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Événements Passés</h2>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {pastEvents.length > 0 ? (
              pastEvents.map((event) => (
                <motion.div key={event.id} variants={fadeInUp}>
                  <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-gray-400 text-gray-600">
                              {event.category}
                            </Badge>
                            <Badge className="bg-gray-600 text-white">{event.status}</Badge>
                            {event.requiresAuth && (
                              <Badge variant="outline" className="border-amber-400 text-amber-600">
                                Privé
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg text-gray-800 mb-2">{event.title}</CardTitle>
                          <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          {event.attendees} participants
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="text-violet-600 hover:text-violet-700 p-0">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Voir le résumé
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">Aucun événement passé dans cette catégorie.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
