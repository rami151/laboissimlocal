"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Users,
  Calendar,
  Briefcase,
  Sparkles,
} from "lucide-react"
import { useContentManager } from "@/lib/content-manager"
import { useAuth } from "@/components/auth-provider"

export default function ContactPage() {
  const { content } = useContentManager()
  const { addMessage } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      addMessage(formData)
      setIsSubmitted(true)

      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({
          name: "",
          email: "",
          subject: "",
          category: "",
          message: "",
        })
      }, 3000)
    } catch (error) {
      console.error("Error submitting message:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

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

  const contactMethods = [
    {
      icon: MapPin,
      title: "Adresse",
      content: content.contact.address,
      color: "indigo",
    },
    {
      icon: Phone,
      title: "Téléphone",
      content: content.contact.phone,
      color: "purple",
    },
    {
      icon: Mail,
      title: "Email",
      content: content.contact.email,
      color: "amber",
    },
    {
      icon: Clock,
      title: "Horaires",
      content: content.contact.hours,
      color: "indigo",
    },
  ]

  const contactCategories = [
    {
      value: "collaboration",
      label: "Collaboration de recherche",
      icon: Users,
      description: "Partenariats scientifiques et projets collaboratifs",
    },
    {
      value: "stage",
      label: "Demande de stage",
      icon: Calendar,
      description: "Opportunités de stage et formation",
    },
    {
      value: "emploi",
      label: "Opportunité d'emploi",
      icon: Briefcase,
      description: "Postes disponibles et candidatures",
    },
    {
      value: "media",
      label: "Demande média",
      icon: MessageSquare,
      description: "Interviews et couverture médiatique",
    },
    {
      value: "partenariat",
      label: "Partenariat industriel",
      icon: Sparkles,
      description: "Collaborations avec l'industrie",
    },
    {
      value: "autre",
      label: "Autre",
      icon: Mail,
      description: "Autres demandes et questions",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl animate-pulse-glow"
          >
            <Mail className="h-12 w-12 text-white icon-enhanced" />
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-bold text-gradient mb-8 heading-modern">Contactez-Nous</h1>
          <p className="text-xl text-professional max-w-3xl mx-auto leading-relaxed">
            Nous sommes là pour répondre à vos questions et explorer de nouvelles opportunités de collaboration
            scientifique.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <Card className="card-professional border-0 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <CardTitle className="text-3xl text-slate-800 heading-modern flex items-center">
                    <MessageSquare className="h-8 w-8 mr-3 text-indigo-600 icon-enhanced" />
                    Envoyez-nous un message
                  </CardTitle>
                  <p className="text-professional mt-2">
                    Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-center py-16"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                      >
                        <CheckCircle className="h-12 w-12 text-green-600 icon-enhanced" />
                      </motion.div>
                      <h3 className="text-3xl font-bold text-slate-800 mb-4 heading-modern">Message envoyé !</h3>
                      <p className="text-professional text-lg">
                        Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <motion.div
                          className="space-y-3"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Label htmlFor="contact-name" className="text-slate-700 font-medium">
                            Nom complet *
                          </Label>
                          <Input
                            id="contact-name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Votre nom complet"
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg h-12"
                            required
                          />
                        </motion.div>
                        <motion.div
                          className="space-y-3"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Label htmlFor="contact-email" className="text-slate-700 font-medium">
                            Email *
                          </Label>
                          <Input
                            id="contact-email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="votre@email.com"
                            className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg h-12"
                            required
                          />
                        </motion.div>
                      </div>

                      <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Label htmlFor="contact-category" className="text-slate-700 font-medium">
                          Catégorie de demande *
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg h-12">
                            <SelectValue placeholder="Sélectionnez une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {contactCategories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center space-x-3">
                                  <category.icon className="h-4 w-4 text-indigo-600 icon-enhanced" />
                                  <div>
                                    <div className="font-medium">{category.label}</div>
                                    <div className="text-xs text-slate-500">{category.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Label htmlFor="contact-subject" className="text-slate-700 font-medium">
                          Sujet *
                        </Label>
                        <Input
                          id="contact-subject"
                          name="subject"
                          type="text"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Sujet de votre message"
                          className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg h-12"
                          required
                        />
                      </motion.div>

                      <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Label htmlFor="contact-message" className="text-slate-700 font-medium">
                          Message *
                        </Label>
                        <Textarea
                          id="contact-message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Décrivez votre demande en détail..."
                          rows={6}
                          className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg resize-none"
                          required
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full btn-modern text-white py-4 text-lg rounded-xl relative overflow-hidden group"
                        >
                          {isSubmitting ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                            />
                          ) : (
                            <>
                              <span className="relative z-10 flex items-center justify-center">
                                <Send className="h-5 w-5 mr-3 icon-enhanced" />
                                Envoyer le message
                              </span>
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="card-professional border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <CardTitle className="text-2xl text-slate-800 heading-modern">Informations de Contact</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
                    {contactMethods.map((method, index) => (
                      <motion.div
                        key={index}
                        variants={fadeInUp}
                        className="flex items-start space-x-4 group hover-lift p-3 rounded-lg hover:bg-slate-50 transition-all duration-300"
                      >
                        <div
                          className={`w-14 h-14 bg-${method.color}-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                        >
                          <method.icon className={`h-7 w-7 text-${method.color}-600 icon-enhanced`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 mb-1 heading-modern">{method.title}</h4>
                          <p className="text-professional leading-relaxed">{method.content}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="card-professional border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <CardTitle className="text-2xl text-slate-800 heading-modern flex items-center">
                    <Sparkles className="h-6 w-6 mr-2 text-amber-600 icon-enhanced" />
                    Rejoignez Notre Équipe
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-professional mb-6 leading-relaxed">
                    Nous recherchons constamment des talents passionnés pour rejoindre notre équipe de recherche
                    d'excellence.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 rounded-lg py-3 hover-lift"
                  >
                    <Briefcase className="h-5 w-5 mr-2 icon-enhanced" />
                    Voir les opportunités
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="gradient-primary text-white border-0 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-white/10" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-2xl heading-modern">Réponse Rapide</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-indigo-100">Réponse sous 24h</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
                      <span className="text-indigo-100">Support multilingue</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
                      <span className="text-indigo-100">Équipe dédiée</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20"
        >
          <Card className="card-professional border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-100">
              <CardTitle className="text-3xl text-slate-800 text-center heading-modern flex items-center justify-center">
                <MapPin className="h-8 w-8 mr-3 text-indigo-600 icon-enhanced" />
                Notre Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-96 bg-gradient-to-br from-indigo-100 via-purple-100 to-amber-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/30 to-purple-200/30" />
                <motion.div
                  className="text-center relative z-10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1 }}
                >
                  <motion.div
                    className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse-glow"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <MapPin className="h-10 w-10 text-white icon-enhanced" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 heading-modern">Carte Interactive</h3>
                  <p className="text-professional text-lg">{content.contact.address}</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
