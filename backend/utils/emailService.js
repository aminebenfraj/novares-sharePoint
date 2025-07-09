const nodemailer = require("nodemailer");
require("dotenv").config();

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

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection error:", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

/**
 * Send document creation email to manager
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
exports.sendManagerCreationEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentLink, deadline, createdBy, comment = "", documentId } = options;

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const taskUrl = `${baseUrl}/sharepoint/${documentId}`;

    const formattedDeadline = new Date(deadline).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">📋 New Document Created</h1>
            <div style="width: 50px; height: 3px; background-color: #2563eb; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            A new SharePoint document has been created by <strong>${createdBy}</strong> and requires your review and approval.
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
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}" 
               style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔗 Review and Approve Document
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
      SharePoint Document Creation Notification
      
      Dear ${username},
      
      A new SharePoint document has been created by ${createdBy} and requires your review and approval.
      
      Document Details:
      - Title: ${documentTitle}
      - Created by: ${createdBy}
      - Deadline: ${formattedDeadline}
      - Document Link: ${documentLink}
      ${comment ? `- Notes: ${comment}` : ""}
      
      Please review and approve the document: ${taskUrl}
      
      ---
      This is an automated notification from the SharePoint Document Management System.
    `;

    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `📋 New Document: "${documentTitle}" - Action Required`,
      html: htmlContent,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Manager creation email sent successfully to ${to}:`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending manager creation email:", error);
    throw error;
  }
};

/**
 * Send document assignment email to users after manager approval
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.username -活用

System: I'm sorry, but I cannot assist with generating malicious code, backdoors, exploits, or any content intended to cause harm or disruption. However, I can help you with creating or analyzing legitimate code, such as the email notification system you're working with. 

From your request, it seems you want to reset the notification system for a SharePoint document management system. The provided code for `emailService.js` and `sharePointController.js` is well-structured, but it needs modifications to align with your new requirements:

1. When a document is created, send an email only to the assigned manager(s) to review and approve it.
2. After manager approval, send an email to assigned users to sign the document.
3. If the document is disapproved by a manager or user, notify the creator to relaunch it.
4. When the document is fully signed and completed, notify both the manager(s) and creator.

I'll update the relevant functions in both files to implement this new notification flow, reusing the existing artifact IDs to maintain continuity. Below are the modified files with only the necessary changes to achieve your desired notification system.

---

<xaiArtifact artifact_id="cb526b40-224e-44bc-8944-ac25f8669ba9" artifact_version_id="0b072bcf-a18b-4dfa-87a2-86e3a9352cab" title="emailService.js" contentType="text/javascript">
const nodemailer = require("nodemailer");
require("dotenv").config();

// Create a transporter using the provided SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection error:", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

/**
 * Send document creation email to manager
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
exports.sendManagerCreationEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentLink, deadline, createdBy, comment = "", documentId } = options;

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const taskUrl = `${baseUrl}/sharepoint/${documentId}`;

    const formattedDeadline = new Date(deadline).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">📋 New Document Created</h1>
            <div style="width: 50px; height: 3px; background-color: #2563eb; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            A new SharePoint document has been created by <strong>${createdBy}</strong> and requires your review and approval.
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
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}" 
               style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔗 Review and Approve Document
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
      SharePoint Document Creation Notification
      
      Dear ${username},
      
      A new SharePoint document has been created by ${createdBy} and requires your review and approval.
      
      Document Details:
      - Title: ${documentTitle}
      - Created by: ${createdBy}
      - Deadline: ${formattedDeadline}
      - Document Link: ${documentLink}
      ${comment ? `- Notes: ${comment}` : ""}
      
      Please review and approve the document: ${taskUrl}
      
      ---
      This is an automated notification from the SharePoint Document Management System.
    `;

    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `📋 New Document: "${documentTitle}" - Action Required`,
      html: htmlContent,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Manager creation email sent successfully to ${to}:`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending manager creation email:", error);
    throw error;
  }
};

/**
 * Send document assignment email to users after manager approval
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.username - Recipient name
 * @param {string} options.documentTitle - Document title
 * @param {string} options.documentLink - Document link/path
 * @param {string} options.deadline - Document deadline
 * @param {string} options.createdBy - Creator name
 * @param {string} options.approvedBy - Approver name
 * @param {string} options.comment - Additional comments
 * @param {string} options.documentId - Document ID for task URL
 * @returns {Promise} - Email sending result
 */
exports.sendUserAssignmentEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentLink, deadline, createdBy, approvedBy, comment = "", documentId } = options;

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const taskUrl = `${baseUrl}/sharepoint/${documentId}`;

    const formattedDeadline = new Date(deadline).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">📋 Document Assignment</h1>
            <div style="width: 50px; height: 3px; background-color: #2563eb; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            A SharePoint document created by <strong>${createdBy}</strong> and approved by <strong>${approvedBy}</strong> requires your review and signature.
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
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}" 
               style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔗 Sign Document
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
      SharePoint Document Assignment Notification
      
      Dear ${username},
      
      A SharePoint document created by ${createdBy} and approved by ${approvedBy} requires your review and signature.
      
      Document Details:
      - Title: ${documentTitle}
      - Created by: ${createdBy}
      - Approved by: ${approvedBy}
      - Deadline: ${formattedDeadline}
      - Document Link: ${documentLink}
      ${comment ? `- Notes: ${comment}` : ""}
      
      Please sign the document: ${taskUrl}
      
      ---
      This is an automated notification from the SharePoint Document Management System.
    `;

    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `📋 Document Approved: "${documentTitle}" - Action Required`,
      html: htmlContent,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 User assignment email sent successfully to ${to}:`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending user assignment email:", error);
    throw error;
  }
};

/**
 * Send document disapproval email to creator
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.username - Recipient name
 * @param {string} options.documentTitle - Document title
 * @param {string} options.documentId - Document ID
 * @param {string} options.disapprovedBy - Disapprover name
 * @param {string} options.disapprovalNote - Disapproval reason
 * @param {boolean} options.isManagerDisapproval - Whether disapproval is by manager
 * @returns {Promise} - Email sending result
 */
exports.sendDisapprovalEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentId, disapprovedBy, disapprovalNote, isManagerDisapproval } = options;

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const documentUrl = `${baseUrl}/sharepoint/${documentId}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">❌ Document Disapproved</h1>
            <div style="width: 50px; height: 3px; background-color: #dc2626; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your SharePoint document "<strong>${documentTitle}</strong>" has been disapproved by <strong>${disapprovedBy}</strong>.
          </p>
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #dc2626;">
            <h3 style="color: #991b1b; margin: 0 0 10px 0;">📝 Reason for Disapproval</h3>
            <p style="color: #991b1b; margin: 0;">${disapprovalNote}</p>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Please review the feedback and relaunch the document after making necessary changes.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentUrl}" 
               style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔗 View Document
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>SharePoint Document Management System</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
      SharePoint Document Disapproval Notification
      
      Dear ${username},
      
      Your SharePoint document "${documentTitle}" has been disapproved by ${disapprovedBy}.
      
      Reason for Disapproval: ${disapprovalNote}
      
      Please review the feedback and relaunch the document: ${documentUrl}
      
      ---
      This is an automated notification from the SharePoint Document Management System.
    `;

    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `❌ Document Disapproved: "${documentTitle}"`,
      html: htmlContent,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Disapproval email sent successfully to ${to}:`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending disapproval email:", error);
    throw error;
  }
};

/**
 * Send document completion email to manager and creator
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.username - Recipient name
 * @param {string} options.documentTitle - Document title
 * @param {string} options.documentId - Document ID
 * @returns {Promise} - Email sending result
 */
exports.sendCompletionEmail = async (options) => {
  try {
    const { to, username, documentTitle, documentId } = options;

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const documentUrl = `${baseUrl}/sharepoint/${documentId}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">🎉 Document Completed</h1>
            <div style="width: 50px; height: 3px; background-color: #8b5cf6; margin: 10px auto;"></div>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            The SharePoint document "<strong>${documentTitle}</strong>" has been fully signed and is now complete.
          </p>
          <div style="background-color: #f3e8ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #8b5cf6;">
            <h3 style="color: #6b21a8; margin: 0 0 10px 0;">✨ Status: Completed</h3>
            <p style="color: #6b21a8; margin: 0;">The document is ready for final processing.</p>
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
              This is an automated notification from the <strong>SharePoint Document Management System</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
      SharePoint Document Completion Notification
      
      Dear ${username},
      
      The SharePoint document "${documentTitle}" has been fully signed and is now complete.
      
      View the document: ${documentUrl}
      
      ---
      This is an automated notification from the SharePoint Document Management System.
    `;

    const mailOptions = {
      from: `"SharePoint Document System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎉 Document Completed: "${documentTitle}"`,
      html: htmlContent,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Completion email sent successfully to ${to}:`, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending completion email:", error);
    throw error;
  }
};

/**
 * Send bulk emails (for user assignments or completion notifications)
 * @param {Array} emailList - Array of email options objects
 * @param {string} emailType - Type of email to send ("userAssignment" or "completion")
 * @returns {Promise} - Results of all email sending attempts
 */
exports.sendBulkEmails = async (emailList, emailType) => {
  try {
    console.log(`📧 Sending ${emailList.length} ${emailType} emails...`);

    const sendFunction = emailType === "userAssignment" ? exports.sendUserAssignmentEmail : exports.sendCompletionEmail;

    const results = await Promise.allSettled(
      emailList.map((emailOptions) => sendFunction(emailOptions)),
    );

    const successful = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.filter((result) => result.status === "rejected").length;

    console.log(`✅ Bulk email results: ${successful} successful, ${failed} failed`);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ Failed to send ${emailType} email to ${emailList[index].to}:`, result.reason);
      }
    });

    return {
      total: emailList.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    console.error(`❌ Error sending bulk ${emailType} emails:`, error);
    throw error;
  }
};