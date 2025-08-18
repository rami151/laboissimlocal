"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Trash2, Eye } from "lucide-react"
import { deletePublication } from "@/lib/publication-service"
import { motion, AnimatePresence } from "framer-motion"

interface PublicationResponse {
  id: string;
  title: string;
  abstract: string;
  posted_at: string;
  posted_by?: {
    id: string;
    name: string;
  };
}

interface RecentPublicationsProps {
  publications: PublicationResponse[];
  currentUserId: string;
  onPublicationDelete: (publicationId: string) => void;
}

export function RecentPublications({ publications, currentUserId, onPublicationDelete }: RecentPublicationsProps) {
  const [showAllPublications, setShowAllPublications] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isUserPublication = (publication: PublicationResponse) => {
    return publication.posted_by?.id === currentUserId
  }

  const recentPublications = publications.slice(0, 3)

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-800">Publications récentes :</h4>
        {publications.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllPublications(!showAllPublications)}
            className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
          >
            <Eye className="h-3 w-3 mr-1" />
            {showAllPublications ? "Réduire" : "Voir tous"}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!showAllPublications ? (
          // Recent 3 publications view
          <motion.div
            key="recent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {recentPublications.map((publication) => (
              <div key={publication.id} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <h5 className="font-medium text-gray-800">{publication.title}</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{publication.abstract}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{publication.posted_by?.name || 'Utilisateur'}</span>
                        {isUserPublication(publication) && (
                          <Badge variant="secondary" className="text-xs">
                            Vous
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(publication.posted_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    {isUserPublication(publication) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800"
                        onClick={async () => {
                          try {
                            await deletePublication(publication.id);
                            onPublicationDelete(publication.id);
                          } catch (error) {
                            console.error('Error deleting publication:', error);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {publications.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                Aucune publication disponible
              </p>
            )}
          </motion.div>
        ) : (
          // All publications table view
          <motion.div
            key="all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  Toutes les publications
                </CardTitle>
                <CardDescription>
                  {publications.length} publication{publications.length > 1 ? 's' : ''} au total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Publié par</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publications.map((publication) => (
                      <TableRow key={publication.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-green-600" />
                              <span>{publication.title}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{publication.abstract}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{publication.posted_by?.name || 'Utilisateur'}</span>
                            {isUserPublication(publication) && (
                              <Badge variant="secondary" className="text-xs">
                                Vous
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(publication.posted_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isUserPublication(publication) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-800"
                                onClick={async () => {
                                  try {
                                    await deletePublication(publication.id);
                                    onPublicationDelete(publication.id);
                                  } catch (error) {
                                    console.error('Error deleting publication:', error);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
