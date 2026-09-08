// Gallery data for the marquee slider
export type GalleryItem = {
    id: string
    name: string
    category: "Resume" | "Cover Letter"
    image: string
    template: string
    url?: string
  }
  
  export const galleryItems: GalleryItem[] = [
    {
      id: "modern-resume-1",
      name: "Professional Developer",
      category: "Resume",
      image: "https://github.com/yakkshit/canonical-assignmnet/blob/main/cv/professional.png?raw=true",
      template: "modern",
    },
    {
      id: "classic-resume-1",
      name: "Marketing Specialist",
      category: "Resume",
      image: "https://github.com/yakkshit/canonical-assignmnet/blob/main/cv/classic.png?raw=true",
      template: "classic",
    },
    {
      id: "minimal-resume-1",
      name: "UX Designer",
      category: "Resume",
      image: "/placeholder.svg",
      template: "minimal",
    },
    {
      id: "dark-resume-1",
      name: "Software Engineer",
      category: "Resume",
      image: "https://github.com/yakkshit/canonical-assignmnet/blob/main/cv/dark.png?raw=true",
      template: "dark",
    },
    {
      id: "gradient-resume-1",
      name: "Product Manager",
      category: "Resume",
      image: "/placeholder.svg",
      template: "gradient",
    },
    {
      id: "two-column-resume-1",
      name: "Data Scientist",
      category: "Resume",
      image: "https://github.com/yakkshit/canonical-assignmnet/blob/main/cv/two-column.png?raw=true",
      template: "two-column",
    },
    {
      id: "german-teal-wave-1",
      name: "German Teal Wave",
      category: "Resume",
      image: "/placeholder.svg",
      template: "german-teal-wave",
    },
    {
      id: "german-slate-split-1",
      name: "German Slate Split",
      category: "Resume",
      image: "/placeholder.svg",
      template: "german-slate-split",
    },
    {
      id: "german-rose-gold-1",
      name: "German Rose Gold",
      category: "Resume",
      image: "/placeholder.svg",
      template: "german-rose-gold",
    },
    {
      id: "german-timeline-minimal-1",
      name: "German Timeline Minimal",
      category: "Resume",
      image: "/placeholder.svg",
      template: "german-timeline-minimal",
    },
    {
      id: "german-burgundy-dual-1",
      name: "German Burgundy Dual",
      category: "Resume",
      image: "/placeholder.svg",
      template: "german-burgundy-dual",
    },
    {
      id: "ivy-league-1",
      name: "Ivy League Engineering ATS",
      category: "Resume",
      image: "/placeholder.svg",
      template: "ivy-league",
    },
    {
      id: "standard-cover-1",
      name: "Entry Level Position",
      category: "Cover Letter",
      image: "/placeholder.svg",
      template: "standard",
    },
    {
      id: "modern-cover-1",
      name: "Senior Position Application",
      category: "Cover Letter",
      image: "/placeholder.svg",
      template: "modern",
    },
    {
      id: "creative-cover-1",
      name: "Design Agency Application",
      category: "Cover Letter",
      image: "/placeholder.svg",
      template: "creative",
    },
    {
      id: "professional-cover-1",
      name: "Corporate Position",
      category: "Cover Letter",
      image: "/placeholder.svg",
      template: "professional",
    },
    {
      id: "elegant-cover-1",
      name: "Executive Position",
      category: "Cover Letter",
      image: "/placeholder.svg",
      template: "elegant",
    },
    {
      id: "dark-cover-1",
      name: "Tech Startup Application",
      category: "Cover Letter",
      image: "/placeholder.svg",
      template: "dark",
    },
  ]  