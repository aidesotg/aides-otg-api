import {
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LegalDocument } from 'src/modules/legal/interface/legal-document.interface';
import { LegalAgreement } from 'src/modules/legal/interface/legal-agreement.interface';
import {
  CreateLegalDocumentDto,
  UpdateLegalDocumentDto,
  SignAgreementDto,
  LegalDocumentQueryDto,
} from 'src/modules/legal/dto/legal.dto';
import { MiscCLass } from 'src/services/misc.service';
import { NotificationService } from 'src/modules/notification/services/notification.service';

@Injectable()
export class LegalService {
  constructor(
    @InjectModel('LegalDocument')
    private readonly legalDocumentModel: Model<LegalDocument>,
    @InjectModel('LegalAgreement')
    private readonly legalAgreementModel: Model<LegalAgreement>,
    private miscService: MiscCLass,
    private notificationService: NotificationService,
  ) {}

  async createLegalDocument(
    createLegalDocumentDto: CreateLegalDocumentDto,
    user: any,
  ) {
    let latestDocument: LegalDocument;
    let parentDocument: LegalDocument;
    if (createLegalDocumentDto.parent_document) {
      parentDocument = await this.legalDocumentModel
        .findOne({
          $or: [
            { _id: createLegalDocumentDto.parent_document },
            { parent_document: createLegalDocumentDto.parent_document },
          ],
          is_deleted: false,
        })
        .exec();
      if (!parentDocument) {
        throw new NotFoundException({
          status: 'error',
          message: 'Parent document not found',
        });
      }

      latestDocument = await this.legalDocumentModel
        .findOne({
          $or: [
            { _id: parentDocument._id },
            { parent_document: parentDocument._id },
          ],
          is_deleted: false,
        })
        .sort({ version: -1 })
        .exec();

      await this.legalDocumentModel.updateMany(
        {
          $or: [
            { _id: parentDocument._id },
            { parent_document: parentDocument._id },
          ],
          is_deleted: false,
          is_active: true,
        },
        {
          $set: {
            is_active: false,
          },
        },
      );
    }

    if (
      createLegalDocumentDto.version &&
      latestDocument &&
      createLegalDocumentDto.version >= latestDocument.version
    ) {
      throw new BadRequestException(
        'A newer version of this document already exists',
      );
    }

    const data = {
      ...createLegalDocumentDto,
      parent_document:
        parentDocument?.parent_document || parentDocument?._id || null,
      version:
        createLegalDocumentDto.version || latestDocument?.version + 0.1 || 1,
      created_by: user._id,
    };

    const newDocument = new this.legalDocumentModel(data);
    const document = await newDocument.save();

    // Notify users if document was updated
    //  if (data.version > document.version) {
    //   await this.notificationService.sendMessage({
    //     user: { _id: 'all' }, // This would need to be implemented to notify all users
    //     title: 'Legal Document Updated',
    //     message: `The legal document "${document.title}" has been updated. Please review and re-agree to the new version.`,
    //     resource: 'legal_document',
    //     resource_id: document._id.toString(),
    //   });
    // }

    return {
      status: 'success',
      message: 'Legal document created',
      data: document,
    };
  }

  async getLegalDocuments(params: any, user: any) {
    const { page = 1, pageSize = 50, role, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = { is_deleted: false };

    // Filter by user role if specified
    if (rest.role) {
      query.$or = [{ roles: { $in: [role] } }];
    }

    const documents = await this.legalDocumentModel
      .find(query)
      .populate('roles', ['name'])
      // .populate('created_by', ['fullname', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.legalDocumentModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      documents,
    };
  }

  async getDocumentHistory(id: string, params: any) {
    const { page = 1, pageSize = 50, role, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const document = await this.getLegalDocumentById(id);

    const query: any = await this.miscService.search(params);
    query.$or = [
      { _id: document.parent_document },
      { parent_document: document.parent_document },
    ];
    query.is_deleted = false;

    const documents = await this.legalDocumentModel
      .find(query)
      .populate('roles', ['name'])
      // .populate('created_by', ['fullname', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ version: -1 })
      .exec();

    const count = await this.legalDocumentModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      documents,
    };
  }

  async getLatestLegalDocument(title: string) {
    const document = await this.legalDocumentModel
      .findOne({ title, is_deleted: false, is_active: true })
      .populate('roles', ['name'])
      .sort({ version: -1 })
      .exec();

    return document;
  }

  async getLegalDocumentById(id: string) {
    const document = await this.legalDocumentModel
      .findOne({ _id: id, is_deleted: false })
      .populate('roles', ['name'])
      // .populate('created_by', ['fullname', 'email'])
      .populate('agreements')
      .exec();

    if (!document) {
      throw new NotFoundException({
        status: 'error',
        message: 'Legal document not found',
      });
    }

    return document;
  }

  async getDocumentAgreements(id: string, params: any) {
    const { page = 1, pageSize = 50 } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const agreements = await this.legalAgreementModel
      .find({ document: id, is_deleted: false })
      .populate('user', ['fullname', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.legalAgreementModel
      .countDocuments({ document: id, is_deleted: false })
      .exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      agreements,
    };
  }

  async getDocumentStats(id: string) {
    const document = await this.getLegalDocumentById(id);

    const totalAgreements = await this.legalAgreementModel
      .countDocuments({ document: id, is_deleted: false })
      .exec();

    const latestVersionAgreements = await this.legalAgreementModel
      .countDocuments({
        document: id,
        version: document.version,
        is_deleted: false,
      })
      .exec();

    return {
      document_version: document.version,
      total_agreements: totalAgreements,
      latest_version_agreements: latestVersionAgreements,
      agreement_percentage:
        totalAgreements > 0
          ? (latestVersionAgreements / totalAgreements) * 100
          : 0,
    };
  }

  async getUserAgreements(user: any) {
    const agreements = await this.legalAgreementModel
      .find({ user: user._id, is_deleted: false })
      .populate('document', ['title', 'version', 'agreement_type'])
      .sort({ createdAt: -1 })
      .exec();

    return agreements;
  }

  async updateLegalDocument(
    id: string,
    updateLegalDocumentDto: UpdateLegalDocumentDto,
  ) {
    const document = await this.legalDocumentModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!document) {
      throw new NotFoundException({
        status: 'error',
        message: 'Legal document not found',
      });
    }

    const data: any = { ...updateLegalDocumentDto };

    // If body is being updated, increment version
    // if (
    //   updateLegalDocumentDto.body &&
    //   updateLegalDocumentDto.body !== document.body
    // ) {
    //   data.version = document.version + 1;
    // }

    for (const value in data) {
      if (data[value] !== undefined) {
        document[value] = data[value];
      }
    }

    await document.save();

    // Notify users if document was updated
    // if (data.version > document.version) {
    //   await this.notificationService.sendMessage({
    //     user: { _id: 'all' }, // This would need to be implemented to notify all users
    //     title: 'Legal Document Updated',
    //     message: `The legal document "${document.title}" has been updated. Please review and re-agree to the new version.`,
    //     resource: 'legal_document',
    //     resource_id: document._id.toString(),
    //   });
    // }

    return {
      status: 'success',
      message: 'Legal document updated',
      data: document,
    };
  }

  async signAgreement(signAgreementDto: SignAgreementDto, user: any) {
    const document = await this.legalDocumentModel
      .findOne({
        _id: signAgreementDto.document_id,
        is_deleted: false,
        is_active: true,
      })
      .exec();

    if (!document) {
      throw new NotFoundException({
        status: 'error',
        message: 'Legal document not found or inactive',
      });
    }

    // Check if user already has an agreement for this document version
    const existingAgreement = await this.legalAgreementModel
      .findOne({
        document: signAgreementDto.document_id,
        user: user._id,
        version: document.version,
        is_deleted: false,
      })
      .exec();

    if (existingAgreement) {
      throw new BadRequestException(
        'You have already agreed to this document version',
      );
    }

    const agreement = new this.legalAgreementModel({
      document: signAgreementDto.document_id,
      user: user._id,
      version: document.version,
      agreement_type: document.agreement_type,
      signature_data: signAgreementDto.signature_data,
      ip_address: signAgreementDto.ip_address,
      user_agent: signAgreementDto.user_agent,
    });

    await agreement.save();

    return {
      status: 'success',
      message: 'Agreement signed successfully',
      data: { agreement },
    };
  }

  async activateDocument(id: string) {
    const document = await this.getLegalDocumentById(id);
    document.is_active = true;
    await document.save();

    return {
      status: 'success',
      message: 'Document activated successfully',
    };
  }

  async deactivateDocument(id: string) {
    const document = await this.getLegalDocumentById(id);
    document.is_active = false;
    await document.save();

    return {
      status: 'success',
      message: 'Document deactivated successfully',
    };
  }

  async deleteDocument(id: string) {
    const document = await this.getLegalDocumentById(id);
    document.is_deleted = true;
    await document.save();

    return {
      status: 'success',
      message: 'Document deleted successfully',
    };
  }
}
