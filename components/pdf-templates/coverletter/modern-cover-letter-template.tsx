import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { CoverLetterData } from "@/lib/types"

// Use only built-in fonts to avoid issues
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#333",
    borderBottomStyle: "solid",
  },
  headerText: {
    fontSize: 9,
    color: "#555",
    marginBottom: 2,
  },
  headerName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#111",
    marginBottom: 4,
  },
  body: {
    marginBottom: 12,
  },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    paddingTop: 10,
  },
  text: {
    marginBottom: 8,
    fontSize: 10,
    color: "#222",
  },
})

interface ModernCoverLetterPDFTemplateProps {
  coverLetterData: CoverLetterData
}

export const ModernCoverLetterPDFTemplate = ({ coverLetterData }: ModernCoverLetterPDFTemplateProps) => {
  // Split the text into paragraphs safely
  const headParagraphs = (coverLetterData?.head || "").split("\n").filter((p) => p.trim() !== "")
  const bodyParagraphs = (coverLetterData?.body || "").split("\n").filter((p) => p.trim() !== "")
  const footerParagraphs = (coverLetterData?.footer || "").split("\n").filter((p) => p.trim() !== "")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          {headParagraphs.map((paragraph, index) => (
            <Text
              key={`head-${index}`}
              style={index === 0 ? styles.headerName : styles.headerText}
            >
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