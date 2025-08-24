import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { CoverLetterData } from "@/lib/types"

// Use only built-in fonts to avoid issues
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Times-Roman",
    fontSize: 12,
    color: "#333",
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 20,
  },
  text: {
    marginBottom: 10,
  },
})

interface StandardCoverLetterPDFTemplateProps {
  coverLetterData: CoverLetterData
}

export const StandardCoverLetterPDFTemplate = ({ coverLetterData }: StandardCoverLetterPDFTemplateProps) => {
  // Split the text into paragraphs
  const headParagraphs = coverLetterData.head.split("\n").filter((p) => p.trim() !== "")
  const bodyParagraphs = coverLetterData.body.split("\n").filter((p) => p.trim() !== "")
  const footerParagraphs = coverLetterData.footer.split("\n").filter((p) => p.trim() !== "")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.section}>
          {headParagraphs.map((paragraph, index) => (
            <Text key={`head-${index}`} style={styles.text}>
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Body Section */}
        <View style={styles.section}>
          {bodyParagraphs.map((paragraph, index) => (
            <Text key={`body-${index}`} style={styles.text}>
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Footer Section */}
        <View style={styles.section}>
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
