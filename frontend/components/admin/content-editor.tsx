"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Edit3 } from "lucide-react"
import { type SiteContent, useContentManager } from "@/lib/content-manager"

export function ContentEditor() {
  const { content, updateContent, isAdmin } = useContentManager()
  const [editingContent, setEditingContent] = useState<SiteContent>(content)
  const [isSaving, setIsSaving] = useState(false)

  if (!isAdmin) {
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
    updateContent(editingContent)
    setIsSaving(false)
  }

  const handleInputChange = (section: keyof SiteContent, field: string, value: string | number) => {
    setEditingContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 bg-white/95 backdrop-blur-sm border border-indigo-200 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-indigo-700">
            <Edit3 className="h-5 w-5 mr-2" />
            Éditeur de Contenu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hero">Accueil</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="about">À propos</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="hero-title">Titre principal</Label>
                <Input
                  id="hero-title"
                  value={editingContent.hero.title}
                  onChange={(e) => handleInputChange("hero", "title", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hero-subtitle">Sous-titre</Label>
                <Input
                  id="hero-subtitle"
                  value={editingContent.hero.subtitle}
                  onChange={(e) => handleInputChange("hero", "subtitle", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hero-description">Description</Label>
                <Textarea
                  id="hero-description"
                  value={editingContent.hero.description}
                  onChange={(e) => handleInputChange("hero", "description", e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="researchers">Chercheurs</Label>
                  <Input
                    id="researchers"
                    type="number"
                    value={editingContent.stats.researchers}
                    onChange={(e) => handleInputChange("stats", "researchers", Number.parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="publications">Publications</Label>
                  <Input
                    id="publications"
                    type="number"
                    value={editingContent.stats.publications}
                    onChange={(e) => handleInputChange("stats", "publications", Number.parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="awards">Prix reçus</Label>
                  <Input
                    id="awards"
                    type="number"
                    value={editingContent.stats.awards}
                    onChange={(e) => handleInputChange("stats", "awards", Number.parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="events">Événements</Label>
                  <Input
                    id="events"
                    type="number"
                    value={editingContent.stats.events}
                    onChange={(e) => handleInputChange("stats", "events", Number.parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="about" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="team-name">Nom de l'équipe</Label>
                <Input
                  id="team-name"
                  value={editingContent.about.teamName}
                  onChange={(e) => handleInputChange("about", "teamName", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="team-description">Description</Label>
                <Textarea
                  id="team-description"
                  value={editingContent.about.description}
                  onChange={(e) => handleInputChange("about", "description", e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  value={editingContent.contact.email}
                  onChange={(e) => handleInputChange("contact", "email", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contact-phone">Téléphone</Label>
                <Input
                  id="contact-phone"
                  value={editingContent.contact.phone}
                  onChange={(e) => handleInputChange("contact", "phone", e.target.value)}
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
