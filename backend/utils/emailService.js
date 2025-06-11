const nodemailer = require("nodemailer")
require("dotenv").config()

// Create a transporter using the provided SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})


// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection error:", error)
  } else {
    console.log("✅ SMTP server is ready to send emails")
  }
})

/**
 * Send SharePoint document assignment email to a user
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.username - Recipient name
 * @param {string} options.documentTitle - Document title
 * @param {string} options.documentLink - Document link/path
 * @param {string} options.deadline - Document deadline
 * @param {string} options.createdBy - Creator name
 * @param {string} options.comment - Additional comments
 * @param {string} options.documentId - Document ID for task URL
 * @returns {Promise} - Email sending result
 */
exports.sendSharePointAssignmentEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentLink, deadline, createdBy, comment = "", documentId } = options

    // Get base URL from environment or use default
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000"
    const taskUrl = `${baseUrl}/sharepoint/${documentId}`
    const dashboardUrl = `${baseUrl}/sharepoint`

    // Format deadline for display
    const formattedDeadline = new Date(deadline).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    // Email HTML template with enhanced content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">📋 Document Assignment</h1>
            <div style="width: 50px; height: 3px; background-color: #2563eb; margin: 10px auto;"></div>
          </div>
          
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            You have been assigned to review and sign a SharePoint document that requires your immediate attention.
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #2563eb;">
            <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 22px;">${documentTitle}</h2>
            <p style="color: #64748b; margin: 0; font-size: 16px;">Document assignment from ${createdBy}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1976d2; margin-top: 0; font-size: 18px;">
              📋 Document Details
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333; width: 120px;">Title:</td>
                <td style="padding: 8px 0; color: #666;">${documentTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Created by:</td>
                <td style="padding: 8px 0; color: #666;">${createdBy}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Deadline:</td>
                <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">${formattedDeadline}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Document:</td>
                <td style="padding: 8px 0;">
                  <a href="${documentLink}" style="color: #2563eb; text-decoration: none; word-break: break-all;">
                    ${documentLink}
                  </a>
                </td>
              </tr>
              ${
                comment
                  ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Notes:</td>
                <td style="padding: 8px 0; color: #666;">${comment}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">
              ⚡ Next Steps
            </h4>
            <ol style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
              <li>Click the button below to access the document management system</li>
              <li>Review the document using the provided link</li>
              <li>Complete your assigned task before the deadline</li>
              <li>Add any comments or notes if required</li>
            </ol>
          </div>
      
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏰ Important:</strong> Please complete your task by <strong>${formattedDeadline}</strong> to avoid delays in the document approval process.
            </p>
          </div>
        
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong>
            </p>
            <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
              Please do not reply to this email. For support, contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    `

    // Plain text version for email clients that don't support HTML
    const textContent = `
      SharePoint Document Assignment Notification
      
      Dear ${username},
      
      You have been assigned to review and sign a SharePoint document.
      
      Document Details:
      - Title: ${documentTitle}
      - Created by: ${createdBy}
      - Deadline: ${formattedDeadline}
      - Document Link: ${documentLink}
      ${comment ? `- Notes: ${comment}` : ""}
      
      Next Steps:
      1. Access the document management system: ${taskUrl}
      2. Review the document using the provided link
      3. Complete your assigned task before the deadline
      4. Add any comments or notes if required
      
      Important: Please complete your task by ${formattedDeadline} to avoid delays.
      
      If you have any questions about this assignment, please contact your project manager or the document creator.
      
      ---
      This is an automated notification from the SharePoint Document Management System.
    `

    // Email options
    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `📋 Document Assignment: "${documentTitle}" - Due ${formattedDeadline}`,
      html: htmlContent,
      text: textContent,
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    console.log(`📧 SharePoint assignment email sent successfully to ${to}:`, info.messageId)
    return info
  } catch (error) {
    console.error("❌ Error sending SharePoint assignment email:", error)
    throw error
  }
}

/**
 * Send SharePoint document approval notification email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.username - Recipient name
 * @param {string} options.documentTitle - Document title
 * @param {string} options.documentId - Document ID for task URL
 * @param {string} options.approvedBy - Approver name
 * @returns {Promise} - Email sending result
 */
exports.sendSharePointApprovalEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentId, approvedBy } = options

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000"
    const taskUrl = `${baseUrl}/sharepoint/${documentId}`

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0; font-size: 28px;">✅ Document Approved</h1>
            <div style="width: 50px; height: 3px; background-color: #10b981; margin: 10px auto;"></div>
          </div>
          
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Great news! The SharePoint document "<strong>${documentTitle}</strong>" has been approved by ${approvedBy} and is now ready for your signature.
          </p>
          
          <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #10b981;">
            <h3 style="color: #065f46; margin: 0 0 10px 0;">🎉 Document Status: Approved</h3>
            <p style="color: #065f46; margin: 0;">You can now proceed to sign this document.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}" 
               style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔗 Sign Document Now
            </a>
          </div>
        </div>
      </div>
    `

    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `✅ Document Approved: "${documentTitle}" - Ready for Signature`,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`📧 SharePoint approval email sent successfully to ${to}:`, info.messageId)
    return info
  } catch (error) {
    console.error("❌ Error sending SharePoint approval email:", error)
    throw error
  }
}

/**
 * Send bulk SharePoint assignment emails
 * @param {Array} emailList - Array of email options objects
 * @returns {Promise} - Results of all email sending attempts
 */
exports.sendBulkSharePointAssignmentEmails = async (emailList) => {
  try {
    console.log(`📧 Sending ${emailList.length} SharePoint assignment emails...`)

    const results = await Promise.allSettled(
      emailList.map((emailOptions) => exports.sendSharePointAssignmentEmail(emailOptions)),
    )

    const successful = results.filter((result) => result.status === "fulfilled").length
    const failed = results.filter((result) => result.status === "rejected").length

    console.log(`✅ Bulk SharePoint email results: ${successful} successful, ${failed} failed`)

    // Log failed emails for debugging
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ Failed to send email to ${emailList[index].to}:`, result.reason)
      }
    })

    return {
      total: emailList.length,
      successful,
      failed,
      results,
    }
  } catch (error) {
    console.error("❌ Error sending bulk SharePoint emails:", error)
    throw error
  }
}

/**
 * Send SharePoint document completion notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.username - Recipient name
 * @param {string} options.documentTitle - Document title
 * @param {string} options.documentId - Document ID
 * @returns {Promise} - Email sending result
 */
exports.sendSharePointCompletionEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentId } = options

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000"
    const documentUrl = `${baseUrl}/sharepoint/${documentId}`

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">🎉 Document Completed</h1>
            <div style="width: 50px; height: 3px; background-color: #8b5cf6; margin: 10px auto;"></div>
          </div>
          
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Excellent! All required signatures have been collected for the SharePoint document "<strong>${documentTitle}</strong>".
          </p>
          
          <div style="background-color: #f3e8ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #8b5cf6;">
            <h3 style="color: #6b21a8; margin: 0 0 10px 0;">✨ Status: Completed</h3>
            <p style="color: #6b21a8; margin: 0;">The document is now complete and ready for final processing.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentUrl}" 
               style="background-color: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              📄 View Completed Document
            </a>
          </div>
        </div>
      </div>
    `

    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎉 Document Completed: "${documentTitle}"`,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`📧 SharePoint completion email sent successfully to ${to}:`, info.messageId)
    return info
  } catch (error) {
    console.error("❌ Error sending SharePoint completion email:", error)
    throw error
  }
}
