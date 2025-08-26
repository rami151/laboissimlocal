"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  X,
  BookOpen,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Camera,
  Plus,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { getPublications, deletePublication } from "@/lib/publication-service"
import { updateUserProfile, getUserProfile, UserProfile } from "@/lib/profile-service"

interface ExtendedUser {
  id: string
  email: string
  name: string
  role: "member" | "admin"
  status: "active" | "banned" | "pending"
  lastLogin?: string
  date_joined: string
  verified: boolean
  phone?: string
  bio?: string
  profileImage?: string
  location?: string
  institution?: string
  website?: string
  linkedin?: string
  twitter?: string
  github?: string
}

interface PublicationResponse {
  id: string
  title: string
  abstract: string
  posted_at: string
  posted_by?: {
    id: string
    name: string
  }
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [userPublications, setUserPublications] = useState<PublicationResponse[]>([])
  const [loadingPublications, setLoadingPublications] = useState(true)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Extended user data with additional profile fields
  const [extendedUser, setExtendedUser] = useState<ExtendedUser>({
    id: user?.id || "",
    email: user?.email || "",
    name: user?.name || "",
    role: user?.role || "member",
    status: user?.status || "active",
    lastLogin: user?.lastLogin,
    date_joined: user?.date_joined || "",
    verified: user?.verified || false,
    phone: "",
    bio: "",
    profileImage: "",
    location: "",
    institution: "",
    website: "",
    linkedin: "",
    twitter: "",
    github: "",
  })

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      // Update extended user when user data is available
      setExtendedUser(prev => ({
        ...prev,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        date_joined: user.date_joined || new Date().toISOString(),
        verified: user.verified,
      }))

      // Fetch user's profile data
      fetchUserProfile()
      // Fetch user's publications
      fetchUserPublications()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const profile = await getUserProfile()
      setExtendedUser(prev => ({
        ...prev,
        phone: profile.phone || "",
        bio: profile.bio || "",
        profileImage: profile.profile_image || "",
        location: profile.location || "",
        institution: profile.institution || "",
        website: profile.website || "",
        linkedin: profile.linkedin || "",
        twitter: profile.twitter || "",
        github: profile.github || "",
      }))
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchUserPublications = async () => {
    try {
      setLoadingPublications(true)
      const publications = await getPublications()
      // Filter publications by current user
      const userPubs = publications.filter(pub => pub.posted_by?.id === user?.id)
      setUserPublications(userPubs)
    } catch (error) {
      console.error('Error fetching publications:', error)
    } finally {
      setLoadingPublications(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      // Prepare profile data for API
      const profileData: Partial<UserProfile> = {
        phone: extendedUser.phone || undefined,
        bio: extendedUser.bio || undefined,
        location: extendedUser.location || undefined,
        institution: extendedUser.institution || undefined,
        website: extendedUser.website || undefined,
        linkedin: extendedUser.linkedin || undefined,
        twitter: extendedUser.twitter || undefined,
        github: extendedUser.github || undefined,
      }

      // Remove undefined values
      Object.keys(profileData).forEach(key => {
        if (profileData[key as keyof UserProfile] === undefined) {
          delete profileData[key as keyof UserProfile]
        }
      })

      // Create FormData for file upload
      const formData = new FormData()
      
      // Add profile image if selected
      if (profileImage) {
        formData.append('profile_image', profileImage)
      }
      
      // Add other profile data
      Object.keys(profileData).forEach(key => {
        if (profileData[key as keyof UserProfile] !== undefined) {
          formData.append(key, profileData[key as keyof UserProfile] as string)
        }
      })

      // Update profile in database
      if (profileImage) {
        // Use FormData for file upload
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:8000/api/user/profile', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`Failed to update profile: ${response.statusText}`)
        }
      } else {
        // Use JSON for text-only updates
        await updateUserProfile(profileData)
      }
      
      setIsEditing(false)
      setProfileImage(null)
      setPreviewImage(null)
      // Refresh profile data
      await fetchUserProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      // You might want to show a toast notification here
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setProfileImage(null)
    setPreviewImage(null)
  }

  const handleDeletePublication = async (publicationId: string) => {
    try {
      await deletePublication(publicationId)
      setUserPublications(prev => prev.filter(pub => pub.id !== publicationId))
    } catch (error) {
      console.error('Error deleting publication:', error)
    }
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

  if (!user) {
    return null
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Profil</h1>
              <p className="text-xl text-gray-600">Gérez vos informations personnelles et vos publications</p>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              )}
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
                  <div className="relative inline-block">
                                         <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white shadow-lg">
                       <AvatarImage 
                         src={previewImage || extendedUser.profileImage || undefined} 
                         alt={extendedUser.name}
                       />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        {extendedUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute bottom-2 right-2">
                        <Label htmlFor="profile-image" className="cursor-pointer">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors">
                            <Camera className="h-4 w-4 text-gray-600" />
                          </div>
                        </Label>
                        <Input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">{extendedUser.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {extendedUser.role === "admin" ? "Administrateur" : "Membre"}
                  </CardDescription>
                  <Badge className={`mt-2 ${extendedUser.role === "admin" ? "bg-purple-600" : "bg-blue-600"} text-white`}>
                    {extendedUser.role === "admin" ? "Administrateur" : "Membre"}
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
                        <span>{extendedUser.email}</span>
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            value={extendedUser.phone || ""}
                            onChange={(e) => setExtendedUser(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Votre numéro de téléphone"
                          />
                        </div>
                      ) : (
                        extendedUser.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{extendedUser.phone}</span>
                          </div>
                        )
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
                      {isEditing ? (
                        <div className="space-y-2">
                          <Label htmlFor="location">Ville</Label>
                          <Input
                            id="location"
                            value={extendedUser.location || ""}
                            onChange={(e) => setExtendedUser(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Votre ville"
                          />
                          <Label htmlFor="institution">Institution</Label>
                          <Input
                            id="institution"
                            value={extendedUser.institution || ""}
                            onChange={(e) => setExtendedUser(prev => ({ ...prev, institution: e.target.value }))}
                            placeholder="Votre institution"
                          />
                        </div>
                      ) : (
                        <>
                          {extendedUser.location && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{extendedUser.location}</span>
                            </div>
                          )}
                          {extendedUser.institution && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <GraduationCap className="h-4 w-4" />
                              <span>{extendedUser.institution}</span>
                            </div>
                          )}
                        </>
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
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="website">Site web</Label>
                          <Input
                            id="website"
                            value={extendedUser.website || ""}
                            onChange={(e) => setExtendedUser(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://votre-site.com"
                            type="url"
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            value={extendedUser.linkedin || ""}
                            onChange={(e) => setExtendedUser(prev => ({ ...prev, linkedin: e.target.value }))}
                            placeholder="https://linkedin.com/in/votre-profil"
                            type="url"
                          />
                        </div>
                        <div>
                          <Label htmlFor="twitter">Twitter</Label>
                          <Input
                            id="twitter"
                            value={extendedUser.twitter || ""}
                            onChange={(e) => setExtendedUser(prev => ({ ...prev, twitter: e.target.value }))}
                            placeholder="https://twitter.com/votre-profil"
                            type="url"
                          />
                        </div>
                        <div>
                          <Label htmlFor="github">GitHub</Label>
                          <Input
                            id="github"
                            value={extendedUser.github || ""}
                            onChange={(e) => setExtendedUser(prev => ({ ...prev, github: e.target.value }))}
                            placeholder="https://github.com/votre-profil"
                            type="url"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {extendedUser.website && (
                          <a href={extendedUser.website} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              <Globe className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        {extendedUser.linkedin && (
                          <a href={extendedUser.linkedin} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              <Linkedin className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        {extendedUser.twitter && (
                          <a href={extendedUser.twitter} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-500">
                              <Twitter className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        {extendedUser.github && (
                          <a href={extendedUser.github} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700">
                              <Github className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Member Since */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Membre depuis</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatDate(extendedUser.date_joined)}
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
                  {isEditing ? (
                    <div className="space-y-3">
                      <Label htmlFor="bio">Biographie</Label>
                      <Textarea
                        id="bio"
                        value={extendedUser.bio || ""}
                        onChange={(e) => setExtendedUser(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Parlez-nous de vous..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {extendedUser.bio || "Aucune biographie disponible."}
                    </p>
                  )}
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
                      Mes Publications
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      {userPublications.length} publication{userPublications.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Vos publications et contributions à la recherche
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
                  ) : userPublications.length > 0 ? (
                    <div className="space-y-4">
                      {userPublications.map((publication) => (
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
                                  {publication.posted_by?.name || "Vous"}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeletePublication(publication.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Aucune publication pour le moment</p>
                      <Button
                        onClick={() => router.push('/dashboard')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer une publication
                      </Button>
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
