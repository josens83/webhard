import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import { createCanvas } from 'canvas';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface GenerateCertificateParams {
  userId: string;
  courseId: string;
  finalGrade?: number;
}

class CertificateService {
  private certificatesDir: string;

  constructor() {
    this.certificatesDir = path.join(process.cwd(), 'storage', 'certificates');
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.certificatesDir)) {
      fs.mkdirSync(this.certificatesDir, { recursive: true });
    }
  }

  /**
   * Generate a unique certificate number
   */
  private generateCertificateNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EDU-${timestamp}-${random}`;
  }

  /**
   * Generate verification code
   */
  private generateVerificationCode(): string {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  /**
   * Generate certificate PDF
   */
  private async generatePDF(data: {
    certificateNumber: string;
    studentName: string;
    courseName: string;
    completionDate: Date;
    grade?: number;
    issuerName: string;
    verificationCode: string;
  }): Promise<string> {
    const { certificateNumber, studentName, courseName, completionDate, grade, issuerName, verificationCode } = data;

    const fileName = `${certificateNumber}.pdf`;
    const filePath = path.join(this.certificatesDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Background and border
        doc
          .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
          .lineWidth(3)
          .strokeColor('#1e40af')
          .stroke();

        doc
          .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
          .lineWidth(1)
          .strokeColor('#3b82f6')
          .stroke();

        // Header - EduVault Logo
        doc
          .fontSize(32)
          .fillColor('#1e40af')
          .font('Helvetica-Bold')
          .text('EduVault', 0, 80, { align: 'center' });

        // Certificate Title
        doc
          .moveDown(0.5)
          .fontSize(28)
          .fillColor('#374151')
          .font('Helvetica')
          .text('Certificate of Completion', { align: 'center' });

        // Decorative line
        doc
          .moveTo(250, 180)
          .lineTo(doc.page.width - 250, 180)
          .strokeColor('#3b82f6')
          .lineWidth(2)
          .stroke();

        // Main content
        doc
          .moveDown(2)
          .fontSize(16)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text('This is to certify that', { align: 'center' });

        doc
          .moveDown(0.5)
          .fontSize(36)
          .fillColor('#1e40af')
          .font('Helvetica-Bold')
          .text(studentName, { align: 'center' });

        doc
          .moveDown(0.5)
          .fontSize(16)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text('has successfully completed the course', { align: 'center' });

        doc
          .moveDown(0.5)
          .fontSize(24)
          .fillColor('#374151')
          .font('Helvetica-Bold')
          .text(courseName, { align: 'center', width: doc.page.width - 200 });

        // Grade (if provided)
        if (grade) {
          doc
            .moveDown(0.5)
            .fontSize(14)
            .fillColor('#059669')
            .font('Helvetica-Bold')
            .text(`Final Grade: ${grade.toFixed(1)}%`, { align: 'center' });
        }

        // Completion date
        doc
          .moveDown(1)
          .fontSize(14)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text(`Date of Completion: ${completionDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`, { align: 'center' });

        // Issuer signature section
        const signatureY = doc.page.height - 200;
        doc
          .fontSize(12)
          .fillColor('#374151')
          .font('Helvetica-Bold')
          .text(issuerName, doc.page.width / 2 - 150, signatureY, {
            width: 300,
            align: 'center',
          });

        doc
          .moveTo(doc.page.width / 2 - 100, signatureY - 5)
          .lineTo(doc.page.width / 2 + 100, signatureY - 5)
          .strokeColor('#9ca3af')
          .lineWidth(1)
          .stroke();

        doc
          .fontSize(10)
          .fillColor('#6b7280')
          .font('Helvetica')
          .text('Director, EduVault', doc.page.width / 2 - 150, signatureY + 20, {
            width: 300,
            align: 'center',
          });

        // Footer - Certificate number and verification
        doc
          .fontSize(9)
          .fillColor('#9ca3af')
          .font('Helvetica')
          .text(`Certificate No: ${certificateNumber}`, 50, doc.page.height - 80, {
            align: 'left',
          });

        doc.text(`Verification Code: ${verificationCode}`, 50, doc.page.height - 65, {
          align: 'left',
        });

        doc
          .fontSize(8)
          .fillColor('#9ca3af')
          .text(
            'Verify this certificate at: https://eduvault.com/verify',
            0,
            doc.page.height - 50,
            { align: 'center' }
          );

        doc.end();

        stream.on('finish', () => {
          resolve(`/certificates/${fileName}`);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate and issue certificate
   */
  async issueCertificate(params: GenerateCertificateParams) {
    const { userId, courseId, finalGrade } = params;

    // Check if enrollment is completed
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId,
          courseId,
        },
      },
      include: {
        student: true,
        course: true,
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.status !== 'COMPLETED') {
      throw new Error('Course not completed yet');
    }

    // Check if certificate already exists
    const existing = await prisma.certificate.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (existing) {
      return existing;
    }

    // Generate certificate data
    const certificateNumber = this.generateCertificateNumber();
    const verificationCode = this.generateVerificationCode();

    // Generate PDF
    const certificateUrl = await this.generatePDF({
      certificateNumber,
      studentName: enrollment.student.displayName || enrollment.student.username,
      courseName: enrollment.course.title,
      completionDate: enrollment.completedAt || new Date(),
      grade: finalGrade || enrollment.finalGrade || undefined,
      issuerName: 'Dr. Sarah Johnson',
      verificationCode,
    });

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        userId,
        courseId,
        finalGrade: finalGrade || enrollment.finalGrade,
        completionDate: enrollment.completedAt || new Date(),
        issuerName: 'Dr. Sarah Johnson',
        issuerTitle: 'Director of Education',
        verificationCode,
        certificateUrl,
        isVerified: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return certificate;
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(verificationCode: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationCode },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!certificate) {
      return { valid: false, message: 'Invalid verification code' };
    }

    return {
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.user.displayName || certificate.user.username,
        courseName: certificate.course.title,
        completionDate: certificate.completionDate,
        finalGrade: certificate.finalGrade,
        issuedBy: certificate.issuerName,
      },
    };
  }

  /**
   * Get user certificates
   */
  async getUserCertificates(userId: string) {
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return certificates;
  }

  /**
   * Add blockchain hash to certificate (for future blockchain integration)
   */
  async addBlockchainHash(certificateId: string, blockchainHash: string, transactionHash: string) {
    const certificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        blockchainHash,
        blockchainTx: transactionHash,
      },
    });

    return certificate;
  }
}

export default new CertificateService();
