"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, History, Lightbulb, User, Mail, MapPin, Building } from "lucide-react"
import { useContentManager } from "@/lib/content-manager"
import { useTeamMembers, TeamMember } from "@/lib/team-service"

export default function AboutPage() {
  const { content } = useContentManager()
  const { members, loading, error } = useTeamMembers()
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("history")

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["history", "team", "expertise"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

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

  const handleMemberClick = (member: TeamMember) => {
    router.push(`/profile/${member.id}`)
  }

  const getProfileImageUrl = (member: TeamMember) => {
    if (member.profile?.profile_image) {
      return `http://localhost:8000${member.profile.profile_image}`
    }
    return "/placeholder-user.jpg"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            À Propos de Notre Équipe
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une équipe pluridisciplinaire dédiée à l'innovation et à la découverte scientifique, repoussant les
            frontières de la connaissance depuis plus de 10 ans.
          </p>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} defaultValue="history" className="mb-16">
          {/* History Tab */}
          <TabsContent value="history">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">{content.about.history.title}</h2>
                <div className="space-y-4 text-gray-600">
                  {content.about.history.content.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">Nos Valeurs</h3>
                  <ul className="space-y-2">
                    {content.about.history.values.map((value, index) => (
                      <li key={index} className="flex items-start">
                        <div className="mr-2 mt-1 bg-purple-600 rounded-full p-1">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                        </div>
                        <span className="text-gray-600">
                          <strong className="text-gray-800">{value.title}</strong> - {value.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative rounded-xl overflow-hidden shadow-xl">
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Équipe de recherche"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {content.about.history.achievements.founded}
                    </div>
                    <div className="text-gray-700">Fondation de l'équipe</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {content.about.history.achievements.researchers}
                    </div>
                    <div className="text-gray-700">Chercheurs permanents</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                      {content.about.history.achievements.publications}
                    </div>
                    <div className="text-gray-700">Publications scientifiques</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {content.about.history.achievements.awards}
                    </div>
                    <div className="text-gray-700">Prix d'excellence</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="space-y-12"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Notre Équipe de Recherche</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Découvrez les chercheurs passionnés qui composent notre équipe pluridisciplinaire
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600">Erreur lors du chargement de l'équipe: {error}</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Aucun membre d'équipe trouvé.</p>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {members.map((member, index) => (
                    <motion.div key={member.id} variants={fadeInUp}>
                      <Card
                        className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col"
                        onClick={() => handleMemberClick(member)}
                      >
                        <div className="relative overflow-hidden">
                          <Image
                            src={getProfileImageUrl(member)}
                            alt={member.full_name}
                            width={300}
                            height={300}
                            className="w-full h-64 object-cover object-center"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                                          <div className="p-6 text-white">
                                <h3 className="text-xl font-bold">{member.full_name}</h3>
                                <p className="text-purple-200">
                                  {member.profile?.institution || "Membre de l'équipe"}
                                </p>
                              </div>
                          </div>
                        </div>
                        <CardContent className="flex-grow flex flex-col p-6">
                          <div className="mb-4 flex-grow">
                            <p className="text-gray-600 line-clamp-3">
                              {member.profile?.bio || "Aucune biographie disponible."}
                            </p>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            {member.profile?.location && (
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-4 w-4 mr-2" />
                                {member.profile.location}
                              </div>
                            )}
                            {member.profile?.institution && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Building className="h-4 w-4 mr-2" />
                                {member.profile.institution}
                              </div>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            className="text-purple-600 hover:text-purple-700 p-0 justify-start group"
                          >
                            Voir le profil
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </TabsContent>

          {/* Expertise Tab */}
          <TabsContent value="expertise">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="space-y-12"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Nos Domaines d'Expertise</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Découvrez les domaines de recherche dans lesquels notre équipe excelle et innove
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {content.about.expertise.map((domain, index) => (
                  <Card
                    key={index}
                    className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="relative overflow-hidden">
                        <Image
                          src="/placeholder.svg?height=300&width=400"
                          alt={domain.title}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">{domain.title}</h3>
                        <p className="text-gray-600 mb-6">{domain.description}</p>
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-800">Compétences clés :</h4>
                          <div className="flex flex-wrap gap-2">
                            {domain.skills.map((skill, i) => (
                              <Badge
                                key={i}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
