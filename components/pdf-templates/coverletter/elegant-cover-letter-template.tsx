import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { CoverLetterData } from "@/lib/types"

// Use only built-in fonts to avoid issues
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Times-Roman",
    fontSize: 11,
    color: "#333",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 25,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    borderBottomStyle: "solid",
  },
  body: {
    marginBottom: 25,
  },
  footer: {
    marginTop: 25,
    alignItems: "center",
  },
  footerLine: {
    width: "50%",
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    borderBottomStyle: "solid",
    marginBottom: 15,
    marginTop: 10,
    alignSelf: "center",
  },
  text: {
    marginBottom: 10,
    textAlign: "justify",
  },
  headerText: {
    textAlign: "left",
    marginBottom: 10,
  },
  footerText: {
    textAlign: "left",
    marginBottom: 10,
  },
})

interface ElegantCoverLetterTemplateProps {
  coverLetterData: CoverLetterData
}

export const ElegantCoverLetterTemplate = ({ coverLetterData }: ElegantCoverLetterTemplateProps) => {
  // Split the text into paragraphs safely
  const headParagraphs = (coverLetterData?.head || "").split("\n").filter((p) => p.trim() !== "")
  const bodyParagraphs = (coverLetterData?.body || "").split("\n").filter((p) => p.trim() !== "")
  const footerParagraphs = (coverLetterData?.footer || "").split("\n").filter((p) => p.trim() !== "")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cover Letter</Text>
          {headParagraphs.map((paragraph, index) => (
            <Text key={`head-${index}`} style={styles.headerText}>
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
          <View style={styles.footerLine} />
          {footerParagraphs.map((paragraph, index) => (
            <Text key={`footer-${index}`} style={styles.footerText}>
              {paragraph}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  )
}
