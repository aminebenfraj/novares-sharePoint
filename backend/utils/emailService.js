const nodemailer = require("nodemailer")
require("dotenv").config()

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

/**
 * Send an email notification
 * @param {string} recipient - Recipient's email
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML format
 * @param {Object} data - Optional data object with additional information for the email
 */
const sendEmail = async (recipient, subject, html, data = null) => {
  try {
    // Create a styled HTML email with the provided content
    let emailContent = html

    // If data is provided, add a styled table with the data
    if (data) {
      const tableStyle = `
        border-collapse: collapse;
        width: 100%;
        margin-top: 20px;
        margin-bottom: 20px;
        font-family: Arial, sans-serif;
      `

      const thStyle = `
        background-color: #f2f2f2;
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
        font-weight: bold;
      `

      const tdStyle = `
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      `

      const trEvenStyle = `background-color: #f9f9f9;`

      let tableContent = `<table style="${tableStyle}">`

      // Add table headers if data has keys
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        tableContent += "<tr>"
        for (const key of Object.keys(data)) {
          // Format the header (capitalize and replace underscores with spaces)
          const formattedHeader = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

          tableContent += `<th style="${thStyle}">${formattedHeader}</th>`
        }
        tableContent += "</tr>"

        // Add table data
        tableContent += `<tr style="${trEvenStyle}">`
        for (const value of Object.values(data)) {
          tableContent += `<td style="${tdStyle}">${value || "N/A"}</td>`
        }
        tableContent += "</tr>"
      }

      tableContent += "</table>"

      // Append the table to the email content
      emailContent += tableContent
    }

    // Add a styled footer
    const footerStyle = `
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #dddddd;
      font-size: 12px;
      color: #666666;
      font-family: Arial, sans-serif;
    `

    emailContent += `
      <div style="${footerStyle}">
        <p>This is an automated message from the Mass Production System. Please do not reply to this email.</p>
        <p>If you have any questions, please contact your system administrator.</p>
      </div>
    `

    const info = await transporter.sendMail({
      from: `"Mass Production System" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: subject,
      html: emailContent,
    })

    console.log(`📧 Email sent successfully to ${recipient}`)
    console.log(`📧 Message ID: ${info.messageId}`)

    return info
  } catch (error) {
    console.error(`❌ Error sending email to ${recipient}:`, error)
    throw error
  }
}

module.exports = sendEmail
  