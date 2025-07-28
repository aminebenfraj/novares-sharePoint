const nodemailer = require("nodemailer");
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
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection error:", error)
  } else {
    console.log("✅ SMTP server is ready to send emails")
  }
})

/**
 * Send document creation email to manager for approval/disapproval
 */
exports.sendManagerApprovalEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentLink, deadline, createdBy, comment = "", documentId } = options
    // 🔧 DEBUG: Log the document ID being used
    console.log(`📧 Sending manager approval email with document ID: ${documentId}`)
    // 🔧 VALIDATION: Ensure documentId is valid
    if (!documentId || documentId === "undefined" || documentId === "null") {
      console.error(`❌ Invalid document ID in manager approval email: ${documentId}`)
      throw new Error(`Invalid document ID: ${documentId}`)
    }
    const baseUrl = process.env.FRONTEND_URL || "https://novares-sharepoint.onrender.com"
    const taskUrl = `${baseUrl}/sharepoint/${documentId}`
    // 🔧 DEBUG: Log the final URL
    console.log(`🔗 Manager approval email URL: ${taskUrl}`)
    const formattedDeadline = new Date(deadline).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">📋 Document Approval Required</h1>
            <div style="width: 50px; height: 3px; background-color: #2563eb; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            A new SharePoint document has been created by <strong>${createdBy}</strong> and requires your approval or disapproval.
          </p>
          <div style="background-color: #e3f2fd; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1976d2; margin-top: 0; font-size: 18px;">📋 Document Details</h3>
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
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Document ID:</td>
                <td style="padding: 8px 0; color: #666; font-family: monospace;">${documentId}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}"
                style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔗 Approve or Disapprove Document
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong><br>
              Document ID: <code>${documentId}</code>
            </p>
          </div>
        </div>
      </div>
    `
    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `📋 Document Approval Required: "${documentTitle}" (ID: ${documentId})`,
      html: htmlContent,
    }
    const info = await transporter.sendMail(mailOptions)
    console.log(`📧 Manager approval email sent successfully to ${to} with document ID ${documentId}:`, info.messageId)
    return info
  } catch (error) {
    console.error("❌ Error sending manager approval email:", error)
    throw error
  }
}

/**
 * Send document assignment email to users after manager approval
 */
exports.sendUserSigningEmail = async (options) => {
  try {
    const {
      to,
      username,
      documentTitle,
      documentLink,
      deadline,
      createdBy,
      approvedBy,
      comment = "",
      documentId,
    } = options
    // 🔧 DEBUG: Log the document ID being used
    console.log(`📧 Sending user signing email with document ID: ${documentId}`)
    // 🔧 VALIDATION: Ensure documentId is valid
    if (!documentId || documentId === "undefined" || documentId === "null") {
      console.error(`❌ Invalid document ID in user signing email: ${documentId}`)
      throw new Error(`Invalid document ID: ${documentId}`)
    }
    const baseUrl = process.env.FRONTEND_URL || "https://novares-sharepoint.onrender.com"
    const taskUrl = `${baseUrl}/sharepoint/${documentId}`
    // 🔧 DEBUG: Log the final URL
    console.log(`🔗 User signing email URL: ${taskUrl}`)
    const formattedDeadline = new Date(deadline).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 28px;">✅ Document Ready for Signing</h1>
            <div style="width: 50px; height: 3px; background-color: #16a34a; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            A SharePoint document created by <strong>${createdBy}</strong> and approved by <strong>${approvedBy}</strong> is now ready for your approval or disapproval.
          </p>
          <div style="background-color: #dcfce7; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #15803d; margin-top: 0; font-size: 18px;">📋 Document Details</h3>
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
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Approved by:</td>
                <td style="padding: 8px 0; color: #666;">${approvedBy}</td>
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
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Document ID:</td>
                <td style="padding: 8px 0; color: #666; font-family: monospace;">${documentId}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}"
                style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔗 Approve or Disapprove Document
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong><br>
              Document ID: <code>${documentId}</code>
            </p>
          </div>
        </div>
      </div>
    `
    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `✅ Document Approved - Action Required: "${documentTitle}" (ID: ${documentId})`,
      html: htmlContent,
    }
    const info = await transporter.sendMail(mailOptions)
    console.log(`📧 User signing email sent successfully to ${to} with document ID ${documentId}:`, info.messageId)
    return info
  } catch (error) {
    console.error("❌ Error sending user signing email:", error)
    throw error
  }
}

// Apply similar fixes to other email functions...
exports.sendRelaunchNotificationEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentId, disapprovedBy, disapprovalNote, isManagerDisapproval } = options
    // 🔧 DEBUG: Log the document ID being used
    console.log(`📧 Sending relaunch notification email with document ID: ${documentId}`)
    // 🔧 VALIDATION: Ensure documentId is valid
    if (!documentId || documentId === "undefined" || documentId === "null") {
      console.error(`❌ Invalid document ID in relaunch notification email: ${documentId}`)
      throw new Error(`Invalid document ID: ${documentId}`)
    }
    const baseUrl = process.env.FRONTEND_URL || "https://novares-sharepoint.onrender.com"
    const documentUrl = `${baseUrl}/sharepoint/${documentId}`
    // 🔧 DEBUG: Log the final URL
    console.log(`🔗 Relaunch notification email URL: ${documentUrl}`)
    const disapprovalType = isManagerDisapproval ? "Manager" : "User"
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">❌ Document Disapproved - Relaunch Required</h1>
            <div style="width: 50px; height: 3px; background-color: #dc2626; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your SharePoint document "<strong>${documentTitle}</strong>" has been disapproved by <strong>${disapprovedBy}</strong> (${disapprovalType}).
          </p>
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #dc2626;">
            <h3 style="color: #991b1b; margin: 0 0 10px 0;">📝 Reason for Disapproval</h3>
            <p style="color: #991b1b; margin: 0;">${disapprovalNote}</p>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Please review the feedback, make necessary changes, and relaunch the document to restart the approval process.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentUrl}"
                style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔄 Relaunch Document
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong><br>
              Document ID: <code>${documentId}</code>
            </p>
          </div>
        </div>
      </div>
    `
    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `❌ Document Disapproved - Relaunch Required: "${documentTitle}" (ID: ${documentId})`,
      html: htmlContent,
    }
    const info = await transporter.sendMail(mailOptions)
    console.log(
      `📧 Relaunch notification email sent successfully to ${to} with document ID ${documentId}:`,
      info.messageId,
    )
    return info
  } catch (error) {
    console.error("❌ Error sending relaunch notification email:", error)
    throw error
  }
}

exports.sendCompletionNotificationEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentId } = options
    // 🔧 DEBUG: Log the document ID being used
    console.log(`📧 Sending completion notification email with document ID: ${documentId}`)
    // 🔧 VALIDATION: Ensure documentId is valid
    if (!documentId || documentId === "undefined" || documentId === "null") {
      console.error(`❌ Invalid document ID in completion notification email: ${documentId}`)
      throw new Error(`Invalid document ID: ${documentId}`)
    }
    const baseUrl = process.env.FRONTEND_URL || "https://novares-sharepoint.onrender.com"
    const documentUrl = `${baseUrl}/sharepoint/${documentId}`
    // 🔧 DEBUG: Log the final URL
    console.log(`🔗 Completion notification email URL: ${documentUrl}`)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">🎉 Document Completed Successfully</h1>
            <div style="width: 50px; height: 3px; background-color: #8b5cf6; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Congratulations! Your SharePoint document "<strong>${documentTitle}</strong>" has been fully approved by all assigned users and is now complete.
          </p>
          <div style="background-color: #f3e8ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #8b5cf6;">
            <h3 style="color: #6b21a8; margin: 0 0 10px 0;">✨ Status: Completed</h3>
            <p style="color: #6b21a8; margin: 0;">All required approvals have been obtained. The document is ready for final processing.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentUrl}"
                style="background-color: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              📄 View Completed Document
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong><br>
              Document ID: <code>${documentId}</code>
            </p>
          </div>
        </div>
      </div>
    `
    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎉 Document Completed: "${documentTitle}" (ID: ${documentId})`,
      html: htmlContent,
    }
    const info = await transporter.sendMail(mailOptions)
    console.log(
      `📧 Completion notification email sent successfully to ${to} with document ID ${documentId}:`,
      info.messageId,
    )
    return info
  } catch (error) {
    console.error("❌ Error sending completion notification email:", error)
    throw error
  }
}

/**
 * Send expiration notification email to document creator
 */
exports.sendExpirationNotificationEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentId, deadline } = options
    // 🔧 DEBUG: Log the document ID being used
    console.log(`📧 Sending expiration notification email with document ID: ${documentId}`)
    // 🔧 VALIDATION: Ensure documentId is valid
    if (!documentId || documentId === "undefined" || documentId === "null") {
      console.error(`❌ Invalid document ID in expiration notification email: ${documentId}`)
      throw new Error(`Invalid document ID: ${documentId}`)
    }
    const baseUrl = process.env.FRONTEND_URL || "https://novares-sharepoint.onrender.com"
    const documentUrl = `${baseUrl}/sharepoint/${documentId}`
    // 🔧 DEBUG: Log the final URL
    console.log(`🔗 Expiration notification email URL: ${documentUrl}`)
    const formattedDeadline = new Date(deadline).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">⏰ Document Expired - Action Required</h1>
            <div style="width: 50px; height: 3px; background-color: #dc2626; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your SharePoint document "<strong>${documentTitle}</strong>" has expired and requires your immediate attention.
          </p>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #dc2626;">
            <h3 style="color: #991b1b; margin: 0 0 15px 0;">📅 Expiration Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #991b1b; width: 120px;">Document:</td>
                <td style="padding: 8px 0; color: #991b1b;">${documentTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Expired On:</td>
                <td style="padding: 8px 0; color: #991b1b;">${formattedDeadline}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Document ID:</td>
                <td style="padding: 8px 0; color: #991b1b; font-family: monospace;">${documentId}</td>
              </tr>
            </table>
          </div>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">🔄 What You Need to Do</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Users can no longer approve or disapprove this document</li>
              <li style="margin-bottom: 8px;">You must relaunch the document with a new deadline</li>
              <li style="margin-bottom: 8px;">Set a new deadline that allows sufficient time for approvals</li>
              <li style="margin-bottom: 8px;">All existing approvals will be preserved when you relaunch</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentUrl}" 
               style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔄 Relaunch Document with New Deadline
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong><br>
              Document ID: <code>${documentId}</code> | Status: <strong>EXPIRED</strong>
            </p>
          </div>
        </div>
      </div>
    `
    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⏰ EXPIRED: Document "${documentTitle}" Requires Relaunch (ID: ${documentId})`,
      html: htmlContent,
    }
    const info = await transporter.sendMail(mailOptions)
    console.log(
      `📧 Expiration notification email sent successfully to ${to} with document ID ${documentId}:`,
      info.messageId,
    )
    return info
  } catch (error) {
    console.error("❌ Error sending expiration notification email:", error)
    throw error
  }
}

/**
 * Send bulk emails to multiple recipients
 */
exports.sendBulkEmails = async (emailList, emailType) => {
  try {
    console.log(`📧 Sending ${emailList.length} ${emailType} emails...`)
    let sendFunction
    switch (emailType) {
      case "managerApproval":
        sendFunction = exports.sendManagerApprovalEmail
        break
      case "userSigning":
        sendFunction = exports.sendUserSigningEmail
        break
      case "relaunchNotification":
        sendFunction = exports.sendRelaunchNotificationEmail
        break
      case "completionNotification":
        sendFunction = exports.sendCompletionNotificationEmail
        break
      case "expirationNotification":
        sendFunction = exports.sendExpirationNotificationEmail
        break
      default:
        throw new Error(`Unknown email type: ${emailType}`)
    }
    const results = await Promise.allSettled(emailList.map((emailOptions) => sendFunction(emailOptions)))
    const successful = results.filter((result) => result.status === "fulfilled").length
    const failed = results.filter((result) => result.status === "rejected").length
    console.log(`✅ Bulk email results: ${successful} successful, ${failed} failed`)
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ Failed to send ${emailType} email to ${emailList[index].to}:`, result.reason)
      }
    })
    return {
      total: emailList.length,
      successful,
      failed,
      results,
    }
  } catch (error) {
    console.error(`❌ Error sending bulk ${emailType} emails:`, error)
    throw error
  }
}
