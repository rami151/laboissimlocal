"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  MapPin,
  Building,
  Globe,
  Linkedin,
  Twitter,
  Github,
  ArrowLeft,
  ExternalLink,
} from "lucide-react"
import { TeamMember } from "@/lib/team-service"
import { getPublications, PublicationResponse } from "@/lib/publication-service"

export default function TeamMemberProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [member, setMember] = useState<TeamMember | null>(null)
  const [memberPublications, setMemberPublications] = useState<PublicationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPublications, setLoadingPublications] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchMemberData()
      fetchMemberPublications()
    }
  }, [params.id])

  const fetchMemberData = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:8000/api/team-members/")
      if (response.ok) {
        const members = await response.json()
        const foundMember = members.find((m: TeamMember) => m.id.toString() === params.id)
        if (foundMember) {
          setMember(foundMember)
        } else {
          // Member not found, redirect to about page
          router.push("/about?tab=team")
        }
      } else {
        router.push("/about?tab=team")
      }
    } catch (error) {
      console.error("Error fetching member data:", error)
      router.push("/about?tab=team")
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberPublications = async () => {
    try {
      setLoadingPublications(true)
      const publications = await getPublications()
      // Filter publications by this member
      const memberPubs = publications.filter(pub => pub.posted_by?.id === params.id)
      setMemberPublications(memberPubs)
    } catch (error) {
      console.error("Error fetching member publications:", error)
    } finally {
      setLoadingPublications(false)
    }
  }

  const getProfileImageUrl = (member: TeamMember) => {
    if (member.profile?.profile_image) {
      return `http://localhost:8000${member.profile.profile_image}`
    }
    return "/placeholder-user.jpg"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Membre non trouvé</h1>
            <Button onClick={() => router.push("/about?tab=team")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'équipe
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push("/about?tab=team")}
                className="mb-4 text-purple-600 hover:text-purple-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'équipe
              </Button>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Profil de {member.full_name}</h1>
              <p className="text-xl text-gray-600">Membre de l'équipe de recherche</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={getProfileImageUrl(member)} 
                      alt={member.full_name}
                    />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      {member.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl font-bold text-gray-800">{member.full_name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {member.profile?.institution || "Membre de l'équipe"}
                  </CardDescription>
                  <Badge className="mt-2 bg-purple-600 text-white">
                    {member.is_staff ? "Staff" : "Membre"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-purple-600" />
                      Contact
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{member.email}</span>
                      </div>
                      {member.profile?.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{member.profile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Location & Institution */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                      Localisation
                    </h3>
                    <div className="space-y-2">
                      {member.profile?.location && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{member.profile.location}</span>
                        </div>
                      )}
                      {member.profile?.institution && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="h-4 w-4" />
                          <span>{member.profile.institution}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Social Links */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-purple-600" />
                      Réseaux sociaux
                    </h3>
                                         <div className="flex items-center space-x-2">
                       {member.profile?.website && (
                         <a href={member.profile.website} target="_blank" rel="noopener noreferrer">
                           <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                             <Globe className="h-4 w-4" />
                           </Button>
                         </a>
                       )}
                       {member.profile?.linkedin && (
                         <a href={member.profile.linkedin} target="_blank" rel="noopener noreferrer">
                           <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                             <Linkedin className="h-4 w-4" />
                           </Button>
                         </a>
                       )}
                       {member.profile?.twitter && (
                         <a href={member.profile.twitter} target="_blank" rel="noopener noreferrer">
                           <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-500">
                             <Twitter className="h-4 w-4" />
                           </Button>
                         </a>
                       )}
                       {member.profile?.github && (
                         <a href={member.profile.github} target="_blank" rel="noopener noreferrer">
                           <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700">
                             <Github className="h-4 w-4" />
                           </Button>
                         </a>
                       )}
                     </div>
                  </div>

                  <Separator />

                  {/* Member Since */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Membre depuis</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatDate(member.date_joined)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Bio & Publications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-purple-600" />
                    À propos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {member.profile?.bio || "Aucune biographie disponible."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Publications Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                      Publications
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      {memberPublications.length} publication{memberPublications.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Publications et contributions à la recherche
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPublications ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : memberPublications.length > 0 ? (
                    <div className="space-y-4">
                      {memberPublications.map((publication) => (
                        <motion.div
                          key={publication.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 mb-2">{publication.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{publication.abstract}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(publication.posted_at)}
                                </span>
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {publication.posted_by?.name || member.full_name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune publication disponible pour le moment</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
