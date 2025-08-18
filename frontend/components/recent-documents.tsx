"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Trash2, Eye } from "lucide-react"
import { formatFileSize, downloadFile, deleteFile } from "@/lib/file-service"
import { motion, AnimatePresence } from "framer-motion"

interface FileResponse {
  id: string;
  name: string;
  file: string;
  uploaded_at: string;
  file_type: string;
  size: number;
  uploaded_by?: {
    id: string;
    name: string;
  };
}

interface RecentDocumentsProps {
  userFiles: FileResponse[];
  currentUserId: string;
  onFileDelete: (fileId: string) => void;
}

export function RecentDocuments({ userFiles, currentUserId, onFileDelete }: RecentDocumentsProps) {
  const [showAllDocuments, setShowAllDocuments] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isUserFile = (file: FileResponse) => {
    return file.uploaded_by?.id === currentUserId
  }

  const recentFiles = userFiles.slice(0, 3)

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-800">Documents récents :</h4>
        {userFiles.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllDocuments(!showAllDocuments)}
            className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <Eye className="h-3 w-3 mr-1" />
            {showAllDocuments ? "Réduire" : "Voir tous"}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!showAllDocuments ? (
          // Recent 3 documents view
          <motion.div
            key="recent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {recentFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {formatDate(file.uploaded_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-800"
                    onClick={async () => {
                      try {
                        await downloadFile(file.file, file.name);
                      } catch (error) {
                        console.error('Error downloading file:', error);
                      }
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  {isUserFile(file) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-800"
                      onClick={async () => {
                        try {
                          await deleteFile(file.id);
                          onFileDelete(file.id);
                        } catch (error) {
                          console.error('Error deleting file:', error);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {userFiles.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                Aucun document disponible
              </p>
            )}
          </motion.div>
        ) : (
          // All documents table view
          <motion.div
            key="all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Tous les documents
                </CardTitle>
                <CardDescription>
                  {userFiles.length} document{userFiles.length > 1 ? 's' : ''} au total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom du fichier</TableHead>
                      <TableHead>Téléchargé par</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span>{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{file.uploaded_by?.name || 'Utilisateur'}</span>
                            {isUserFile(file) && (
                              <Badge variant="secondary" className="text-xs">
                                Vous
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(file.uploaded_at)}</TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-800"
                              onClick={async () => {
                                try {
                                  await downloadFile(file.file, file.name);
                                } catch (error) {
                                  console.error('Error downloading file:', error);
                                }
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            {isUserFile(file) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-800"
                                onClick={async () => {
                                  try {
                                    await deleteFile(file.id);
                                    onFileDelete(file.id);
                                  } catch (error) {
                                    console.error('Error deleting file:', error);
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