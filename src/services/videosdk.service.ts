import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

@Injectable()
export class VideoSdkService {
  public driver: string;

  async getToken() {
    const API_KEY = process.env.VIDEOSDK_API_KEY;
    const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;
    // const options = { expiresIn: '10m', algorithm: 'HS256' };
    const payload = {
      apikey: API_KEY,
      permissions: ['allow_join', 'allow_mod', 'ask_join'], // Trigger permission.
    };
    const token = jwt.sign(payload, SECRET_KEY, {
      expiresIn: '10m',
      algorithm: 'HS256',
    });

    return token;
  }

  async createCall(userCallId: string) {
    try {
      const token = await this.getToken();
      const options = {
        headers: {
          authorization: `${token}`,
          'Content-Type': 'application/json',
        },
      };

      const body = { region: 'sg001', userCallId };

      const response = await axios.post(
        'https://api.videosdk.live/v1/calls',
        body,
        options,
      );

      // console.log(response.data);
      return { callDetails: response.data, token };
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async validateCallId(callId: string, token: string) {
    try {
      const options = {
        headers: {
          authorization: `${token}`,
        },
      };

      const response = await axios.post(
        `https://api.videosdk.live/v1/calls/${callId}`,
        options,
      );

      console.log(response);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async listCalls(token: string, params?: any) {
    const { page = 1, perPage = 20 } = params;
    try {
      const options = {
        headers: {
          authorization: `${token}`,
        },
      };

      const response = await axios.get(
        `https://api.videosdk.live/v1/calls/?page=${page}&perPage=${perPage}`,
        options,
      );

      console.log(response);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async listCallSessions(token: string, params?: any) {
    const { page = 1, perPage = 20, callId } = params;
    let url = `https://api.videosdk.live/v1/call-sessions/?page=${page}&perPage=${perPage}`;
    if (callId) {
      url = `https://api.videosdk.live/v1/call-sessions/?page=${page}&perPage=${perPage}&callId=${callId}`;
    }
    try {
      const options = {
        headers: {
          authorization: `${token}`,
        },
      };

      const response = await axios.get(url, options);

      console.log(response);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async getCallSession(token: string, id: string) {
    try {
      const options = {
        headers: {
          authorization: `${token}`,
        },
      };

      const response = await axios.get(
        `https://api.videosdk.live/v1/call-sessions/${id}`,
        options,
      );

      console.log(response);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async endCallSession(token: string, id: string) {
    try {
      const options = {
        headers: {
          authorization: `${token}`,
        },
      };

      const response = await axios.post(
        `https://api.videosdk.live/v1/call-sessions/${id}/end`,
        {},
        options,
      );

      console.log(response);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async removeParticipant(token: string, id: string, participantId: string) {
    try {
      const options = {
        headers: {
          authorization: `${token}`,
        },
      };

      const response = await axios.post(
        `https://api.videosdk.live/v1/call-sessions/${id}/remove-participant`,
        { participantId },
        options,
      );

      console.log(response);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async getCallRecordings(token: string, callId: string) {
    // const { callId, sessionId } = params;
    try {
      const options = {
        headers: {
          authorization: `${token}`,
        },
      };

      const response = await axios.get(
        `https://api.videosdk.live/v1/call-recordings/?callId=${callId}`,
        options,
      );

      console.log(response.data);
      return response.data;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async getRecordingDetails(token: string, id: string) {
    try {
      const options = {
        headers: {
          authorization: `${token}`,
        },
      };

      const response = await axios.get(
        `https://api.videosdk.live/v1/call-recordings/${id}`,
        options,
      );

      console.log(response);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
