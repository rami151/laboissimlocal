"use client"

// Système de gestion de contenu dynamique
export interface SiteContent {
  hero: {
    title: string
    subtitle: string
    description: string
    primaryButtonText: string
    secondaryButtonText: string
  }
  stats: {
    researchers: number
    publications: number
    awards: number
    events: number
  }
  about: {
    teamName: string
    description: string
    mission: string
    history: {
      title: string
      content: string[]
      values: Array<{
        title: string
        description: string
      }>
      achievements: {
        founded: string
        researchers: string
        publications: string
        awards: string
      }
    }
    team: Array<{
      id: string
      name: string
      role: string
      bio: string
      expertise: string[]
      education: string
      publications: number
      citations: number
    }>
    expertise: Array<{
      title: string
      description: string
      skills: string[]
    }>
  }
  contact: {
    address: string
    phone: string
    email: string
    hours: string
  }
  logo: {
    text: string
    subtitle: string
  }
  footer: {
    researchDomains: string[]
    teamIntroduction: string
    teamName: string
    copyright: string
  }
}

// Contenu par défaut (modifiable par l'admin)
export const defaultContent: SiteContent = {
  hero: {
    title: "Innovation & Excellence Scientifique",
    subtitle: "Laboratoire de Recherche Avancée",
    description:
      "Nous repoussons les frontières de la connaissance à travers des recherches innovantes et des collaborations interdisciplinaires de premier plan.",
    primaryButtonText: "Découvrir nos projets",
    secondaryButtonText: "Rejoindre l'équipe",
  },
  stats: {
    researchers: 28,
    publications: 156,
    awards: 15,
    events: 52,
  },
  about: {
    teamName: "Équipe de Recherche Excellence",
    description: "Une équipe pluridisciplinaire dédiée à l'innovation scientifique",
    mission: "Transformer les découvertes scientifiques en solutions concrètes pour la société",
    history: {
      title: "Notre Histoire",
      content: [
        "Notre équipe de recherche a été fondée en 2010 par le Professeur Jean Martin avec une vision claire : créer un environnement de recherche interdisciplinaire où les frontières traditionnelles entre les domaines scientifiques seraient dépassées.",
        "Ce qui a commencé comme un petit groupe de trois chercheurs passionnés s'est rapidement développé pour devenir l'un des centres de recherche les plus dynamiques et innovants du pays, attirant des talents du monde entier.",
        "Au fil des années, notre équipe a été reconnue pour ses contributions significatives dans divers domaines, de l'intelligence artificielle éthique aux énergies renouvelables, en passant par la médecine personnalisée et la nanotechnologie.",
        "Aujourd'hui, nous sommes fiers de compter plus de 25 chercheurs permanents et de nombreux collaborateurs internationaux, tous unis par la même passion pour la découverte scientifique et l'innovation responsable.",
      ],
      values: [
        {
          title: "Excellence scientifique",
          description: "Nous visons l'excellence dans toutes nos recherches et publications.",
        },
        {
          title: "Collaboration",
          description: "Nous croyons en la puissance de la collaboration interdisciplinaire.",
        },
        {
          title: "Innovation responsable",
          description: "Nous développons des technologies qui bénéficient à la société.",
        },
        {
          title: "Diversité et inclusion",
          description: "Nous valorisons la diversité des perspectives et des expériences.",
        },
      ],
      achievements: {
        founded: "2010",
        researchers: "25+",
        publications: "150+",
        awards: "12",
      },
    },
    team: [
      {
        id: "prof-martin",
        name: "Prof. Jean Martin",
        role: "Directeur de Recherche",
        bio: "Le Professeur Jean Martin dirige l'équipe depuis sa création en 2010. Spécialiste en intelligence artificielle éthique, il a publié plus de 100 articles dans des revues internationales et reçu le Prix d'Excellence en Recherche en 2018.",
        expertise: ["Intelligence Artificielle", "Éthique des Technologies", "Apprentissage Automatique"],
        education: "Doctorat en Informatique, École Polytechnique (2005)",
        publications: 120,
        citations: 5600,
      },
      {
        id: "dr-dubois",
        name: "Dr. Sophie Dubois",
        role: "Chercheuse Principale",
        bio: "Dr. Sophie Dubois est spécialisée en biotechnologie et médecine personnalisée. Ses travaux sur les thérapies géniques ont été publiés dans Nature et Science. Elle a rejoint l'équipe en 2015 après un post-doctorat à Harvard.",
        expertise: ["Biotechnologie", "Médecine Personnalisée", "Thérapie Génique"],
        education: "Doctorat en Biologie Moléculaire, Université de Paris (2012)",
        publications: 85,
        citations: 3200,
      },
    ],
    expertise: [
      {
        title: "Intelligence Artificielle Éthique",
        description:
          "Nous développons des algorithmes d'IA responsables et transparents, en mettant l'accent sur l'équité, l'explicabilité et la protection de la vie privée.",
        skills: ["Apprentissage automatique", "IA explicable", "Équité algorithmique", "Gouvernance de l'IA"],
      },
      {
        title: "Médecine Personnalisée",
        description:
          "Notre recherche en médecine personnalisée vise à adapter les traitements médicaux aux caractéristiques individuelles de chaque patient.",
        skills: ["Génomique", "Thérapie ciblée", "Biomarqueurs", "Médecine de précision"],
      },
    ],
  },
  contact: {
    address: "123 Avenue de la Recherche, 75001 Paris, France",
    phone: "+33 1 23 45 67 89",
    email: "contact@research-excellence.fr",
    hours: "Lundi - Vendredi: 9h00 - 18h00",
  },
  logo: {
    text: "Research Excellence",
    subtitle: "Laboratoire d'Innovation",
  },
  footer: {
    researchDomains: ["", "", "", "", ""],
    teamIntroduction: "",
    teamName: "",
    copyright: "",
  },
}

// Hook pour gérer le contenu
import { useState, useEffect } from "react"

export function useContentManager() {
  const [content, setContent] = useState<SiteContent>(defaultContent)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContent() {
      setLoading(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        const res = await fetch("http://localhost:8000/api/site-content/", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          // Map backend fields to SiteContent structure
          setContent(prev => ({
            ...prev,
            contact: {
              address: data.contact_address || "",
              phone: data.contact_phone || "",
              email: data.contact_email || "",
              hours: data.contact_hours || "",
            },
            footer: {
              researchDomains: data.footer_research_domains || ["", "", "", "", ""],
              teamIntroduction: data.footer_team_introduction || "",
              teamName: data.footer_team_name || "",
              copyright: data.footer_copyright || "",
            },
          }))
        } else {
          // fallback to localStorage
          const savedContent = localStorage.getItem("siteContent")
          if (savedContent) {
            setContent(JSON.parse(savedContent))
          }
        }
      } catch (e) {
        // fallback to localStorage
        const savedContent = localStorage.getItem("siteContent")
        if (savedContent) {
          setContent(JSON.parse(savedContent))
        }
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
    // Vérifier si l'utilisateur est admin
    const userRole = localStorage.getItem("userRole")
    setIsAdmin(userRole === "admin")
  }, [])

  const updateContent = async (newContent: Partial<SiteContent>) => {
    // Update local state immediately for responsiveness
    const updatedContent = { ...content, ...newContent }
    setContent(updatedContent)
    localStorage.setItem("siteContent", JSON.stringify(updatedContent))
    // Prepare backend payload
    const payload: any = {}
    if (newContent.contact) {
      payload.contact_address = newContent.contact.address
      payload.contact_phone = newContent.contact.phone
      payload.contact_email = newContent.contact.email
      payload.contact_hours = newContent.contact.hours
    }
    if (newContent.footer) {
      payload.footer_research_domains = newContent.footer.researchDomains
      payload.footer_team_introduction = newContent.footer.teamIntroduction
      payload.footer_team_name = newContent.footer.teamName
      payload.footer_copyright = newContent.footer.copyright
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      await fetch("http://localhost:8000/api/site-content/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
    } catch (e) {
      // Optionally handle error (e.g., show notification)
    }
  }

  return { content, updateContent, isAdmin, loading }
}
