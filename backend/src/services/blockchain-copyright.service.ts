import { ethers } from 'ethers';
import { PrismaClient, LicenseType } from '@prisma/client';
import { create as createIPFSClient } from 'ipfs-http-client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

interface RegisterCopyrightParams {
  ownerId: string;
  fileId?: string;
  title: string;
  description?: string;
  licenseType: LicenseType;
  content?: Buffer;
}

interface IPFSUploadResult {
  hash: string;
  url: string;
}

class BlockchainCopyrightService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private ipfsClient: any;
  private contractAddress: string;
  private contractABI: any[];

  constructor() {
    this.initializeBlockchain();
    this.initializeIPFS();
    this.contractAddress = process.env.COPYRIGHT_CONTRACT_ADDRESS || '';

    // Simplified ABI for copyright registration
    this.contractABI = [
      {
        name: 'registerCopyright',
        type: 'function',
        inputs: [
          { name: 'ipfsHash', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'creator', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
        ],
        outputs: [{ name: 'tokenId', type: 'uint256' }],
      },
      {
        name: 'verifyCopyright',
        type: 'function',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [
          { name: 'ipfsHash', type: 'string' },
          { name: 'creator', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ];
  }

  /**
   * Initialize blockchain connection
   */
  private initializeBlockchain() {
    try {
      if (process.env.BLOCKCHAIN_RPC_URL && process.env.BLOCKCHAIN_PRIVATE_KEY) {
        this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, this.provider);
        console.log('Blockchain initialized successfully');
      } else {
        console.warn('Blockchain credentials not configured');
      }
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
    }
  }

  /**
   * Initialize IPFS client
   */
  private initializeIPFS() {
    try {
      // Connect to local IPFS node or Infura/Pinata
      this.ipfsClient = createIPFSClient({
        host: process.env.IPFS_HOST || 'ipfs.infura.io',
        port: parseInt(process.env.IPFS_PORT || '5001'),
        protocol: process.env.IPFS_PROTOCOL || 'https',
      });
      console.log('IPFS client initialized');
    } catch (error) {
      console.error('Failed to initialize IPFS:', error);
    }
  }

  /**
   * Calculate content hash
   */
  private calculateContentHash(content: Buffer | string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Upload content to IPFS
   */
  private async uploadToIPFS(content: Buffer, metadata: any): Promise<IPFSUploadResult> {
    try {
      // Upload content
      const contentResult = await this.ipfsClient.add(content);
      const contentHash = contentResult.path;

      // Upload metadata
      const metadataJSON = JSON.stringify(metadata);
      const metadataResult = await this.ipfsClient.add(metadataJSON);
      const metadataHash = metadataResult.path;

      return {
        hash: contentHash,
        url: `https://ipfs.io/ipfs/${contentHash}`,
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }

  /**
   * Register copyright on blockchain
   */
  private async registerOnBlockchain(
    ipfsHash: string,
    title: string,
    creatorAddress: string
  ): Promise<{ tokenId: string; transactionHash: string }> {
    if (!this.wallet || !this.provider) {
      throw new Error('Blockchain not initialized');
    }

    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.wallet);

      const timestamp = Math.floor(Date.now() / 1000);

      const tx = await contract.registerCopyright(ipfsHash, title, creatorAddress, timestamp);
      const receipt = await tx.wait();

      // Extract tokenId from transaction logs
      const tokenId = receipt.logs[0]?.topics[1] || '0';

      return {
        tokenId: tokenId.toString(),
        transactionHash: receipt.hash,
      };
    } catch (error) {
      console.error('Blockchain registration failed:', error);
      throw new Error('Failed to register on blockchain');
    }
  }

  /**
   * Register copyright for educational content
   */
  async registerCopyright(params: RegisterCopyrightParams) {
    const { ownerId, fileId, title, description, licenseType, content } = params;

    // Get owner information
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, username: true, email: true, isTeacher: true },
    });

    if (!owner) {
      throw new Error('Owner not found');
    }

    const currentYear = new Date().getFullYear();

    let ipfsHash = '';
    let transactionHash = '';
    let tokenId = '';

    // If content is provided and blockchain is configured
    if (content && this.wallet && this.ipfsClient) {
      try {
        // Prepare metadata
        const metadata = {
          title,
          description,
          creator: owner.username,
          creatorEmail: owner.email,
          licenseType,
          copyrightYear: currentYear,
          timestamp: new Date().toISOString(),
        };

        // Upload to IPFS
        const ipfsResult = await this.uploadToIPFS(content, metadata);
        ipfsHash = ipfsResult.hash;

        // Register on blockchain
        const blockchainResult = await this.registerOnBlockchain(
          ipfsHash,
          title,
          this.wallet.address
        );
        tokenId = blockchainResult.tokenId;
        transactionHash = blockchainResult.transactionHash;
      } catch (error) {
        console.error('Blockchain/IPFS registration failed:', error);
        // Continue without blockchain registration
      }
    }

    // Create copyright record in database
    const copyrightRecord = await prisma.copyrightRecord.create({
      data: {
        ownerId,
        fileId,
        title,
        description,
        copyrightYear: currentYear,
        blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || 'polygon',
        contractAddress: this.contractAddress || undefined,
        tokenId: tokenId || undefined,
        transactionHash: transactionHash || undefined,
        ipfsHash: ipfsHash || undefined,
        licenseType,
        isVerified: !!transactionHash,
        verifiedAt: transactionHash ? new Date() : undefined,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        file: true,
      },
    });

    return copyrightRecord;
  }

  /**
   * Verify copyright on blockchain
   */
  async verifyCopyrightOnChain(tokenId: string): Promise<{
    valid: boolean;
    data?: any;
  }> {
    if (!this.wallet || !this.provider) {
      return { valid: false };
    }

    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.wallet);

      const result = await contract.verifyCopyright(tokenId);

      return {
        valid: true,
        data: {
          ipfsHash: result[0],
          creator: result[1],
          timestamp: new Date(Number(result[2]) * 1000),
        },
      };
    } catch (error) {
      console.error('Blockchain verification failed:', error);
      return { valid: false };
    }
  }

  /**
   * Get copyright record by file ID
   */
  async getCopyrightByFileId(fileId: string) {
    const copyrightRecord = await prisma.copyrightRecord.findFirst({
      where: { fileId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return copyrightRecord;
  }

  /**
   * Get all copyright records for a user
   */
  async getUserCopyrights(userId: string) {
    const copyrights = await prisma.copyrightRecord.findMany({
      where: { ownerId: userId },
      include: {
        file: {
          select: {
            id: true,
            title: true,
            fileName: true,
            thumbnailPath: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return copyrights;
  }

  /**
   * Create NFT for educational content
   */
  async createContentNFT(copyrightId: string, metadataUrl: string) {
    const copyrightRecord = await prisma.copyrightRecord.findUnique({
      where: { id: copyrightId },
      include: {
        owner: true,
        file: true,
      },
    });

    if (!copyrightRecord) {
      throw new Error('Copyright record not found');
    }

    // Update record with NFT metadata
    const updated = await prisma.copyrightRecord.update({
      where: { id: copyrightId },
      data: {
        isNFT: true,
        nftMetadataUrl: metadataUrl,
      },
    });

    return updated;
  }

  /**
   * Check if content is original (simplified plagiarism check)
   */
  async checkOriginality(content: string, title: string): Promise<{
    isOriginal: boolean;
    similarityScore: number;
    matchedContent?: any[];
  }> {
    const contentHash = this.calculateContentHash(content);

    // Check for exact matches in database
    const existingRecords = await prisma.copyrightRecord.findMany({
      where: {
        title: {
          contains: title,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        owner: {
          select: {
            username: true,
          },
        },
        createdAt: true,
      },
    });

    // In production, implement more sophisticated similarity checking
    const similarityScore = existingRecords.length > 0 ? 50 : 0;
    const isOriginal = similarityScore < 30;

    return {
      isOriginal,
      similarityScore,
      matchedContent: existingRecords,
    };
  }
}

export default new BlockchainCopyrightService();
