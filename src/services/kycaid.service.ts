import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export interface EidvInterface {
    first_name: string;
    middle_name?: string;
    last_name: string;
    dob: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    ssn: string;
    drivers_license?: string;

}
@Injectable()
export class KycAidService {
    public baseUrl = 'https://api.kycaid.com';
    public options = {
        timeout: 1000 * 60,
        headers: {
            'content-type': 'application/json',
            'API-Key': process.env.KYCAID_API_KEY,
        },
    };

    async verifyEIDV(payload: EidvInterface) {
        console.log("🚀 ~ KycAidService ~ verifyEIDV ~ payload:", payload)
        try {
            const response = await axios.post(
                `${this.baseUrl}/services/us/eidv`,
                JSON.stringify(payload),
                this.options,
            );
            console.log("🚀 ~ KycAidService ~ verifyEIDV ~ response:", response.data)
            const { data } = response.data

            if (data.ssn_match_type == 'NO_MATCH') {
                throw new BadRequestException({
                    status: 'error',
                    message: 'Invalid SSN provided',
                    hasError: true,
                    score: data.score,
                });
            }

            if (data.name_match_type == 'NO_MATCH' && data.dob_match_type == 'NO_MATCH') {
                throw new BadRequestException({
                    status: 'error',
                    message: 'Name and DOB do not match SSN information',
                    hasError: true,
                    score: data.score,
                });
            }
            if (data.name_match_type == 'NO_MATCH') {
                throw new BadRequestException({
                    status: 'error',
                    message: 'Name does not match SSN information',
                    hasError: true,
                    score: data.score,
                });
            }

            if (data.dob_match_type == 'NO_MATCH') {
                throw new BadRequestException({
                    status: 'error',
                    message: 'DOB does not match SSN information',
                    hasError: true,
                    score: data.score,
                });
            }


            return data.score;
        } catch (error) {
            console.log("🚀 ~ KycAidService ~ verifyEIDV ~ error:", error.response)
            throw new BadRequestException({
                status: 'error',
                message: error.response?.hasError ? error.response?.message : 'Failed to verify SSN',
                data: { score: error.response?.score || 0 },
            });
        }
    }

}
