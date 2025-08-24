import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

interface FeedbackData {
  name: string
  email: string
  type: string
  service: string
  message: string
}

/**
 * Saves feedback data to a Google Sheet
 *
 * Note: This requires proper Google API credentials to be set up.
 * For production, you should use environment variables for these credentials.
 */
export async function saveFeedbackToSheet(data: FeedbackData): Promise<void> {
  try {
    // In a real implementation, these would come from environment variables
    const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY
    const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
    const GOOGLE_SHEETS_SHEET_ID = process.env.GOOGLE_SHEETS_SHEET_ID

    // Check if credentials are available
    if (!GOOGLE_SHEETS_PRIVATE_KEY || !GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_SHEET_ID) {
      console.log("Google Sheets credentials not found. In development mode, logging feedback instead:")
      console.log({
        timestamp: new Date().toISOString(),
        ...data,
      })
      return
    }

    // Create a JWT auth client
    const serviceAccountAuth = new JWT({
      email: GOOGLE_SHEETS_CLIENT_EMAIL,
      key: GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    // Initialize the sheet
    const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_SHEET_ID, serviceAccountAuth)
    await doc.loadInfo()

    // Get the first sheet
    const sheet = doc.sheetsByIndex[0]

    // Add a new row with the feedback data
    await sheet.addRow({
      timestamp: new Date().toISOString(),
      name: data.name,
      email: data.email,
      type: data.type,
      service: data.service,
      message: data.message,
    })

    console.log("Feedback saved to Google Sheet successfully")
  } catch (error) {
    console.error("Error saving feedback to Google Sheet:", error)
    throw new Error("Failed to save feedback to Google Sheet")
  }
}