import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { CoverLetterData } from "@/lib/types"

// Use only built-in fonts to avoid issues
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#333",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
    borderBottomStyle: "solid",
    paddingBottom: 15,
  },
  body: {
    marginBottom: 20,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#555",
    borderTopStyle: "solid",
    paddingTop: 15,
  },
  text: {
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    color: "#222",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
})

interface ProfessionalCoverLetterTemplateProps {
  coverLetterData: CoverLetterData
}

export const ProfessionalCoverLetterTemplate = ({ coverLetterData }: ProfessionalCoverLetterTemplateProps) => {
  // Split the text into paragraphs
  const headParagraphs = coverLetterData.head.split("\n").filter((p) => p.trim() !== "")
  const bodyParagraphs = coverLetterData.body.split("\n").filter((p) => p.trim() !== "")
  const footerParagraphs = coverLetterData.footer.split("\n").filter((p) => p.trim() !== "")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Professional Cover Letter</Text>
          {headParagraphs.map((paragraph, index) => (
            <Text key={`head-${index}`} style={styles.text}>
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Body Section */}
        <View style={styles.body}>
          {bodyParagraphs.map((paragraph, index) => (
            <Text key={`body-${index}`} style={styles.text}>
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          {footerParagraphs.map((paragraph, index) => (
            <Text key={`footer-${index}`} style={styles.text}>
              {paragraph}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  )
}
