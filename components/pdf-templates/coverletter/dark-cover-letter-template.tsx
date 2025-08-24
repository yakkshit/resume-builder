import { Document, Page, Text, View, StyleSheet, Link, Image } from "@react-pdf/renderer"
import type { CoverLetterData } from "@/lib/types"

// Use only built-in fonts to avoid issues
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#ffffff",
    backgroundColor: "#1a1a2e",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#6a5acd", // purple
    borderBottomStyle: "solid",
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#a5b4fc", // light purple
    marginBottom: 10,
    textAlign: "center",
  },
  body: {
    marginBottom: 20,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#6a5acd", // purple
    borderTopStyle: "solid",
    paddingTop: 15,
  },
  text: {
    marginBottom: 10,
    color: "#d1d5db", // light gray
    lineHeight: 1.5,
  },
  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 5,
    fontSize: 9,
    color: "#d1d5db", // light gray
  },
  contactIcon: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  link: {
    color: "#a5b4fc", // light purple
    textDecoration: "none",
  },
})

interface DarkCoverLetterTemplateProps {
  coverLetterData: CoverLetterData
}

export const DarkCoverLetterTemplate = ({ coverLetterData }: DarkCoverLetterTemplateProps) => {
  // Split the text into paragraphs
  const headParagraphs = coverLetterData.head.split("\n").filter((p) => p.trim() !== "")
  const bodyParagraphs = coverLetterData.body.split("\n").filter((p) => p.trim() !== "")
  const footerParagraphs = coverLetterData.footer.split("\n").filter((p) => p.trim() !== "")

  // SVG icons as data URLs for email, phone, location
  const emailIcon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhNWI0ZmMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1tYWlsIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTYiIHg9IjIiIHk9IjQiIHJ4PSIyIi8+PHBhdGggZD0ibTIyIDdoLTIwbDEwIDggMTAtOHoiLz48L3N2Zz4="
  const phoneIcon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhNWI0ZmMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1waG9uZSI+PHBhdGggZD0iTTIyIDE2LjkydjNhMiAyIDAgMCAxLTIuMTggMiAxOS43OSAxOS43OSAwIDAgMS04LjYzLTMuMDcgMTkuNSAxOS41IDAgMCAxLTYtNiAxOS43OSAxOS43OSAwIDAgMS0zLjA3LTguNjdBMiAyIDAgMCAxIDQuMTEgMmgzYTIgMiAwIDAgMSAyIDEuNzIgMTIuODQgMTIuODQgMCAwIDAgLjcgMi44MSAyIDIgMCAwIDEtLjQ1IDIuMTFMOC4wOSA5LjkxYTE2IDE2IDAgMCAwIDYgNmwxLjI3LTEuMjdhMiAyIDAgMCAxIDIuMTEtLjQ1IDEyLjg0IDEyLjg0IDAgMCAwIDIuODEuN0EyIDIgMCAwIDEgMjIgMTYuOTJ6Ii8+PC9zdmc+"
  const locationIcon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhNWI0ZmMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1tYXAtcGluIj48cGF0aCBkPSJNMjAgMTBjMCA2LTggMTItOCAxMnMtOC02LTgtMTJhOCA4IDAgMCAxIDE2IDB6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg=="

  // Extract email, phone, and location from the header if available
  const emailMatch = headParagraphs.join(" ").match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i)
  const phoneMatch = headParagraphs
    .join(" ")
    .match(/(\+?[0-9][\s-]?)?(\$?[0-9]{3}\$?|[0-9]{3})[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})/i)
  const email = emailMatch ? emailMatch[0] : null
  const phone = phoneMatch ? phoneMatch[0] : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cover Letter</Text>

          {/* Contact Info with Icons */}
          <View style={styles.contactInfo}>
            {email && (
              <View style={styles.contactItem}>
                <Image src={emailIcon || "/placeholder.svg"} style={styles.contactIcon} />
                <Link src={`mailto:${email}`} style={styles.link}>
                  <Text>{email}</Text>
                </Link>
              </View>
            )}
            {phone && (
              <View style={styles.contactItem}>
                <Image src={phoneIcon || "/placeholder.svg"} style={styles.contactIcon} />
                <Link src={`tel:${phone.replace(/[^\d+]/g, "")}`} style={styles.link}>
                  <Text>{phone}</Text>
                </Link>
              </View>
            )}
          </View>

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